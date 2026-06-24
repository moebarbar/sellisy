// Marketing blog content model. Articles are structured block arrays (not
// markdown) so the renderer emits clean, SEO-correct HTML (real <h2>/<h3>,
// <table>, <a>) with full brand control and zero SSR/hydration risk — the
// same data-module pattern as competitors.ts.
//
// Imported by BOTH the React pages (client) and server/og-tags.ts (build +
// runtime SEO), so keep this file dependency-free.

export type InlineText = string; // supports **bold** and [label](href)

export type ArticleBlock =
  | { type: "p"; text: InlineText }
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string; id: string }
  | { type: "ul"; items: InlineText[] }
  | { type: "ol"; items: InlineText[] }
  | { type: "callout"; variant: "tip" | "note" | "warning" | "key"; title?: string; text: InlineText }
  | { type: "quote"; text: InlineText; cite?: string }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][]; highlightCol?: number }
  | { type: "cta"; heading: string; text: string; href: string; label: string }
  | { type: "faq"; items: { q: string; a: InlineText }[] };

export type BlogCategory = "Fees & Money" | "PLR & Resell" | "Guides" | "Comparisons";

export interface BlogArticle {
  slug: string;
  /** <title> + og:title. ~50–60 chars. */
  title: string;
  /** On-page H1 (can differ slightly from <title>). */
  h1: string;
  /** Meta description + og:description. 120–158 chars. */
  description: string;
  /** Short card excerpt for the index. */
  excerpt: string;
  category: BlogCategory;
  /** Primary target keyword (for internal reference). */
  keyword: string;
  /** ISO date. */
  datePublished: string;
  dateModified: string;
  readMinutes: number;
  /** Unique hero composition key — one per article, see BlogHero. */
  heroVariant:
    | "keep100"
    | "fees"
    | "alternatives"
    | "plr"
    | "mrrplr"
    | "products"
    | "stripe"
    | "course"
    | "vs"
    | "pricing";
  /** Eyebrow shown above the H1. */
  eyebrow: string;
  sections: ArticleBlock[];
  /** Rendered as a FAQ block at the end AND emitted as FAQPage JSON-LD. */
  faq: { q: string; a: string }[];
}

export const BLOG_AUTHOR = "The Sellisy Team";
export const BLOG_BASE_URL = "https://sellisy.com";
