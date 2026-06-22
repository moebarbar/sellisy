import type { BlogArticle } from "./types";
import { keep100Percent } from "./keep-100-percent";
import { platformFeesCompared } from "./platform-fees-compared";
import { bestGumroadAlternatives } from "./best-gumroad-alternatives";
import { whatIsPlr } from "./what-is-plr";
import { mrrVsPlr } from "./mrr-vs-plr";
import { bestDigitalProductsToSell } from "./best-digital-products-to-sell";
import { setUpStripe } from "./set-up-stripe";
import { createAndSellOnlineCourse } from "./create-and-sell-online-course";
import { stripeVsPaypal } from "./stripe-vs-paypal";
import { priceDigitalProducts } from "./price-digital-products";

// Display + sitemap order. Money/fees cluster first (highest commercial
// intent + the differentiation moat), then PLR, then the educational set —
// matching the research's publish sequencing.
export const BLOG_ARTICLES: BlogArticle[] = [
  keep100Percent,
  platformFeesCompared,
  bestGumroadAlternatives,
  whatIsPlr,
  mrrVsPlr,
  bestDigitalProductsToSell,
  setUpStripe,
  createAndSellOnlineCourse,
  stripeVsPaypal,
  priceDigitalProducts,
];

export function getArticle(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((a) => a.slug === slug);
}

export function getArticleSlugs(): string[] {
  return BLOG_ARTICLES.map((a) => a.slug);
}

export * from "./types";
