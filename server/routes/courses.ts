import { Router, type Request, type Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { storage } from "../storage";
import { db } from "../db";
import { isAuthenticated } from "../replit_integrations/auth";
import { quizQuestions, QUIZ_PASS_THRESHOLD } from "@shared/schema";
import { and, inArray, isNull } from "drizzle-orm";
import { generateCertificatePdf, generateVerificationCode } from "../certificate";
import { sendCourseCommentToOwnerEmail, sendCourseCommentReplyToBuyerEmail } from "../emails";
import { authStorage } from "../replit_integrations/auth/storage";
import { makeUnsubscribeToken, verifyUnsubscribeToken } from "../crypto/unsubscribe-token";

export const coursesRouter = Router();

function getUserId(req: Request): string {
  return req.sellisyUserId!;
}

// ── Auth helper: owner of the store that owns the product ─────────────

async function requireProductOwner(req: Request, productId: string): Promise<
  | { ok: true; product: any }
  | { ok: false; status: number; message: string }
> {
  const product = await storage.getProductById(productId);
  if (!product) return { ok: false, status: 404, message: "Product not found" };
  if (product.ownerId !== getUserId(req)) {
    return { ok: false, status: 403, message: "Forbidden" };
  }
  return { ok: true, product };
}

// ── Auth helper: buyer has a valid download token covering this product

async function validateDownloadAccess(token: string, productId: string): Promise<
  | { ok: true; orderId: string }
  | { ok: false; status: number; message: string }
> {
  const dt = await storage.getDownloadTokenByHash(token);
  if (!dt) return { ok: false, status: 404, message: "Invalid token" };
  if (dt.revokedAt) return { ok: false, status: 410, message: "Access revoked" };
  if (new Date() > dt.expiresAt) return { ok: false, status: 410, message: "Token expired" };

  const items = await storage.getOrderItemsByOrder(dt.orderId);
  const hasProduct = items.some((it) => it.productId === productId);
  if (!hasProduct) return { ok: false, status: 403, message: "Token doesn't grant access to this course" };

  return { ok: true, orderId: dt.orderId };
}

// ── OWNER: course discovery dashboard ─────────────────────────────────

// GET /api/courses/my-courses — list all of the owner's course-type
// products with summary stats. Used by the dedicated Courses dashboard
// surface so owners can see their LMS at a glance.
coursesRouter.get("/my-courses", isAuthenticated, async (req: Request, res: Response) => {
  const ownerId = getUserId(req);
  const allProducts = await storage.getProductsByOwner(ownerId);
  const courses = allProducts.filter((p) => p.productType === "course");

  const out = await Promise.all(courses.map(async (p) => {
    const [lessons, modules] = await Promise.all([
      storage.getLessonsByProduct(p.id),
      storage.getModulesByProduct(p.id),
    ]);

    // Drip detection: any lesson or module with a non-null unlockAfterDays.
    const hasDrip =
      lessons.some((l) => l.unlockAfterDays != null) ||
      modules.some((m) => m.unlockAfterDays != null);

    // Quiz detection: any lesson with at least one (non-deleted) question.
    // Batched query to avoid N round-trips.
    const lessonIdsWithQuiz = lessons.length > 0
      ? new Set(
          (await db.select({ lessonId: quizQuestions.lessonId })
            .from(quizQuestions)
            .where(and(inArray(quizQuestions.lessonId, lessons.map((l) => l.id)), isNull(quizQuestions.deletedAt))))
            .map((r) => r.lessonId),
        )
      : new Set<string>();

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      thumbnailUrl: p.thumbnailUrl,
      priceCents: p.priceCents,
      status: p.status,
      lessonCount: lessons.length,
      moduleCount: modules.length,
      quizLessonCount: lessonIdsWithQuiz.size,
      hasDrip,
      certificatesEnabled: !!p.certificatesEnabled,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }));

  // Newest first.
  out.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(out);
});

// ── OWNER: lessons CRUD ───────────────────────────────────────────────

// GET /api/courses/products/:productId/lessons — owner view, full lesson list
coursesRouter.get("/products/:productId/lessons", isAuthenticated, async (req: Request, res: Response) => {
  const check = await requireProductOwner(req, String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const lessons = await storage.getLessonsByProduct(check.product.id);
  res.json(lessons);
});

// POST /api/courses/products/:productId/lessons — add lesson
const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(8000).optional(),
  videoUrl: z.string().max(1000).optional(),
  attachmentUrl: z.string().max(1000).optional(),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 24).optional(),
  moduleId: z.string().nullable().optional(),
  unlockAfterDays: z.number().int().min(0).max(365 * 2).nullable().optional(),
});

coursesRouter.post("/products/:productId/lessons", isAuthenticated, async (req: Request, res: Response) => {
  const check = await requireProductOwner(req, String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = createLessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  // If moduleId is provided, ensure it belongs to this product (no cross-product injection).
  if (parsed.data.moduleId) {
    const mod = await storage.getModuleById(parsed.data.moduleId);
    if (!mod || mod.productId !== check.product.id) {
      return res.status(400).json({ message: "Invalid moduleId for this course" });
    }
  }

  // Next sort order = number of lessons in the same scope (module or top-level).
  const existing = await storage.getLessonsByProduct(check.product.id);
  const scope = existing.filter((l) => (l.moduleId ?? null) === (parsed.data.moduleId ?? null));
  const nextSortOrder = scope.length;

  const lesson = await storage.createLesson({
    productId: check.product.id,
    moduleId: parsed.data.moduleId ?? null,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    videoUrl: parsed.data.videoUrl ?? null,
    attachmentUrl: parsed.data.attachmentUrl ?? null,
    durationSeconds: parsed.data.durationSeconds ?? null,
    unlockAfterDays: parsed.data.unlockAfterDays ?? null,
    sortOrder: nextSortOrder,
  });

  res.json(lesson);
});

// PATCH /api/courses/lessons/:id — update fields
const updateLessonSchema = createLessonSchema.partial();

coursesRouter.patch("/lessons/:id", isAuthenticated, async (req: Request, res: Response) => {
  const lesson = await storage.getLessonById(String(req.params.id));
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  const check = await requireProductOwner(req, lesson.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = updateLessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  // If moduleId is being changed, validate it belongs to the same product.
  if (parsed.data.moduleId) {
    const mod = await storage.getModuleById(parsed.data.moduleId);
    if (!mod || mod.productId !== check.product.id) {
      return res.status(400).json({ message: "Invalid moduleId for this course" });
    }
  }

  const updated = await storage.updateLesson(lesson.id, parsed.data);
  res.json(updated);
});

// DELETE /api/courses/lessons/:id
coursesRouter.delete("/lessons/:id", isAuthenticated, async (req: Request, res: Response) => {
  const lesson = await storage.getLessonById(String(req.params.id));
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  const check = await requireProductOwner(req, lesson.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  await storage.softDeleteLesson(lesson.id);
  res.json({ ok: true });
});

// POST /api/courses/products/:productId/lessons/reorder — replace order
const reorderSchema = z.object({
  lessonIds: z.array(z.string()).min(1).max(500),
});

coursesRouter.post("/products/:productId/lessons/reorder", isAuthenticated, async (req: Request, res: Response) => {
  const check = await requireProductOwner(req, String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  // Guard: every passed lessonId must belong to this product
  const owned = await storage.getLessonsByProduct(check.product.id);
  const ownedIds = new Set(owned.map((l) => l.id));
  const invalid = parsed.data.lessonIds.filter((id) => !ownedIds.has(id));
  if (invalid.length > 0) {
    return res.status(400).json({ message: "Reorder list contains lessons not belonging to this product" });
  }

  await storage.reorderLessons(check.product.id, parsed.data.lessonIds);
  res.json({ ok: true });
});

// ── OWNER: modules CRUD ───────────────────────────────────────────────

coursesRouter.get("/products/:productId/modules", isAuthenticated, async (req: Request, res: Response) => {
  const check = await requireProductOwner(req, String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const modules = await storage.getModulesByProduct(check.product.id);
  res.json(modules);
});

const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  unlockAfterDays: z.number().int().min(0).max(365 * 2).nullable().optional(),
});

coursesRouter.post("/products/:productId/modules", isAuthenticated, async (req: Request, res: Response) => {
  const check = await requireProductOwner(req, String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = createModuleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const existing = await storage.getModulesByProduct(check.product.id);
  const mod = await storage.createModule({
    productId: check.product.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    unlockAfterDays: parsed.data.unlockAfterDays ?? null,
    sortOrder: existing.length,
  });
  res.json(mod);
});

const updateModuleSchema = createModuleSchema.partial();

coursesRouter.patch("/modules/:id", isAuthenticated, async (req: Request, res: Response) => {
  const mod = await storage.getModuleById(String(req.params.id));
  if (!mod) return res.status(404).json({ message: "Module not found" });

  const check = await requireProductOwner(req, mod.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = updateModuleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const updated = await storage.updateModule(mod.id, parsed.data);
  res.json(updated);
});

coursesRouter.delete("/modules/:id", isAuthenticated, async (req: Request, res: Response) => {
  const mod = await storage.getModuleById(String(req.params.id));
  if (!mod) return res.status(404).json({ message: "Module not found" });

  const check = await requireProductOwner(req, mod.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  // softDeleteModule also un-modules lessons inside it so they survive.
  await storage.softDeleteModule(mod.id);
  res.json({ ok: true });
});

const reorderModulesSchema = z.object({
  moduleIds: z.array(z.string()).min(1).max(200),
});

coursesRouter.post("/products/:productId/modules/reorder", isAuthenticated, async (req: Request, res: Response) => {
  const check = await requireProductOwner(req, String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = reorderModulesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const owned = await storage.getModulesByProduct(check.product.id);
  const ownedIds = new Set(owned.map((m) => m.id));
  const invalid = parsed.data.moduleIds.filter((id) => !ownedIds.has(id));
  if (invalid.length > 0) {
    return res.status(400).json({ message: "Reorder list contains modules not belonging to this product" });
  }

  await storage.reorderModules(check.product.id, parsed.data.moduleIds);
  res.json({ ok: true });
});

// ── OWNER: quiz questions + choices ───────────────────────────────────

// GET /api/courses/lessons/:lessonId/questions — owner view (incl. correct flags)
coursesRouter.get("/lessons/:lessonId/questions", isAuthenticated, async (req: Request, res: Response) => {
  const lesson = await storage.getLessonById(String(req.params.lessonId));
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  const check = await requireProductOwner(req, lesson.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const questions = await storage.getQuestionsByLesson(lesson.id);
  const choices = await storage.getChoicesByQuestionIds(questions.map((q) => q.id));
  const byQuestion = new Map<string, typeof choices>();
  for (const c of choices) {
    const arr = byQuestion.get(c.questionId) || [];
    arr.push(c);
    byQuestion.set(c.questionId, arr);
  }
  res.json(questions.map((q) => ({
    ...q,
    choices: byQuestion.get(q.id) || [],
  })));
});

// POST /api/courses/lessons/:lessonId/questions — add a question with choices
const choiceItemSchema = z.object({
  label: z.string().min(1).max(500),
  isCorrect: z.boolean(),
});

// For "single" questions exactly one choice must be correct; for "multi" at
// least one must be correct (but not all — otherwise the question is trivial).
function validateChoiceShape(
  questionType: "single" | "multi",
  choices: { isCorrect: boolean }[],
): string | null {
  const correct = choices.filter((c) => c.isCorrect).length;
  if (questionType === "single") {
    return correct === 1 ? null : "Single-choice questions must have exactly one correct answer.";
  }
  if (correct < 1) return "Multi-choice questions need at least one correct answer.";
  if (correct >= choices.length) return "Multi-choice questions need at least one wrong answer.";
  return null;
}

const createQuestionSchema = z.object({
  prompt: z.string().min(1).max(2000),
  questionType: z.enum(["single", "multi"]).default("single"),
  choices: z.array(choiceItemSchema).min(2).max(8),
});

coursesRouter.post("/lessons/:lessonId/questions", isAuthenticated, async (req: Request, res: Response) => {
  const lesson = await storage.getLessonById(String(req.params.lessonId));
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  const check = await requireProductOwner(req, lesson.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = createQuestionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const shapeError = validateChoiceShape(parsed.data.questionType, parsed.data.choices);
  if (shapeError) return res.status(400).json({ message: shapeError });

  const existing = await storage.getQuestionsByLesson(lesson.id);
  const question = await storage.createQuestion({
    lessonId: lesson.id,
    prompt: parsed.data.prompt,
    questionType: parsed.data.questionType,
    sortOrder: existing.length,
  });
  const choices = await storage.replaceChoicesForQuestion(question.id, parsed.data.choices);
  res.json({ ...question, choices });
});

// PATCH /api/courses/questions/:id — update prompt, type, and/or replace choices
const updateQuestionSchema = z.object({
  prompt: z.string().min(1).max(2000).optional(),
  questionType: z.enum(["single", "multi"]).optional(),
  choices: z.array(choiceItemSchema).min(2).max(8).optional(),
});

coursesRouter.patch("/questions/:id", isAuthenticated, async (req: Request, res: Response) => {
  const question = await storage.getQuestionById(String(req.params.id));
  if (!question) return res.status(404).json({ message: "Question not found" });
  const lesson = await storage.getLessonById(question.lessonId);
  if (!lesson) return res.status(404).json({ message: "Parent lesson not found" });
  const check = await requireProductOwner(req, lesson.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = updateQuestionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  // Validate the resulting (type, choices) combo — using the new value when
  // provided, otherwise the existing one — so the row never ends up in an
  // invalid shape mid-edit.
  const effectiveType = parsed.data.questionType ?? question.questionType;
  if (parsed.data.choices) {
    const shapeError = validateChoiceShape(effectiveType, parsed.data.choices);
    if (shapeError) return res.status(400).json({ message: shapeError });
  } else if (parsed.data.questionType && parsed.data.questionType !== question.questionType) {
    // Type changed without sending new choices — re-validate against existing.
    const existingChoices = await storage.getChoicesByQuestion(question.id);
    const shapeError = validateChoiceShape(effectiveType, existingChoices);
    if (shapeError) return res.status(400).json({ message: shapeError });
  }

  let updated = question;
  const patch: { prompt?: string; questionType?: "single" | "multi" } = {};
  if (parsed.data.prompt !== undefined) patch.prompt = parsed.data.prompt;
  if (parsed.data.questionType !== undefined) patch.questionType = parsed.data.questionType;
  if (Object.keys(patch).length > 0) {
    updated = (await storage.updateQuestion(question.id, patch))!;
  }
  let choices = await storage.getChoicesByQuestion(question.id);
  if (parsed.data.choices) {
    choices = await storage.replaceChoicesForQuestion(question.id, parsed.data.choices);
  }
  res.json({ ...updated, choices });
});

// DELETE /api/courses/questions/:id
coursesRouter.delete("/questions/:id", isAuthenticated, async (req: Request, res: Response) => {
  const question = await storage.getQuestionById(String(req.params.id));
  if (!question) return res.status(404).json({ message: "Question not found" });
  const lesson = await storage.getLessonById(question.lessonId);
  if (!lesson) return res.status(404).json({ message: "Parent lesson not found" });
  const check = await requireProductOwner(req, lesson.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  await storage.softDeleteQuestion(question.id);
  res.json({ ok: true });
});

// ── CUSTOMER: lesson access via download token ────────────────────────

// Compute the effective unlock day for a lesson by taking the MAX of its
// own unlockAfterDays and its module's unlockAfterDays. Returns null when
// no drip applies (lesson is always available).
function effectiveUnlockDay(lessonDays: number | null, moduleDays: number | null): number | null {
  if (lessonDays == null && moduleDays == null) return null;
  return Math.max(lessonDays ?? 0, moduleDays ?? 0);
}

// GET /api/courses/access/:token/:productId — lessons + progress + drip status
coursesRouter.get("/access/:token/:productId", async (req: Request, res: Response) => {
  const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const product = await storage.getProductById(String(req.params.productId));
  if (!product) return res.status(404).json({ message: "Course not found" });

  const order = await storage.getOrderById(check.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const [lessons, modules, progress] = await Promise.all([
    storage.getLessonsByProduct(product.id),
    storage.getModulesByProduct(product.id),
    storage.getLessonProgressForOrder(check.orderId),
  ]);
  const completedSet = new Set(progress.map((p) => p.lessonId));
  const moduleById = new Map(modules.map((m) => [m.id, m]));

  // Which lessons have a quiz? One query, batched.
  const allLessonIds = lessons.map((l) => l.id);
  const questionRows = allLessonIds.length
    ? await db.select({ lessonId: quizQuestions.lessonId, id: quizQuestions.id })
        .from(quizQuestions)
        .where(and(inArray(quizQuestions.lessonId, allLessonIds), isNull(quizQuestions.deletedAt)))
    : [];
  const hasQuizSet = new Set(questionRows.map((r) => r.lessonId));

  const orderCreatedAt = new Date(order.createdAt);
  const now = new Date();

  res.json({
    course: {
      id: product.id,
      title: product.title,
      description: product.description,
      thumbnailUrl: product.thumbnailUrl,
      certificatesEnabled: !!product.certificatesEnabled,
    },
    modules: modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      sortOrder: m.sortOrder,
      unlockAfterDays: m.unlockAfterDays,
    })),
    lessons: lessons.map((l) => {
      const mod = l.moduleId ? moduleById.get(l.moduleId) : null;
      const effective = effectiveUnlockDay(l.unlockAfterDays, mod?.unlockAfterDays ?? null);
      const unlocksAt = effective != null
        ? new Date(orderCreatedAt.getTime() + effective * 24 * 60 * 60 * 1000)
        : null;
      const locked = !!(unlocksAt && unlocksAt > now);
      return {
        id: l.id,
        moduleId: l.moduleId,
        title: l.title,
        // Hide content fields for locked lessons. The buyer sees the title
        // + unlock countdown but not the video/attachment.
        description: locked ? null : l.description,
        videoUrl: locked ? null : l.videoUrl,
        attachmentUrl: locked ? null : l.attachmentUrl,
        durationSeconds: l.durationSeconds,
        sortOrder: l.sortOrder,
        unlockAfterDays: l.unlockAfterDays,
        unlocksAt: unlocksAt ? unlocksAt.toISOString() : null,
        locked,
        completed: completedSet.has(l.id),
        hasQuiz: hasQuizSet.has(l.id),
      };
    }),
    completedCount: progress.length,
    totalCount: lessons.length,
  });
});

// POST /api/courses/access/:token/:productId/lessons/:lessonId/complete
coursesRouter.post("/access/:token/:productId/lessons/:lessonId/complete", async (req: Request, res: Response) => {
  const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const lesson = await storage.getLessonById(String(req.params.lessonId));
  if (!lesson || lesson.productId !== String(req.params.productId)) {
    return res.status(404).json({ message: "Lesson not found" });
  }

  // Reject mark-complete on a still-locked drip lesson. The client UI
  // already hides the button, but the server is the source of truth.
  const order = await storage.getOrderById(check.orderId);
  if (order) {
    const mod = lesson.moduleId ? await storage.getModuleById(lesson.moduleId) : null;
    const effective = effectiveUnlockDay(lesson.unlockAfterDays, mod?.unlockAfterDays ?? null);
    if (effective != null) {
      const unlocksAt = new Date(new Date(order.createdAt).getTime() + effective * 24 * 60 * 60 * 1000);
      if (unlocksAt > new Date()) {
        return res.status(403).json({ message: "Lesson hasn't unlocked yet" });
      }
    }
  }

  // Quiz-gated lessons can't be marked complete manually — the buyer must
  // pass the quiz via /quiz/submit. (Quiz submission auto-marks complete.)
  if (await storage.hasLessonQuiz(lesson.id)) {
    return res.status(403).json({ message: "Pass the quiz to complete this lesson." });
  }

  const row = await storage.markLessonComplete({
    lessonId: lesson.id,
    orderId: check.orderId,
  });
  res.json(row);
});

// ── CUSTOMER: take quiz ───────────────────────────────────────────────

// GET /api/courses/access/:token/:productId/lessons/:lessonId/quiz
// Returns questions + choices (without is_correct flag) for the buyer to take.
// Blocks if the lesson is locked.
coursesRouter.get("/access/:token/:productId/lessons/:lessonId/quiz", async (req: Request, res: Response) => {
  const accessCheck = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
  if (!accessCheck.ok) return res.status(accessCheck.status).json({ message: accessCheck.message });

  const lesson = await storage.getLessonById(String(req.params.lessonId));
  if (!lesson || lesson.productId !== String(req.params.productId)) {
    return res.status(404).json({ message: "Lesson not found" });
  }

  // Lock check
  const order = await storage.getOrderById(accessCheck.orderId);
  if (order) {
    const mod = lesson.moduleId ? await storage.getModuleById(lesson.moduleId) : null;
    const effective = effectiveUnlockDay(lesson.unlockAfterDays, mod?.unlockAfterDays ?? null);
    if (effective != null) {
      const unlocksAt = new Date(new Date(order.createdAt).getTime() + effective * 24 * 60 * 60 * 1000);
      if (unlocksAt > new Date()) {
        return res.status(403).json({ message: "Lesson hasn't unlocked yet" });
      }
    }
  }

  const questions = await storage.getQuestionsByLesson(lesson.id);
  const allChoices = await storage.getChoicesByQuestionIds(questions.map((q) => q.id));
  const byQuestion = new Map<string, typeof allChoices>();
  for (const c of allChoices) {
    const arr = byQuestion.get(c.questionId) || [];
    arr.push(c);
    byQuestion.set(c.questionId, arr);
  }

  // Existing passing attempt → tell client so it can show "already passed"
  const passingAttempt = await storage.getLatestPassingAttempt(lesson.id, accessCheck.orderId);

  res.json({
    questions: questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      questionType: q.questionType,
      sortOrder: q.sortOrder,
      choices: (byQuestion.get(q.id) || []).map((c) => ({
        id: c.id,
        label: c.label,
        sortOrder: c.sortOrder,
        // NOTE: is_correct deliberately omitted — would leak the answer.
      })),
    })),
    passThreshold: QUIZ_PASS_THRESHOLD,
    previouslyPassed: !!passingAttempt,
    previousBestScore: passingAttempt
      ? { correctCount: passingAttempt.correctCount, totalCount: passingAttempt.totalCount }
      : null,
  });
});

// POST /api/courses/access/:token/:productId/lessons/:lessonId/quiz/submit
// Body: { answers: [{ questionId, choiceIds: string[] }] }
// Scores server-side, records the attempt, marks lesson complete if passed.
//
// For "single" questions, choiceIds must have exactly one entry. For "multi",
// the answer scores only if it's the exact set of correct choices (all corrects
// selected, no incorrects selected).
const submitQuizSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    choiceIds: z.array(z.string()).min(0).max(20),
  })).min(1).max(100),
});

coursesRouter.post("/access/:token/:productId/lessons/:lessonId/quiz/submit", async (req: Request, res: Response) => {
  const accessCheck = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
  if (!accessCheck.ok) return res.status(accessCheck.status).json({ message: accessCheck.message });

  const lesson = await storage.getLessonById(String(req.params.lessonId));
  if (!lesson || lesson.productId !== String(req.params.productId)) {
    return res.status(404).json({ message: "Lesson not found" });
  }

  // Drip-lock check — the GET /quiz endpoint blocks fetching questions for
  // a locked lesson, but a buyer could submit blind via curl. Block here too.
  const order = await storage.getOrderById(accessCheck.orderId);
  if (order) {
    const mod = lesson.moduleId ? await storage.getModuleById(lesson.moduleId) : null;
    const effective = effectiveUnlockDay(lesson.unlockAfterDays, mod?.unlockAfterDays ?? null);
    if (effective != null) {
      const unlocksAt = new Date(new Date(order.createdAt).getTime() + effective * 24 * 60 * 60 * 1000);
      if (unlocksAt > new Date()) {
        return res.status(403).json({ message: "Lesson hasn't unlocked yet" });
      }
    }
  }

  const parsed = submitQuizSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const questions = await storage.getQuestionsByLesson(lesson.id);
  if (questions.length === 0) {
    return res.status(400).json({ message: "This lesson has no quiz." });
  }

  const allChoices = await storage.getChoicesByQuestionIds(questions.map((q) => q.id));

  // Map question → set of valid choice ids (used to reject answers that
  // reference a choice from another question) and set of correct choice ids
  // (used for grading).
  const validChoicesByQuestion = new Map<string, Set<string>>();
  const correctByQuestion = new Map<string, Set<string>>();
  for (const q of questions) {
    validChoicesByQuestion.set(q.id, new Set());
    correctByQuestion.set(q.id, new Set());
  }
  for (const c of allChoices) {
    validChoicesByQuestion.get(c.questionId)?.add(c.id);
    if (c.isCorrect) correctByQuestion.get(c.questionId)?.add(c.id);
  }

  // Each answer's questionId must be in this lesson's question set,
  // and each choiceId must belong to that question.
  const allowedQuestionIds = new Set(questions.map((q) => q.id));
  for (const a of parsed.data.answers) {
    if (!allowedQuestionIds.has(a.questionId)) {
      return res.status(400).json({ message: "Answer references a question not in this quiz." });
    }
    const validSet = validChoicesByQuestion.get(a.questionId)!;
    for (const cid of a.choiceIds) {
      if (!validSet.has(cid)) {
        return res.status(400).json({ message: "Answer references a choice not in this question." });
      }
    }
  }

  // Score: per-question exact-set match. For single, exactly one choice; for
  // multi, the set must equal the set of correct choices. Missing answers
  // count as wrong.
  const answerByQuestion = new Map<string, Set<string>>();
  for (const a of parsed.data.answers) answerByQuestion.set(a.questionId, new Set(a.choiceIds));

  const setsEqual = (a: Set<string>, b: Set<string>) => {
    if (a.size !== b.size) return false;
    for (const v of Array.from(a)) if (!b.has(v)) return false;
    return true;
  };

  let correctCount = 0;
  for (const q of questions) {
    const given = answerByQuestion.get(q.id) ?? new Set<string>();
    const expected = correctByQuestion.get(q.id) ?? new Set<string>();
    if (q.questionType === "single") {
      // For single questions: exactly one selection AND it equals the correct id.
      if (given.size === 1 && setsEqual(given, expected)) correctCount++;
    } else {
      if (setsEqual(given, expected)) correctCount++;
    }
  }
  const totalCount = questions.length;
  const score = correctCount / totalCount;
  const passed = score >= QUIZ_PASS_THRESHOLD;

  await storage.createQuizAttempt({
    lessonId: lesson.id,
    orderId: accessCheck.orderId,
    correctCount,
    totalCount,
    passed,
  });

  if (passed) {
    // Auto-complete the lesson on a passing attempt. markLessonComplete is
    // idempotent on the (lessonId, orderId) unique index.
    await storage.markLessonComplete({
      lessonId: lesson.id,
      orderId: accessCheck.orderId,
    });
  }

  res.json({
    correctCount,
    totalCount,
    passed,
    passThreshold: QUIZ_PASS_THRESHOLD,
    // Server reveals correct answers AFTER submission so the buyer can learn.
    review: questions.map((q) => ({
      questionId: q.id,
      yourChoiceIds: Array.from(answerByQuestion.get(q.id) ?? new Set<string>()),
      correctChoiceIds: Array.from(correctByQuestion.get(q.id) ?? new Set<string>()),
    })),
  });
});

// DELETE /api/courses/access/:token/:productId/lessons/:lessonId/complete — unmark
coursesRouter.delete("/access/:token/:productId/lessons/:lessonId/complete", async (req: Request, res: Response) => {
  const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  await storage.unmarkLessonComplete(String(req.params.lessonId), check.orderId);
  res.json({ ok: true });
});

// ── COMMENTS (lesson discussion, flat) ────────────────────────────────

// Comments are PUBLIC (token-gated for buyers; auth-gated for owners).
// Anyone with a valid course access token can read.
coursesRouter.get("/access/:token/:productId/lessons/:lessonId/comments", async (req: Request, res: Response) => {
  const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const lesson = await storage.getLessonById(String(req.params.lessonId));
  if (!lesson || lesson.productId !== String(req.params.productId)) {
    return res.status(404).json({ message: "Lesson not found" });
  }

  // Lock check — locked lessons hide comments too.
  const order = await storage.getOrderById(check.orderId);
  if (order) {
    const mod = lesson.moduleId ? await storage.getModuleById(lesson.moduleId) : null;
    const effective = effectiveUnlockDay(lesson.unlockAfterDays, mod?.unlockAfterDays ?? null);
    if (effective != null) {
      const unlocksAt = new Date(new Date(order.createdAt).getTime() + effective * 24 * 60 * 60 * 1000);
      if (unlocksAt > new Date()) {
        return res.status(403).json({ message: "Lesson hasn't unlocked yet" });
      }
    }
  }

  const rows = await storage.getCommentsByLesson(lesson.id);

  // The buyer should see their own comments highlighted as "you", but
  // never email addresses of other buyers — privacy. Strip authorEmail
  // unless it's owner-posted (owner identity is the store, not personal).
  res.json(rows.map((c) => ({
    id: c.id,
    body: c.body,
    parentId: c.parentId,
    authorType: c.authorType,
    authorName: c.authorName,
    isPinned: c.isPinned,
    isMine: c.orderId === check.orderId,
    editedAt: c.editedAt,
    createdAt: c.createdAt,
  })));
});

// Rate limit buyers posting comments to deter spam.
// 10 comments per 10 minutes per IP, plus per-order check in handler.
const commentPostLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Slow down — too many comments. Try again in a few minutes." },
});

const postCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  authorName: z.string().min(1).max(80).optional(),
  parentId: z.string().max(64).optional(),
});

coursesRouter.post(
  "/access/:token/:productId/lessons/:lessonId/comments",
  commentPostLimiter,
  async (req: Request, res: Response) => {
    const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const lesson = await storage.getLessonById(String(req.params.lessonId));
    if (!lesson || lesson.productId !== String(req.params.productId)) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const order = await storage.getOrderById(check.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Don't allow posting on a locked lesson.
    const mod = lesson.moduleId ? await storage.getModuleById(lesson.moduleId) : null;
    const effective = effectiveUnlockDay(lesson.unlockAfterDays, mod?.unlockAfterDays ?? null);
    if (effective != null) {
      const unlocksAt = new Date(new Date(order.createdAt).getTime() + effective * 24 * 60 * 60 * 1000);
      if (unlocksAt > new Date()) {
        return res.status(403).json({ message: "Lesson hasn't unlocked yet" });
      }
    }

    // Per-order rate: a single buyer can post at most 20 comments per hour
    // across the whole course. Deters one-buyer spam regardless of IP.
    const recentByOrder = await storage.countRecentCommentsByOrder(check.orderId, 60);
    if (recentByOrder >= 20) {
      return res.status(429).json({ message: "You've posted a lot recently. Take a break and try again later." });
    }

    const parsed = postCommentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    // Validate parentId — must reference a non-deleted comment on the same lesson,
    // and that comment must itself be top-level (no nested replies).
    let parentId: string | null = null;
    if (parsed.data.parentId) {
      const parent = await storage.getCommentById(parsed.data.parentId);
      if (!parent || parent.lessonId !== lesson.id) {
        return res.status(400).json({ message: "Parent comment not found." });
      }
      if (parent.parentId) {
        return res.status(400).json({ message: "Cannot reply to a reply." });
      }
      parentId = parent.id;
    }

    const comment = await storage.createComment({
      lessonId: lesson.id,
      productId: lesson.productId,
      storeId: order.storeId,
      parentId,
      authorType: "buyer",
      userId: null,
      orderId: check.orderId,
      authorName: parsed.data.authorName?.trim() || (order.buyerEmail.split("@")[0]),
      authorEmail: order.buyerEmail,
      body: parsed.data.body.trim(),
      isPinned: false,
    });

    // Notify the product owner — best-effort, never block the response.
    (async () => {
      try {
        const product = await storage.getProductById(lesson.productId);
        if (!product?.ownerId) return;
        const owner = await authStorage.getUser(product.ownerId);
        if (!owner?.email) return;
        const store = await storage.getStoreById(order.storeId);
        const appUrl = (process.env.APP_URL || "https://sellisy.com").replace(/\/$/, "");
        await sendCourseCommentToOwnerEmail({
          ownerEmail: owner.email,
          storeName: store?.name ?? "your store",
          courseTitle: product.title,
          lessonTitle: lesson.title,
          authorName: comment.authorName || "A buyer",
          bodyExcerpt: comment.body,
          dashboardUrl: `${appUrl}/dashboard/my-products`,
        });
      } catch (e) {
        console.error("[course-comment] owner notify failed:", e);
      }
    })();

    res.json({
      id: comment.id,
      body: comment.body,
      parentId: comment.parentId,
      authorType: comment.authorType,
      authorName: comment.authorName,
      isPinned: comment.isPinned,
      isMine: true,
      editedAt: comment.editedAt,
      createdAt: comment.createdAt,
    });
  },
);

// Buyer can edit their own comment body.
const editCommentSchema = z.object({ body: z.string().min(1).max(2000) });

coursesRouter.patch(
  "/access/:token/:productId/lessons/:lessonId/comments/:commentId",
  async (req: Request, res: Response) => {
    const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const comment = await storage.getCommentById(String(req.params.commentId));
    if (!comment || comment.lessonId !== String(req.params.lessonId)) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.orderId !== check.orderId) {
      return res.status(403).json({ message: "You can only edit your own comments." });
    }

    const parsed = editCommentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    await storage.editComment(comment.id, parsed.data.body.trim());
    res.json({ ok: true });
  },
);

// Buyer can delete their own comments.
coursesRouter.delete(
  "/access/:token/:productId/lessons/:lessonId/comments/:commentId",
  async (req: Request, res: Response) => {
    const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const comment = await storage.getCommentById(String(req.params.commentId));
    if (!comment || comment.lessonId !== String(req.params.lessonId)) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.orderId !== check.orderId) {
      return res.status(403).json({ message: "You can only delete your own comments." });
    }

    await storage.softDeleteComment(comment.id);
    res.json({ ok: true });
  },
);

// ── OWNER: comment moderation ─────────────────────────────────────────

// GET — owner moderation view, includes everything (author email, etc.)
coursesRouter.get("/lessons/:lessonId/comments", isAuthenticated, async (req: Request, res: Response) => {
  const lesson = await storage.getLessonById(String(req.params.lessonId));
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  const check = await requireProductOwner(req, lesson.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const rows = await storage.getCommentsByLesson(lesson.id);
  res.json(rows.map((c) => ({
    id: c.id,
    body: c.body,
    parentId: c.parentId,
    authorType: c.authorType,
    authorName: c.authorName,
    authorEmail: c.authorEmail,  // owner sees full email for moderation
    isPinned: c.isPinned,
    editedAt: c.editedAt,
    createdAt: c.createdAt,
  })));
});

const ownerPostCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  parentId: z.string().max(64).optional(),
});

// Owners can also post (as "owner") on a lesson — visible badge in UI.
coursesRouter.post("/lessons/:lessonId/comments", isAuthenticated, async (req: Request, res: Response) => {
  const lesson = await storage.getLessonById(String(req.params.lessonId));
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  const check = await requireProductOwner(req, lesson.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = ownerPostCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  // storeId is denormalized for future "all comments across my store" queries.
  // A product can live in N stores via store_products; we pick the owner's first
  // store containing this product. If they have none (e.g. unlinked product),
  // we fall back to the userId — the column is NOT NULL so we need *some* value.
  const ownerStores = await storage.getStoresByOwner(getUserId(req));
  let storeId: string = getUserId(req);
  for (const s of ownerStores) {
    const sp = await storage.getStoreProductByStoreAndProduct(s.id, lesson.productId);
    if (sp) { storeId = s.id; break; }
  }

  // Resolve + validate parent (same rules as buyer flow).
  let parentId: string | null = null;
  if (parsed.data.parentId) {
    const parent = await storage.getCommentById(parsed.data.parentId);
    if (!parent || parent.lessonId !== lesson.id) {
      return res.status(400).json({ message: "Parent comment not found." });
    }
    if (parent.parentId) {
      return res.status(400).json({ message: "Cannot reply to a reply." });
    }
    parentId = parent.id;
  }

  const comment = await storage.createComment({
    lessonId: lesson.id,
    productId: lesson.productId,
    storeId,
    parentId,
    authorType: "owner",
    userId: getUserId(req),
    orderId: null,
    authorName: "Instructor",
    authorEmail: null,
    body: parsed.data.body.trim(),
    isPinned: false,
  });

  // Notify everyone who's previously commented on this lesson AND has
  // notifications turned on — best-effort, never blocks the response.
  // Self-emails (owner who tested as buyer) are filtered out.
  (async () => {
    try {
      const recipients = await storage.getCommentNotifyRecipientsForLesson(lesson.id);
      if (recipients.length === 0) return;
      const ownerUser = await authStorage.getUser(getUserId(req));
      const ownerEmail = ownerUser?.email?.toLowerCase() ?? null;
      const filtered = ownerEmail
        ? recipients.filter((r) => r.email.toLowerCase() !== ownerEmail)
        : recipients;
      if (filtered.length === 0) return;

      const product = await storage.getProductById(lesson.productId);
      const store = ownerStores.find((s) => s.id === storeId) ?? ownerStores[0] ?? null;
      const appUrl = (process.env.APP_URL || "https://sellisy.com").replace(/\/$/, "");
      const portalUrl = store ? `${appUrl}/s/${store.slug}/portal` : `${appUrl}/account/purchases`;
      await Promise.all(
        filtered.map((r) => {
          const token = makeUnsubscribeToken(r.orderId);
          const unsubscribeUrl = `${appUrl}/api/unsubscribe/course-comments?orderId=${encodeURIComponent(r.orderId)}&token=${token}`;
          return sendCourseCommentReplyToBuyerEmail({
            buyerEmail: r.email,
            storeName: store?.name ?? "your store",
            courseTitle: product?.title ?? "your course",
            lessonTitle: lesson.title,
            bodyExcerpt: comment.body,
            portalUrl,
            unsubscribeUrl,
          });
        }),
      );
    } catch (e) {
      console.error("[course-comment] reply-notify failed:", e);
    }
  })();

  res.json(comment);
});

// PATCH — owner moderation (pin/unpin any comment) + owner can edit their
// own comment body. Owners cannot rewrite a buyer's words (mod tool is delete).
const patchCommentSchema = z.object({
  isPinned: z.boolean().optional(),
  body: z.string().min(1).max(2000).optional(),
});

coursesRouter.patch("/comments/:id", isAuthenticated, async (req: Request, res: Response) => {
  const comment = await storage.getCommentById(String(req.params.id));
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const lesson = await storage.getLessonById(comment.lessonId);
  if (!lesson) return res.status(404).json({ message: "Lesson gone" });

  const check = await requireProductOwner(req, lesson.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = patchCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  if (parsed.data.isPinned !== undefined) {
    await storage.setCommentPinned(comment.id, parsed.data.isPinned);
  }
  if (parsed.data.body !== undefined) {
    if (comment.authorType !== "owner" || comment.userId !== getUserId(req)) {
      return res.status(403).json({ message: "Owners can only edit their own comments." });
    }
    await storage.editComment(comment.id, parsed.data.body.trim());
  }
  res.json({ ok: true });
});

// ── NOTIFICATION PREFERENCES ──────────────────────────────────────────

// GET — buyer reads their current discussion-notifications preference.
coursesRouter.get(
  "/access/:token/:productId/notification-prefs",
  async (req: Request, res: Response) => {
    const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const order = await storage.getOrderById(check.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ commentNotificationsEnabled: order.commentNotificationsEnabled !== false });
  },
);

// PATCH — buyer toggles discussion-notifications from inside the portal.
const prefsSchema = z.object({ commentNotificationsEnabled: z.boolean() });
coursesRouter.patch(
  "/access/:token/:productId/notification-prefs",
  async (req: Request, res: Response) => {
    const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
    if (!check.ok) return res.status(check.status).json({ message: check.message });

    const parsed = prefsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    await storage.setOrderCommentNotifications(check.orderId, parsed.data.commentNotificationsEnabled);
    res.json({ ok: true, commentNotificationsEnabled: parsed.data.commentNotificationsEnabled });
  },
);

// DELETE — owner can delete any comment on their lesson (moderation)
coursesRouter.delete("/comments/:id", isAuthenticated, async (req: Request, res: Response) => {
  const comment = await storage.getCommentById(String(req.params.id));
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const lesson = await storage.getLessonById(comment.lessonId);
  if (!lesson) return res.status(404).json({ message: "Lesson gone" });

  const check = await requireProductOwner(req, lesson.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  await storage.softDeleteComment(comment.id);
  res.json({ ok: true });
});

// ── CERTIFICATE: issue + download ─────────────────────────────────────

// GET /api/courses/access/:token/:productId/certificate
// Returns the PDF certificate for this buyer's course if they've completed
// 100% of the lessons AND the product has certificates enabled. Issues + stores
// the certificate row on first request; re-requests return the same cert.
coursesRouter.get("/access/:token/:productId/certificate", async (req: Request, res: Response) => {
  const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const product = await storage.getProductById(String(req.params.productId));
  if (!product) return res.status(404).json({ message: "Course not found" });

  if (!product.certificatesEnabled) {
    return res.status(403).json({ message: "Certificates are not enabled for this course." });
  }

  const order = await storage.getOrderById(check.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const [lessons, progress] = await Promise.all([
    storage.getLessonsByProduct(product.id),
    storage.getLessonProgressForOrder(check.orderId),
  ]);

  if (lessons.length === 0) {
    return res.status(400).json({ message: "This course has no lessons yet." });
  }

  const completedSet = new Set(progress.map((p) => p.lessonId));
  const allDone = lessons.every((l) => completedSet.has(l.id));
  if (!allDone) {
    return res.status(403).json({ message: "Complete all lessons first to earn your certificate." });
  }

  // Issue (idempotent — unique on order_id + product_id).
  let cert = await storage.getCertificateForOrderProduct(check.orderId, product.id);
  if (!cert) {
    cert = await storage.createCertificate({
      productId: product.id,
      orderId: check.orderId,
      storeId: order.storeId,
      buyerEmail: order.buyerEmail,
      buyerName: order.buyerEmail.split("@")[0], // No name field on orders today; use email local-part as a fallback
      verificationCode: generateVerificationCode(),
    });
  }

  // Always re-generate the PDF on each download (cheap + reflects any
  // owner-side cert-designer changes since last issue). Verification code stays stable.
  const store = await storage.getStoreById(order.storeId);

  // Best-effort logo fetch — failure leaves the cert with no logo rather than 500ing.
  let logoBytes: Uint8Array | null = null;
  let logoMimeType: "image/png" | "image/jpeg" | null = null;
  if (product.certLogoUrl) {
    try {
      const resp = await fetch(product.certLogoUrl);
      if (resp.ok) {
        const ct = (resp.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("png")) logoMimeType = "image/png";
        else if (ct.includes("jpeg") || ct.includes("jpg")) logoMimeType = "image/jpeg";
        if (logoMimeType) {
          const buf = await resp.arrayBuffer();
          // 5MB cap — anything bigger is almost certainly a misconfig.
          if (buf.byteLength <= 5 * 1024 * 1024) {
            logoBytes = new Uint8Array(buf);
          }
        }
      }
    } catch (e) {
      console.error("[cert] logo fetch failed:", e);
    }
  }

  const pdf = await generateCertificatePdf({
    buyerName: cert.buyerName || cert.buyerEmail,
    courseTitle: product.title,
    storeName: store?.name ?? "Sellisy",
    issuedAtIso: cert.issuedAt.toISOString(),
    verificationCode: cert.verificationCode,
    accentColorHex: product.certAccentColor,
    logoBytes,
    logoMimeType,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="certificate-${product.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`,
  );
  res.setHeader("Cache-Control", "no-store");
  res.end(Buffer.from(pdf));
});
