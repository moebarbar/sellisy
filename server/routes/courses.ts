import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { db } from "../db";
import { isAuthenticated } from "../replit_integrations/auth";
import { quizQuestions, QUIZ_PASS_THRESHOLD } from "@shared/schema";
import { and, inArray, isNull } from "drizzle-orm";

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
const createQuestionSchema = z.object({
  prompt: z.string().min(1).max(2000),
  choices: z.array(z.object({
    label: z.string().min(1).max(500),
    isCorrect: z.boolean(),
  })).min(2).max(8),
}).refine((d) => d.choices.filter((c) => c.isCorrect).length === 1, {
  message: "Exactly one choice must be marked correct",
});

coursesRouter.post("/lessons/:lessonId/questions", isAuthenticated, async (req: Request, res: Response) => {
  const lesson = await storage.getLessonById(String(req.params.lessonId));
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  const check = await requireProductOwner(req, lesson.productId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = createQuestionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const existing = await storage.getQuestionsByLesson(lesson.id);
  const question = await storage.createQuestion({
    lessonId: lesson.id,
    prompt: parsed.data.prompt,
    sortOrder: existing.length,
  });
  const choices = await storage.replaceChoicesForQuestion(question.id, parsed.data.choices);
  res.json({ ...question, choices });
});

// PATCH /api/courses/questions/:id — update prompt and/or replace choices
const updateQuestionSchema = z.object({
  prompt: z.string().min(1).max(2000).optional(),
  choices: z.array(z.object({
    label: z.string().min(1).max(500),
    isCorrect: z.boolean(),
  })).min(2).max(8).optional(),
}).refine((d) => !d.choices || d.choices.filter((c) => c.isCorrect).length === 1, {
  message: "Exactly one choice must be marked correct",
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

  let updated = question;
  if (parsed.data.prompt !== undefined) {
    updated = (await storage.updateQuestion(question.id, { prompt: parsed.data.prompt }))!;
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
// Body: { answers: [{ questionId, choiceId }] }
// Scores server-side, records the attempt, marks lesson complete if passed.
const submitQuizSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    choiceId: z.string(),
  })).min(1).max(100),
});

coursesRouter.post("/access/:token/:productId/lessons/:lessonId/quiz/submit", async (req: Request, res: Response) => {
  const accessCheck = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
  if (!accessCheck.ok) return res.status(accessCheck.status).json({ message: accessCheck.message });

  const lesson = await storage.getLessonById(String(req.params.lessonId));
  if (!lesson || lesson.productId !== String(req.params.productId)) {
    return res.status(404).json({ message: "Lesson not found" });
  }

  const parsed = submitQuizSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const questions = await storage.getQuestionsByLesson(lesson.id);
  if (questions.length === 0) {
    return res.status(400).json({ message: "This lesson has no quiz." });
  }

  const allChoices = await storage.getChoicesByQuestionIds(questions.map((q) => q.id));
  // Map: correct choice per question
  const correctByQuestion = new Map<string, string>();
  for (const c of allChoices) {
    if (c.isCorrect) correctByQuestion.set(c.questionId, c.id);
  }

  // Each answer's questionId must be in this lesson's question set.
  const allowedQuestionIds = new Set(questions.map((q) => q.id));
  for (const a of parsed.data.answers) {
    if (!allowedQuestionIds.has(a.questionId)) {
      return res.status(400).json({ message: "Answer references a question not in this quiz." });
    }
  }

  // Score: count exact matches. Missing answers count as wrong.
  const answerByQuestion = new Map<string, string>();
  for (const a of parsed.data.answers) answerByQuestion.set(a.questionId, a.choiceId);

  let correctCount = 0;
  for (const q of questions) {
    if (answerByQuestion.get(q.id) === correctByQuestion.get(q.id)) correctCount++;
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
      yourChoiceId: answerByQuestion.get(q.id) ?? null,
      correctChoiceId: correctByQuestion.get(q.id) ?? null,
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
