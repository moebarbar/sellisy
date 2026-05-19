import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";

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

  const row = await storage.markLessonComplete({
    lessonId: lesson.id,
    orderId: check.orderId,
  });
  res.json(row);
});

// DELETE /api/courses/access/:token/:productId/lessons/:lessonId/complete — unmark
coursesRouter.delete("/access/:token/:productId/lessons/:lessonId/complete", async (req: Request, res: Response) => {
  const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  await storage.unmarkLessonComplete(String(req.params.lessonId), check.orderId);
  res.json({ ok: true });
});
