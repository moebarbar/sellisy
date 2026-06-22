import { Link } from "wouter";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { usePageMeta } from "@/hooks/use-page-meta";
import { BlogHero } from "@/components/blog/blog-hero";
import { BLOG_ARTICLES, BLOG_BASE_URL } from "@/data/blog";
import { Clock, ArrowRight } from "lucide-react";

export default function BlogIndexPage() {
  usePageMeta({
    title: "Sellisy Blog — Selling Digital Products, Fees & Growth",
    description:
      "Honest guides on selling digital products: platform fees compared, how to keep 100% of your sales, PLR explained, pricing, courses, and Stripe setup.",
    canonicalUrl: `${BLOG_BASE_URL}/blog`,
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Sellisy Blog",
      url: `${BLOG_BASE_URL}/blog`,
      description: "Guides on selling digital products, platform fees, PLR, pricing, and growth for independent creators.",
      publisher: { "@type": "Organization", name: "Sellisy", url: BLOG_BASE_URL },
    },
  });

  const [featured, ...rest] = BLOG_ARTICLES;

  return (
    <div className="landing-page min-h-screen" data-testid="blog-index-page">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 pt-28 pb-10">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The Sellisy Blog</span>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          Sell smarter, <span className="text-primary">keep more.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Straight-talking guides on selling digital products — what platforms really charge, how to keep 100% of your sales, and how to grow a store you actually own.
        </p>
      </section>

      {featured && (
        <section className="mx-auto max-w-5xl px-6 pb-12">
          <Link href={`/blog/${featured.slug}`} className="group block" data-testid={`link-featured-${featured.slug}`}>
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <BlogHero variant={featured.heroVariant} title={featured.h1} />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">{featured.category}</span>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-foreground group-hover:text-primary">{featured.title}</h2>
                <p className="mt-3 text-muted-foreground">{featured.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Read article <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="group flex flex-col rounded-2xl border border-border overflow-hidden transition-colors hover:border-primary/40" data-testid={`link-article-${a.slug}`}>
                <BlogHero variant={a.heroVariant} title={a.h1} />
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">{a.category}</span>
                  <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight text-foreground group-hover:text-primary">{a.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {a.readMinutes} min read
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
