import { useMemo } from "react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { usePageMeta } from "@/hooks/use-page-meta";
import { BlogHero } from "@/components/blog/blog-hero";
import { ArticleRenderer } from "@/components/blog/article-renderer";
import { getArticle, BLOG_ARTICLES, BLOG_BASE_URL, BLOG_AUTHOR } from "@/data/blog";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";

export default function BlogArticlePage({ params: propParams }: { params?: { slug: string } } = {}) {
  const routeParams = useParams<{ slug: string }>();
  const slug = propParams?.slug || routeParams.slug;
  const article = slug ? getArticle(slug) : undefined;

  const canonical = `${BLOG_BASE_URL}/blog/${slug}`;

  const jsonLd = useMemo(() => {
    if (!article) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.h1,
      description: article.description,
      datePublished: article.datePublished,
      dateModified: article.dateModified,
      author: { "@type": "Organization", name: BLOG_AUTHOR },
      publisher: {
        "@type": "Organization",
        name: "Sellisy",
        logo: { "@type": "ImageObject", url: `${BLOG_BASE_URL}/favicon.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      url: canonical,
    };
  }, [article, canonical]);

  usePageMeta(
    article
      ? {
          title: `${article.title} | Sellisy Blog`,
          description: article.description,
          canonicalUrl: canonical,
          ogType: "article",
          ogTitle: article.title,
          ogDescription: article.description,
          keywords: article.keyword,
          jsonLd,
        }
      : { title: "Article not found | Sellisy Blog", noindex: true },
  );

  if (!article) {
    return (
      <div className="landing-page min-h-screen" data-testid="blog-article-notfound">
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <h1 className="text-2xl font-bold text-foreground">Article not found</h1>
          <p className="mt-2 text-muted-foreground">This article may have moved.</p>
          <Link href="/blog" className="mt-6 inline-flex items-center gap-2 text-primary hover:opacity-80">
            <ArrowLeft className="h-4 w-4" /> Back to the blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Related: same category, excluding self, up to 3.
  const related = BLOG_ARTICLES.filter((a) => a.slug !== article.slug && a.category === article.category).slice(0, 3);

  return (
    <div className="landing-page min-h-screen" data-testid="blog-article-page">
      <Navbar />

      <article className="mx-auto max-w-3xl px-6 pt-28 pb-20">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-to-blog">
          <ArrowLeft className="h-4 w-4" /> Blog
        </Link>

        <header className="mt-6 mb-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{article.eyebrow}</span>
          <h1 className="mt-3 text-3xl sm:text-4xl md:text-[44px] font-bold leading-[1.1] tracking-tight text-foreground">{article.h1}</h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {article.readMinutes} min read</span>
            <span>·</span>
            <time dateTime={article.datePublished}>{new Date(article.datePublished).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
          </div>
        </header>

        <div className="mb-10">
          <BlogHero variant={article.heroVariant} title={article.h1} />
        </div>

        <ArticleRenderer blocks={article.sections} />

        {article.faq.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Frequently asked questions</h2>
            <div className="mt-5">
              <ArticleRenderer blocks={[{ type: "faq", items: article.faq }]} />
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="text-lg font-semibold text-foreground">Keep reading</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="group rounded-xl border border-border p-4 transition-colors hover:border-primary/40" data-testid={`link-related-${r.slug}`}>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">{r.category}</span>
                  <p className="mt-1.5 font-medium leading-snug text-foreground group-hover:text-primary">{r.title}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">Read <ArrowRight className="h-3 w-3" /></span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <Footer />
    </div>
  );
}
