// Knowledge bases + blog posts. Owner-facing CRUD for knowledge_bases /
// kb_pages / kb_blocks / kb_page_attachments / blog_posts / blog_blocks,
// plus the public KB viewer and the storefront blog reads.
//
// Extracted from server/routes.ts as part of the routes-split refactor.
// Mounted in registerRoutes as: app.use(kbBlogRouter)

import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { storage } from "../storage";
import { db } from "../db";
import { isAuthenticated } from "../replit_integrations/auth";
import { categories, downloadTokens, storeProducts } from "@shared/schema";
import { generateSlug, getAppUrl, getUserId, sanitizeStore } from "./_helpers";

export const kbBlogRouter = Router();

kbBlogRouter.get("/api/knowledge-bases", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const kbs = await storage.getKnowledgeBasesByOwner(userId);
  res.json(kbs);
});

kbBlogRouter.post("/api/knowledge-bases", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const schema = z.object({ title: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  const title = parsed.success && parsed.data.title ? parsed.data.title.trim() : "Untitled";
  const existing = await storage.getKnowledgeBasesByOwner(userId);
  if (existing.some((kb) => kb.title.toLowerCase() === title.toLowerCase())) {
    return res.status(409).json({ message: `A knowledge base named "${title}" already exists.` });
  }
  const kb = await storage.createKnowledgeBase({
    ownerId: userId,
    title,
    slug: generateSlug(title, "kb"),
  });
  res.json(kb);
});

kbBlogRouter.get("/api/knowledge-bases/:id", isAuthenticated, async (req, res) => {
  const kb = await storage.getKnowledgeBaseById(req.params.id as string);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  res.json(kb);
});

kbBlogRouter.patch("/api/knowledge-bases/:id", isAuthenticated, async (req, res) => {
  const kb = await storage.getKnowledgeBaseById(req.params.id as string);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const schema = z.object({
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    coverImageUrl: z.string().nullable().optional(),
    priceCents: z.number().int().min(0).optional(),
    isPublished: z.boolean().optional(),
    fontFamily: z.string().nullable().optional(),
    productId: z.string().nullable().optional(),
    authorName: z.string().nullable().optional(),
    authorImageUrl: z.string().nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  const updateData: any = { ...parsed.data };
  if (updateData.title) {
    updateData.slug = generateSlug(updateData.title, "kb");
  }
  const updated = await storage.updateKnowledgeBase(kb.id, updateData);
  res.json(updated);
});

kbBlogRouter.delete("/api/knowledge-bases/:id", isAuthenticated, async (req, res) => {
  const kb = await storage.getKnowledgeBaseById(req.params.id as string);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  await storage.deleteKnowledgeBase(kb.id);
  res.json({ ok: true });
});

kbBlogRouter.post("/api/knowledge-bases/:id/create-product", isAuthenticated, async (req, res) => {
  const userId = getUserId(req);
  const kb = await storage.getKnowledgeBaseById(req.params.id as string);
  if (!kb || kb.ownerId !== userId) return res.status(404).json({ message: "Not found" });

  const pages = await storage.getKbPagesByKnowledgeBase(kb.id);
  if (pages.length === 0) return res.status(400).json({ message: "Add at least one page before creating a product." });

  const kbSlug = kb.slug || kb.id;
  let accessUrl = `${getAppUrl(req)}/kb/${kbSlug}`;

  let linkedStore: any = null;
  if (kb.productId) {
    const sp = await db.select().from(storeProducts).where(eq(storeProducts.productId, kb.productId)).then(r => r[0]);
    if (sp) linkedStore = await storage.getStoreById(sp.storeId);
  }
  if (!linkedStore) {
    const userStores = await storage.getStoresByOwner(userId);
    linkedStore = userStores.find(s => s.customDomain && s.domainStatus === "active") || null;
  }
  if (linkedStore?.customDomain && linkedStore.domainStatus === "active") {
    accessUrl = `https://${linkedStore.customDomain}/kb/${kbSlug}`;
  }

  if (kb.productId) {
    const existing = await storage.getProductById(kb.productId);
    if (existing && existing.ownerId === userId) {
      await storage.updateProduct(existing.id, {
        title: kb.title,
        description: kb.description || `Knowledge base with ${pages.length} pages`,
        priceCents: kb.priceCents,
        thumbnailUrl: kb.coverImageUrl || null,
        accessUrl,
        status: kb.isPublished ? "ACTIVE" : "DRAFT",
      });
      const updated = await storage.getProductById(existing.id);
      return res.json(updated);
    }
  }

  const product = await storage.createProduct({
    ownerId: userId,
    source: "USER",
    title: kb.title,
    description: kb.description || `Knowledge base with ${pages.length} pages`,
    category: "courses",
    priceCents: kb.priceCents,
    thumbnailUrl: kb.coverImageUrl || null,
    fileUrl: null,
    status: kb.isPublished ? "ACTIVE" : "DRAFT",
    requiredTier: "basic",
    productType: "course",
    deliveryInstructions: "Access your course content using the link below. Your access token is automatically included.",
    accessUrl,
    redemptionCode: null,
    tags: ["course", "knowledge-base"],
  });

  await storage.updateKnowledgeBase(kb.id, { productId: product.id });
  res.json(product);
});

kbBlogRouter.get("/api/knowledge-bases/:id/pages", isAuthenticated, async (req, res) => {
  const kb = await storage.getKnowledgeBaseById(req.params.id as string);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const pages = await storage.getKbPagesByKnowledgeBase(kb.id);
  res.json(pages);
});

kbBlogRouter.post("/api/knowledge-bases/:id/pages", isAuthenticated, async (req, res) => {
  const kb = await storage.getKnowledgeBaseById(req.params.id as string);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const schema = z.object({
    title: z.string().optional(),
    parentPageId: z.string().nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  const parentPageId = parsed.success ? parsed.data.parentPageId || null : null;
  const existingPages = await storage.getKbPagesByKnowledgeBase(kb.id);
  const siblings = existingPages.filter(p => p.parentPageId === parentPageId);
  const maxSort = siblings.length > 0 ? Math.max(...siblings.map(p => p.sortOrder)) : -1;
  const page = await storage.createKbPage({
    knowledgeBaseId: kb.id,
    title: parsed.success && parsed.data.title ? parsed.data.title : "Untitled Page",
    parentPageId,
    sortOrder: maxSort + 1,
  });
  res.json(page);
});

kbBlogRouter.patch("/api/kb-pages/:id", isAuthenticated, async (req, res) => {
  const page = await storage.getKbPageById(req.params.id as string);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const schema = z.object({
    title: z.string().optional(),
    parentPageId: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  const updated = await storage.updateKbPage(page.id, parsed.data);
  res.json(updated);
});

kbBlogRouter.delete("/api/kb-pages/:id", isAuthenticated, async (req, res) => {
  const page = await storage.getKbPageById(req.params.id as string);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  await storage.deleteKbPage(page.id);
  res.json({ ok: true });
});

kbBlogRouter.get("/api/kb-pages/:id/blocks", isAuthenticated, async (req, res) => {
  const page = await storage.getKbPageById(req.params.id as string);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const blocks = await storage.getKbBlocksByPage(page.id);
  res.json(blocks);
});

kbBlogRouter.post("/api/kb-pages/:id/blocks", isAuthenticated, async (req, res) => {
  const page = await storage.getKbPageById(req.params.id as string);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const schema = z.object({
    type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]).optional(),
    content: z.string().optional(),
    sortOrder: z.number().int().optional(),
  });
  const parsed = schema.safeParse(req.body);
  const existingBlocks = await storage.getKbBlocksByPage(page.id);
  const block = await storage.createKbBlock({
    pageId: page.id,
    type: parsed.success && parsed.data.type ? parsed.data.type : "text",
    content: parsed.success && parsed.data.content ? parsed.data.content : "",
    sortOrder: parsed.success && parsed.data.sortOrder != null ? parsed.data.sortOrder : existingBlocks.length,
  });
  res.json(block);
});

kbBlogRouter.post("/api/kb-pages/:id/blocks/bulk", isAuthenticated, async (req, res) => {
  const page = await storage.getKbPageById(req.params.id as string);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const schema = z.object({
    blocks: z.array(z.object({
      type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]),
      content: z.string(),
      sortOrder: z.number().int(),
    })),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  const insertAt = Math.min(...parsed.data.blocks.map((b) => b.sortOrder));
  const count = parsed.data.blocks.length;
  const existing = await storage.getKbBlocksByPage(page.id);
  for (const ex of existing) {
    if (ex.sortOrder >= insertAt) {
      await storage.updateKbBlock(ex.id, { sortOrder: ex.sortOrder + count });
    }
  }
  const created = [];
  for (const b of parsed.data.blocks) {
    const block = await storage.createKbBlock({ pageId: page.id, type: b.type, content: b.content, sortOrder: b.sortOrder });
    created.push(block);
  }
  res.json(created);
});

kbBlogRouter.patch("/api/kb-blocks/:id", isAuthenticated, async (req, res) => {
  const block = await storage.getKbBlockById(req.params.id as string);
  if (!block) return res.status(404).json({ message: "Not found" });
  const page = await storage.getKbPageById(block.pageId);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const schema = z.object({
    type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]).optional(),
    content: z.string().optional(),
    sortOrder: z.number().int().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  const updated = await storage.updateKbBlock(block.id, parsed.data);
  res.json(updated);
});

kbBlogRouter.delete("/api/kb-blocks/:id", isAuthenticated, async (req, res) => {
  const block = await storage.getKbBlockById(req.params.id as string);
  if (!block) return res.status(404).json({ message: "Not found" });
  const page = await storage.getKbPageById(block.pageId);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  await storage.deleteKbBlock(block.id);
  res.json({ ok: true });
});

kbBlogRouter.post("/api/kb-pages/:pageId/blocks/bulk-delete", isAuthenticated, async (req, res) => {
  const page = await storage.getKbPageById(req.params.pageId as string);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids required" });
  const pageBlocks = await storage.getKbBlocksByPage(page.id);
  const pageBlockIds = new Set(pageBlocks.map(b => b.id));
  const validIds = ids.filter((id: string) => pageBlockIds.has(id));
  if (validIds.length === 0) return res.status(400).json({ message: "No valid block ids" });
  await storage.deleteKbBlocksBulk(validIds);
  res.json({ ok: true, deleted: validIds.length });
});

kbBlogRouter.put("/api/knowledge-bases/:id/pages/reorder", isAuthenticated, async (req, res) => {
  const kb = await storage.getKnowledgeBaseById(req.params.id as string);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const schema = z.object({ pageIds: z.array(z.string()) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  const pages = await storage.getKbPagesByKnowledgeBase(kb.id);
  for (let i = 0; i < parsed.data.pageIds.length; i++) {
    const page = pages.find(p => p.id === parsed.data.pageIds[i]);
    if (page) {
      await storage.updateKbPage(page.id, { sortOrder: i });
    }
  }
  res.json({ ok: true });
});

kbBlogRouter.put("/api/kb-pages/:id/blocks/reorder", isAuthenticated, async (req, res) => {
  const page = await storage.getKbPageById(req.params.id as string);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const schema = z.object({ blockIds: z.array(z.string()) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  await storage.reorderKbBlocks(page.id, parsed.data.blockIds);
  res.json({ ok: true });
});

// --- KB Page Attachments ---

kbBlogRouter.get("/api/kb-pages/:id/attachments", isAuthenticated, async (req, res) => {
  const page = await storage.getKbPageById(req.params.id as string);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const attachments = await storage.getAttachmentsByPage(page.id);
  res.json(attachments);
});

kbBlogRouter.post("/api/kb-pages/:id/attachments", isAuthenticated, async (req, res) => {
  const page = await storage.getKbPageById(req.params.id as string);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const schema = z.object({
    name: z.string().min(1),
    fileUrl: z.string().url(),
    fileSize: z.number().int().positive().optional(),
    mimeType: z.string().optional(),
    sortOrder: z.number().int().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  const existing = await storage.getAttachmentsByPage(page.id);
  const attachment = await storage.createAttachment({
    pageId: page.id,
    ...parsed.data,
    sortOrder: parsed.data.sortOrder ?? existing.length,
  });
  res.json(attachment);
});

kbBlogRouter.patch("/api/kb-pages/:id/attachments/:attachmentId", isAuthenticated, async (req, res) => {
  const page = await storage.getKbPageById(req.params.id as string);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const schema = z.object({ name: z.string().min(1).optional(), sortOrder: z.number().int().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  const updated = await storage.updateAttachment(req.params.attachmentId as string, parsed.data);
  res.json(updated);
});

kbBlogRouter.delete("/api/kb-pages/:id/attachments/:attachmentId", isAuthenticated, async (req, res) => {
  const page = await storage.getKbPageById(req.params.id as string);
  if (!page) return res.status(404).json({ message: "Not found" });
  const kb = await storage.getKnowledgeBaseById(page.knowledgeBaseId);
  if (!kb || kb.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  await storage.deleteAttachment(req.params.attachmentId as string);
  res.json({ success: true });
});

// Public KB viewer
kbBlogRouter.get("/api/kb/:id/view", async (req, res) => {
  const idParam = req.params.id as string;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam);
  const kb = isUuid
    ? await storage.getKnowledgeBaseById(idParam)
    : await storage.getKnowledgeBaseBySlug(idParam);
  if (!kb || !kb.isPublished) return res.status(404).json({ message: "Not found" });
  const pages = await storage.getKbPagesByKnowledgeBase(kb.id);
  const isPaid = kb.priceCents > 0;

  let hasAccess = !isPaid;
  if (isPaid) {
    const accessToken = req.query.token as string | undefined;
    if (accessToken) {
      const dl = await db.select().from(downloadTokens).where(eq(downloadTokens.tokenHash, accessToken)).then(r => r[0]);
      if (dl && !dl.revokedAt && (!dl.expiresAt || dl.expiresAt > new Date())) {
        hasAccess = true;
      }
    }
    const userId = getUserId(req);
    if (userId && userId === kb.ownerId) {
      hasAccess = true;
    }
  }

  let purchaseUrl: string | null = null;
  if (isPaid && !hasAccess && kb.productId) {
    const sp = await db.select().from(storeProducts).where(eq(storeProducts.productId, kb.productId)).then(r => r[0]);
    if (sp) {
      const store = await storage.getStoreById(sp.storeId);
      if (store) {
        if (store.customDomain && store.domainStatus === "active") {
          purchaseUrl = `https://${store.customDomain}/product/${kb.productId}`;
        } else {
          purchaseUrl = `/s/${store.slug}/product/${kb.productId}`;
        }
      }
    }
  }

  res.json({
    knowledgeBase: {
      id: kb.id,
      title: kb.title,
      description: kb.description,
      coverImageUrl: kb.coverImageUrl,
      priceCents: kb.priceCents,
      fontFamily: kb.fontFamily,
    },
    pages: hasAccess ? pages : pages.map(p => ({ id: p.id, title: "Locked", parentPageId: p.parentPageId, sortOrder: p.sortOrder, locked: true })),
    hasAccess,
    purchaseUrl,
  });
});

kbBlogRouter.get("/api/kb/:id/view/page/:pageId", async (req, res) => {
  const idParam2 = req.params.id as string;
  const isUuid2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam2);
  const kb = isUuid2
    ? await storage.getKnowledgeBaseById(idParam2)
    : await storage.getKnowledgeBaseBySlug(idParam2);
  if (!kb || !kb.isPublished) return res.status(404).json({ message: "Not found" });

  const isPaid = kb.priceCents > 0;
  let hasAccess = !isPaid;
  if (isPaid) {
    const accessToken = req.query.token as string | undefined;
    if (accessToken) {
      const dl = await db.select().from(downloadTokens).where(eq(downloadTokens.tokenHash, accessToken)).then(r => r[0]);
      if (dl && !dl.revokedAt && (!dl.expiresAt || dl.expiresAt > new Date())) {
        hasAccess = true;
      }
    }
    const userId = getUserId(req);
    if (userId && userId === kb.ownerId) {
      hasAccess = true;
    }
  }

  if (!hasAccess) return res.status(403).json({ message: "Purchase required to access this content." });

  const page = await storage.getKbPageById(req.params.pageId as string);
  if (!page || page.knowledgeBaseId !== kb.id) return res.status(404).json({ message: "Not found" });
  const [blocks, attachments] = await Promise.all([
    storage.getKbBlocksByPage(page.id),
    storage.getAttachmentsByPage(page.id),
  ]);
  res.json({ page, blocks, attachments });
});

// --- Blog routes (dashboard) ---

kbBlogRouter.get("/api/blog-posts", isAuthenticated, async (req, res) => {
  const storeId = req.query.storeId as string;
  if (!storeId) return res.status(400).json({ message: "storeId required" });
  const store = await storage.getStoreById(storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
  const posts = await storage.getBlogPostsByStore(storeId);
  res.json(posts);
});

kbBlogRouter.post("/api/blog-posts", isAuthenticated, async (req, res) => {
  const { storeId, title } = req.body;
  if (!storeId) return res.status(400).json({ message: "storeId required" });
  const store = await storage.getStoreById(storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
  const postTitle = title || "Untitled";
  const baseSlug = postTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
  let slug = baseSlug;
  let counter = 1;
  while (await storage.getBlogPostBySlug(storeId, slug)) {
    slug = `${baseSlug}-${counter++}`;
  }
  const post = await storage.createBlogPost({ storeId, title: postTitle, slug });
  res.json(post);
});

kbBlogRouter.get("/api/blog-posts/:id", isAuthenticated, async (req, res) => {
  const post = await storage.getBlogPostById(req.params.id as string);
  if (!post) return res.status(404).json({ message: "Not found" });
  const store = await storage.getStoreById(post.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
  res.json(post);
});

kbBlogRouter.patch("/api/blog-posts/:id", isAuthenticated, async (req, res) => {
  const post = await storage.getBlogPostById(req.params.id as string);
  if (!post) return res.status(404).json({ message: "Not found" });
  const store = await storage.getStoreById(post.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
  const blogPatchSchema = z.object({
    title: z.string().optional(),
    slug: z.string().optional(),
    excerpt: z.string().nullable().optional(),
    coverImageUrl: z.string().nullable().optional(),
    fontFamily: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    readingTimeMinutes: z.number().int().min(0).nullable().optional(),
    isPublished: z.boolean().optional(),
    publishedAt: z.string().nullable().optional(),
    authorName: z.string().nullable().optional(),
    authorImageUrl: z.string().nullable().optional(),
  });
  const parsed = blogPatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  const data: any = { ...parsed.data };
  if (data.isPublished === true && !post.publishedAt) {
    data.publishedAt = new Date();
  }
  const updated = await storage.updateBlogPost(post.id, data);
  res.json(updated);
});

kbBlogRouter.delete("/api/blog-posts/:id", isAuthenticated, async (req, res) => {
  const post = await storage.getBlogPostById(req.params.id as string);
  if (!post) return res.status(404).json({ message: "Not found" });
  const store = await storage.getStoreById(post.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
  await storage.deleteBlogPost(post.id);
  res.json({ success: true });
});

kbBlogRouter.get("/api/blog-posts/:id/blocks", isAuthenticated, async (req, res) => {
  const post = await storage.getBlogPostById(req.params.id as string);
  if (!post) return res.status(404).json({ message: "Not found" });
  const store = await storage.getStoreById(post.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
  const blocks = await storage.getBlogBlocksByPost(post.id);
  res.json(blocks);
});

kbBlogRouter.post("/api/blog-posts/:id/blocks", isAuthenticated, async (req, res) => {
  const post = await storage.getBlogPostById(req.params.id as string);
  if (!post) return res.status(404).json({ message: "Not found" });
  const store = await storage.getStoreById(post.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
  const blockSchema = z.object({
    type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]).optional(),
    content: z.string().optional(),
    sortOrder: z.number().int().optional(),
  });
  const blockParsed = blockSchema.safeParse(req.body);
  if (!blockParsed.success) return res.status(400).json({ message: "Invalid data" });
  const existingBlocks = await storage.getBlogBlocksByPost(post.id);
  const block = await storage.createBlogBlock({
    postId: post.id,
    type: blockParsed.data.type || "text",
    content: blockParsed.data.content || "",
    sortOrder: blockParsed.data.sortOrder != null ? blockParsed.data.sortOrder : existingBlocks.length,
  });
  res.json(block);
});

kbBlogRouter.post("/api/blog-posts/:id/blocks/bulk", isAuthenticated, async (req, res) => {
  const post = await storage.getBlogPostById(req.params.id as string);
  if (!post) return res.status(404).json({ message: "Not found" });
  const store = await storage.getStoreById(post.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
  const blocks = req.body.blocks as Array<{ type: string; content: string; sortOrder: number }>;
  if (!Array.isArray(blocks)) return res.status(400).json({ message: "blocks array required" });
  const created = [];
  for (const b of blocks) {
    const block = await storage.createBlogBlock({ postId: post.id, type: b.type as any, content: b.content, sortOrder: b.sortOrder });
    created.push(block);
  }
  res.json(created);
});

kbBlogRouter.patch("/api/blog-blocks/:id", isAuthenticated, async (req, res) => {
  const block = await storage.getBlogBlockById(req.params.id as string);
  if (!block) return res.status(404).json({ message: "Not found" });
  const post = await storage.getBlogPostById(block.postId);
  if (!post) return res.status(404).json({ message: "Not found" });
  const store = await storage.getStoreById(post.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const blockUpdateSchema = z.object({
    type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]).optional(),
    content: z.string().optional(),
    sortOrder: z.number().int().optional(),
  });
  const blockUpdateParsed = blockUpdateSchema.safeParse(req.body);
  if (!blockUpdateParsed.success) return res.status(400).json({ message: "Invalid data" });
  const updated = await storage.updateBlogBlock(block.id, blockUpdateParsed.data);
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
});

kbBlogRouter.delete("/api/blog-blocks/:id", isAuthenticated, async (req, res) => {
  const block = await storage.getBlogBlockById(req.params.id as string);
  if (!block) return res.status(404).json({ message: "Not found" });
  const post = await storage.getBlogPostById(block.postId);
  if (!post) return res.status(404).json({ message: "Not found" });
  const store = await storage.getStoreById(post.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  await storage.deleteBlogBlock(block.id);
  res.json({ success: true });
});

kbBlogRouter.post("/api/blog-posts/:postId/blocks/bulk-delete", isAuthenticated, async (req, res) => {
  const post = await storage.getBlogPostById(req.params.postId as string);
  if (!post) return res.status(404).json({ message: "Not found" });
  const store = await storage.getStoreById(post.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Not found" });
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids required" });
  const postBlocks = await storage.getBlogBlocksByPost(post.id);
  const postBlockIds = new Set(postBlocks.map(b => b.id));
  const validIds = ids.filter((id: string) => postBlockIds.has(id));
  if (validIds.length === 0) return res.status(400).json({ message: "No valid block ids" });
  await storage.deleteBlogBlocksBulk(validIds);
  res.json({ ok: true, deleted: validIds.length });
});

kbBlogRouter.put("/api/blog-posts/:id/blocks/reorder", isAuthenticated, async (req, res) => {
  const post = await storage.getBlogPostById(req.params.id as string);
  if (!post) return res.status(404).json({ message: "Not found" });
  const store = await storage.getStoreById(post.storeId);
  if (!store || store.ownerId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
  const { blockIds } = req.body;
  if (!Array.isArray(blockIds)) return res.status(400).json({ message: "blockIds array required" });
  await storage.reorderBlogBlocks(post.id, blockIds);
  res.json({ success: true });
});

// --- Public blog routes ---

kbBlogRouter.get("/api/storefront/:slug/blog", async (req, res) => {
  const store = await storage.getStoreBySlug(req.params.slug as string);
  if (!store || !store.blogEnabled) return res.status(404).json({ message: "Blog not found" });
  const [posts, categories] = await Promise.all([
    storage.getPublishedBlogPostsByStore(store.id),
    storage.getBlogCategories(store.id),
  ]);
  res.json({ store: sanitizeStore(store), posts, categories });
});

kbBlogRouter.get("/api/storefront/:slug/blog/:postSlug", async (req, res) => {
  const store = await storage.getStoreBySlug(req.params.slug as string);
  if (!store || !store.blogEnabled) return res.status(404).json({ message: "Blog not found" });
  const post = await storage.getBlogPostBySlug(store.id, req.params.postSlug as string);
  if (!post || !post.isPublished) return res.status(404).json({ message: "Post not found" });
  const [blocks, relatedPosts] = await Promise.all([
    storage.getBlogBlocksByPost(post.id),
    storage.getRelatedBlogPosts(store.id, post.id, post.category, 3),
  ]);
  res.json({ store: sanitizeStore(store), post, blocks, relatedPosts });
});
