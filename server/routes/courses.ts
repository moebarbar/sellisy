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
});

coursesRouter.post("/products/:productId/lessons", isAuthenticated, async (req: Request, res: Response) => {
  const check = await requireProductOwner(req, String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const parsed = createLessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

  const existing = await storage.getLessonsByProduct(check.product.id);
  const nextSortOrder = existing.length;

  const lesson = await storage.createLesson({
    productId: check.product.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    videoUrl: parsed.data.videoUrl ?? null,
    attachmentUrl: parsed.data.attachmentUrl ?? null,
    durationSeconds: parsed.data.durationSeconds ?? null,
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

// ── CUSTOMER: lesson access via download token ────────────────────────

// GET /api/courses/access/:token/:productId — lessons + progress
coursesRouter.get("/access/:token/:productId", async (req: Request, res: Response) => {
  const check = await validateDownloadAccess(String(req.params.token), String(req.params.productId));
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const product = await storage.getProductById(String(req.params.productId));
  if (!product) return res.status(404).json({ message: "Course not found" });

  const lessons = await storage.getLessonsByProduct(product.id);
  const progress = await storage.getLessonProgressForOrder(check.orderId);
  const completedSet = new Set(progress.map((p) => p.lessonId));

  res.json({
    course: {
      id: product.id,
      title: product.title,
      description: product.description,
      thumbnailUrl: product.thumbnailUrl,
    },
    lessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      videoUrl: l.videoUrl,
      attachmentUrl: l.attachmentUrl,
      durationSeconds: l.durationSeconds,
      sortOrder: l.sortOrder,
      completed: completedSet.has(l.id),
    })),
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
