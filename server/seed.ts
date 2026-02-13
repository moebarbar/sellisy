import { storage } from "./storage";
import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

const platformProducts = [
  {
    title: "Premium UI Kit",
    description: "A comprehensive UI kit with 200+ components, design tokens, and ready-to-use templates for modern web applications. Includes dark mode support and responsive layouts.",
    priceCents: 4900,
    thumbnailUrl: "/images/product-ui-kit.png",
  },
  {
    title: "React Component Library",
    description: "Production-ready React components built with TypeScript and Tailwind CSS. Includes forms, data tables, modals, and navigation patterns with full accessibility.",
    priceCents: 3900,
    thumbnailUrl: "/images/product-react-templates.png",
  },
  {
    title: "Social Media Marketing Kit",
    description: "150+ Instagram, Twitter, and LinkedIn templates in Figma and Canva formats. Perfect for content creators and small businesses looking to level up their social presence.",
    priceCents: 2900,
    thumbnailUrl: "/images/product-social-kit.png",
  },
  {
    title: "The SaaS Growth Playbook",
    description: "A 120-page comprehensive guide covering product-led growth, pricing strategies, customer acquisition, and retention tactics for SaaS founders and product managers.",
    priceCents: 1900,
    thumbnailUrl: "/images/product-ebook.png",
  },
  {
    title: "Cinematic Photo Presets",
    description: "40 professional Lightroom presets for photographers. Includes film emulation, moody tones, warm portraits, and landscape enhancement profiles with mobile support.",
    priceCents: 2400,
    thumbnailUrl: "/images/product-presets.png",
  },
  {
    title: "Notion Productivity System",
    description: "All-in-one Notion workspace template with project management, habit tracking, goal setting, journal, and CRM modules. Duplicate and customize for your workflow.",
    priceCents: 1500,
    thumbnailUrl: "/images/product-notion.png",
  },
];

export async function seedDatabase() {
  const existing = await db.select().from(products).where(eq(products.source, "PLATFORM"));
  if (existing.length > 0) {
    return;
  }

  for (const p of platformProducts) {
    await storage.createProduct({
      ownerId: null,
      source: "PLATFORM",
      title: p.title,
      description: p.description,
      priceCents: p.priceCents,
      thumbnailUrl: p.thumbnailUrl,
      status: "ACTIVE",
    });
  }

  console.log("Seeded 6 platform products");
}
