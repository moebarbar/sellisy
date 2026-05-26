// Owner-facing store CRUD + storefront-section management:
// testimonials, FAQs, reviews (owner-side delete), and newsletter campaigns.
// The store-section endpoints all live under /api/stores/:id/* so they group
// naturally with the store CRUD itself.
//
// Extracted from server/routes.ts as part of the routes-split refactor.
// Mounted in registerRoutes as: app.use(storesRouter)

import { Router } from "express";
import { z } from "zod";

import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { PLAN_FEATURES } from "@shared/schema";
import {
  baseLayout,
  bodyText,
  ctaButton,
  divider,
  sectionHeading,
} from "../emails";
import { sendEmailStaggered } from "../sendgridClient";
import { encryptPaymentSecret } from "../crypto/payment-secret";
import {
  getUserId,
  getUserPlanTier,
  sanitizeStore,
} from "./_helpers";

export const storesRouter = Router();


storesRouter.get("/api/stores", isAuthenticated, async (req, res) => {
  const stores = await storage.getStoresByOwner(getUserId(req));
  res.json(stores.map(sanitizeStore));
});

storesRouter.get("/api/stores/:id", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) {
    return res.status(404).json({ message: "Store not found" });
  }
  res.json(sanitizeStore(store));
});

storesRouter.post("/api/stores", isAuthenticated, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
    templateKey: z.enum(["neon", "silk", "aurora", "ember", "frost", "midnight", "launch"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid store data" });

  const userId = getUserId(req);
  const tier = await getUserPlanTier(userId);
  const features = PLAN_FEATURES[tier];
  const currentStores = await storage.getStoresByOwner(userId);
  if (currentStores.length >= features.maxStores) {
    return res.status(403).json({ message: `Your ${tier} plan allows up to ${features.maxStores} store(s). Upgrade to create more.` });
  }

  const existing = await storage.getStoreBySlug(parsed.data.slug);
  if (existing) return res.status(409).json({ message: "Slug already taken" });

  const store = await storage.createStore({
    ownerId: userId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    templateKey: parsed.data.templateKey,
  });
  res.json(store);
});

storesRouter.patch("/api/stores/:id", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) {
    return res.status(404).json({ message: "Store not found" });
  }
  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/).optional(),
    templateKey: z.enum(["neon", "silk", "aurora", "ember", "frost", "midnight", "launch"]).optional(),
    tagline: z.string().max(200).optional().nullable(),
    logoUrl: z.string().max(500).optional().nullable(),
    accentColor: z.string().max(20).optional().nullable(),
    heroBannerUrl: z.string().max(500).optional().nullable(),
    paymentProvider: z.enum(["stripe", "paypal"]).optional(),
    paypalClientId: z.string().max(200).optional().nullable(),
    paypalClientSecret: z.string().max(200).optional().nullable(),
    stripePublishableKey: z.string().max(200).refine(v => !v || v.startsWith("pk_"), { message: "Publishable key must start with pk_" }).optional().nullable(),
    stripeSecretKey: z.string().max(200).refine(v => !v || v.startsWith("sk_"), { message: "Secret key must start with sk_" }).optional().nullable(),
    blogEnabled: z.boolean().optional(),
    announcementText: z.string().max(500).optional().nullable(),
    announcementLink: z.string().max(500).optional().nullable(),
    footerText: z.string().max(500).optional().nullable(),
    socialTwitter: z.string().max(100).optional().nullable(),
    socialInstagram: z.string().max(100).optional().nullable(),
    socialYoutube: z.string().max(200).optional().nullable(),
    socialTiktok: z.string().max(100).optional().nullable(),
    socialWebsite: z.string().max(500).optional().nullable(),
    faviconUrl: z.string().max(500).optional().nullable(),
    seoTitle: z.string().max(200).optional().nullable(),
    seoDescription: z.string().max(500).optional().nullable(),
    allowImageDownload: z.boolean().optional(),
    aboutEnabled: z.boolean().optional(),
    aboutHeadline: z.string().max(200).optional().nullable(),
    aboutText: z.string().max(5000).optional().nullable(),
    aboutImageUrl: z.string().max(500).optional().nullable(),
    aboutCtaText: z.string().max(100).optional().nullable(),
    aboutCtaUrl: z.string().max(500).optional().nullable(),
    testimonialsEnabled: z.boolean().optional(),
    faqEnabled: z.boolean().optional(),
    newsletterEnabled: z.boolean().optional(),
    newsletterHeadline: z.string().max(200).optional().nullable(),
    newsletterSubtext: z.string().max(500).optional().nullable(),
    sectionOrder: z.string().max(500).optional().nullable(),
    reviewsEnabled: z.boolean().optional(),
    stripeTaxEnabled: z.boolean().optional(),
    pdfWatermarkEnabled: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });

  if (parsed.data.slug && parsed.data.slug !== store.slug) {
    const existing = await storage.getStoreBySlug(parsed.data.slug);
    if (existing) return res.status(409).json({ message: "Slug already taken" });
  }

  // Encrypt payment secrets before persisting. encryptPaymentSecret is a
  // no-op on empty/already-encrypted values, so it's safe to apply
  // unconditionally when the field is present in the request body.
  const toUpdate = { ...parsed.data };
  if (typeof toUpdate.stripeSecretKey === "string" && toUpdate.stripeSecretKey) {
    toUpdate.stripeSecretKey = encryptPaymentSecret(toUpdate.stripeSecretKey);
  }
  if (typeof toUpdate.paypalClientSecret === "string" && toUpdate.paypalClientSecret) {
    toUpdate.paypalClientSecret = encryptPaymentSecret(toUpdate.paypalClientSecret);
  }

  const updated = await storage.updateStore(store.id, toUpdate);
  res.json(sanitizeStore(updated));
});

storesRouter.delete("/api/stores/:id", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) {
    return res.status(404).json({ message: "Store not found" });
  }
  await storage.deleteStore(store.id, getUserId(req));
  res.json({ success: true });
});

// --- Storefront Sections (Testimonials) ---
storesRouter.get("/api/stores/:id/testimonials", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  res.json(await storage.getTestimonialsByStore(store.id));
});

storesRouter.post("/api/stores/:id/testimonials", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const schema = z.object({
    name: z.string().min(1).max(100),
    role: z.string().max(100).optional(),
    quote: z.string().min(1).max(1000),
    avatarUrl: z.string().max(500).optional(),
    sortOrder: z.number().optional().default(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  res.status(201).json(await storage.createTestimonial({ storeId: store.id, ...parsed.data }));
});

storesRouter.patch("/api/stores/:id/testimonials/:testimonialId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const schema = z.object({
    name: z.string().max(100).optional(),
    role: z.string().max(100).optional().nullable(),
    quote: z.string().max(1000).optional(),
    avatarUrl: z.string().max(500).optional().nullable(),
    sortOrder: z.number().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  const testimonial = await storage.getTestimonialById(req.params.testimonialId as string);
  if (!testimonial || testimonial.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  const updated = await storage.updateTestimonial(testimonial.id, parsed.data);
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
});

storesRouter.delete("/api/stores/:id/testimonials/:testimonialId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const testimonial = await storage.getTestimonialById(req.params.testimonialId as string);
  if (!testimonial || testimonial.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  await storage.deleteTestimonial(testimonial.id);
  res.json({ success: true });
});

// --- Storefront Sections (FAQs) ---
storesRouter.get("/api/stores/:id/faqs", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  res.json(await storage.getFaqsByStore(store.id));
});

storesRouter.post("/api/stores/:id/faqs", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const schema = z.object({
    question: z.string().min(1).max(300),
    answer: z.string().min(1).max(5000),
    sortOrder: z.number().optional().default(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  res.status(201).json(await storage.createFaq({ storeId: store.id, ...parsed.data }));
});

storesRouter.patch("/api/stores/:id/faqs/:faqId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const schema = z.object({
    question: z.string().max(300).optional(),
    answer: z.string().max(5000).optional(),
    sortOrder: z.number().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  const faq = await storage.getFaqById(req.params.faqId as string);
  if (!faq || faq.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  const updated = await storage.updateFaq(faq.id, parsed.data);
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
});

storesRouter.delete("/api/stores/:id/faqs/:faqId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const faq = await storage.getFaqById(req.params.faqId as string);
  if (!faq || faq.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  await storage.deleteFaq(faq.id);
  res.json({ success: true });
});

// --- Storefront Sections (Reviews — Owner routes) ---
storesRouter.get("/api/stores/:id/reviews", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const reviews = await storage.getReviewsByStore(store.id);
  // Attach product titles
  const reviewsWithProduct = await Promise.all(reviews.map(async (r) => {
    const product = await storage.getProductById(r.productId);
    return { ...r, productTitle: product?.title || null };
  }));
  res.json(reviewsWithProduct);
});

storesRouter.delete("/api/stores/:id/reviews/:reviewId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const review = await storage.getReviewById(req.params.reviewId as string);
  if (!review || review.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  await storage.deleteReview(review.id);
  res.json({ success: true });
});

// --- Newsletter Campaigns ---

storesRouter.get("/api/stores/:id/newsletter-campaigns", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const campaigns = await storage.getCampaignsByStore(store.id);
  res.json(campaigns);
});

storesRouter.post("/api/stores/:id/newsletter-campaigns", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const schema = z.object({ subject: z.string().min(1).max(200) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Subject is required" });
  const campaign = await storage.createCampaign({ storeId: store.id, subject: parsed.data.subject });
  res.json(campaign);
});

storesRouter.patch("/api/stores/:id/newsletter-campaigns/:campaignId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const campaign = await storage.getCampaignById(req.params.campaignId as string);
  if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  if (campaign.status === "sent") return res.status(400).json({ message: "Cannot edit a sent campaign" });
  const schema = z.object({ subject: z.string().min(1).max(200).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
  const updated = await storage.updateCampaign(campaign.id, parsed.data);
  res.json(updated);
});

storesRouter.delete("/api/stores/:id/newsletter-campaigns/:campaignId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const campaign = await storage.getCampaignById(req.params.campaignId as string);
  if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  await storage.deleteCampaign(campaign.id);
  res.json({ success: true });
});

storesRouter.get("/api/stores/:id/newsletter-campaigns/:campaignId/blocks", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const campaign = await storage.getCampaignById(req.params.campaignId as string);
  if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  const blocks = await storage.getBlocksByCampaign(campaign.id);
  res.json(blocks);
});

storesRouter.post("/api/stores/:id/newsletter-campaigns/:campaignId/blocks", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const campaign = await storage.getCampaignById(req.params.campaignId as string);
  if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  if (campaign.status === "sent") return res.status(400).json({ message: "Cannot edit a sent campaign" });
  const schema = z.object({
    type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]).optional(),
    content: z.string().optional(),
    sortOrder: z.number().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid block data" });
  const block = await storage.createCampaignBlock({ campaignId: campaign.id, ...parsed.data });
  res.json(block);
});

storesRouter.patch("/api/stores/:id/newsletter-campaigns/:campaignId/blocks/:blockId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const campaign = await storage.getCampaignById(req.params.campaignId as string);
  if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  if (campaign.status === "sent") return res.status(400).json({ message: "Cannot edit a sent campaign" });
  const schema = z.object({
    type: z.enum(["text", "heading1", "heading2", "heading3", "image", "video", "link", "bullet_list", "numbered_list", "todo", "toggle", "code", "quote", "divider", "callout"]).optional(),
    content: z.string().optional(),
    sortOrder: z.number().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid block data" });
  const updated = await storage.updateCampaignBlock(req.params.blockId as string, parsed.data);
  res.json(updated);
});

storesRouter.delete("/api/stores/:id/newsletter-campaigns/:campaignId/blocks/:blockId", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const campaign = await storage.getCampaignById(req.params.campaignId as string);
  if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  if (campaign.status === "sent") return res.status(400).json({ message: "Cannot edit a sent campaign" });
  await storage.deleteCampaignBlock(req.params.blockId as string);
  res.json({ success: true });
});

storesRouter.post("/api/stores/:id/newsletter-campaigns/:campaignId/send", isAuthenticated, async (req, res) => {
  const store = await storage.getStoreById(req.params.id as string);
  if (!store || store.ownerId !== getUserId(req)) return res.status(404).json({ message: "Store not found" });
  const campaign = await storage.getCampaignById(req.params.campaignId as string);
  if (!campaign || campaign.storeId !== store.id) return res.status(404).json({ message: "Not found" });
  if (campaign.status === "sent") return res.status(400).json({ message: "Campaign already sent" });

  const subscribers = await storage.getNewsletterSubscribers(store.id);
  if (subscribers.length === 0) return res.status(400).json({ message: "No subscribers to send to" });

  const blocks = await storage.getBlocksByCampaign(campaign.id);

  // Render blocks to HTML
  const blocksHtml = blocks.map(block => {
    const text = block.content || "";
    switch (block.type) {
      case "heading1": return `<h1 style="margin:0 0 16px;color:#111827;font-size:28px;font-weight:700;">${text}</h1>`;
      case "heading2": return sectionHeading(text);
      case "heading3": return `<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;font-weight:600;">${text}</h3>`;
      case "divider": return divider();
      case "image": return `<img src="${text}" alt="" style="max-width:100%;border-radius:8px;margin:16px 0;">`;
      case "link": {
        const [label, url] = text.split("|");
        return url ? ctaButton(label, url) : bodyText(`<a href="${label}" style="color:#6366f1;">${label}</a>`);
      }
      case "quote": return `<blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #6366f1;background:#f5f3ff;color:#374151;font-style:italic;">${text}</blockquote>`;
      case "callout": return `<div style="margin:16px 0;padding:16px;border-radius:8px;background:#fffbeb;border:1px solid #fde68a;color:#374151;">${text}</div>`;
      default: return bodyText(text);
    }
  }).join("\n");

  const html = baseLayout(
    `${sectionHeading(campaign.subject)}\n${blocksHtml}`,
    campaign.subject
  );

  // Send staggered to all subscribers
  const emails = subscribers.map(s => ({ to: s.email, subject: campaign.subject, html }));
  await sendEmailStaggered(emails);

  await storage.updateCampaign(campaign.id, {
    status: "sent",
    sentAt: new Date(),
    recipientCount: subscribers.length,
  });

  res.json({ sent: subscribers.length });
});
