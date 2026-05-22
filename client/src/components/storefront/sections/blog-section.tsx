import { ArrowRight, Calendar, FileText } from "lucide-react";
import type { ThemeColors, StorefrontTheme } from "../theme-types";

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
};

interface BlogSectionProps {
  posts: BlogPostSummary[];
  c: ThemeColors;
  theme: StorefrontTheme;
  basePath: string;
}

export function BlogSection({ posts, c, theme, basePath }: BlogSectionProps) {
  if (posts.length === 0) return null;

  return (
    <div className={`mx-auto ${theme.layout.maxWidth} px-6 pb-24 relative z-10 block`}>
      <div className="mt-20">
        <div className="text-center mb-12">
          {theme.renderDivider?.(false)}
          <h2 className="text-2xl md:text-3xl font-bold mt-4 flex items-center justify-center gap-3" style={{ color: c.text, fontFamily: theme.typography.headingFamily }}>
            <FileText className="h-6 w-6" style={{ color: c.accent }} />
            Latest from the Blog
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <a
              key={post.id}
              href={`${basePath}/blog/${post.slug}`}
              className={`${theme.effects.cardClass} group block`}
              data-testid={`link-blog-${post.id}`}
            >
              {post.coverImageUrl && (
                <div className="overflow-hidden" style={{ borderRadius: `${theme.layout.cardBorderRadius} ${theme.layout.cardBorderRadius} 0 0` }}>
                  <img src={post.coverImageUrl} alt={post.title} className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                </div>
              )}
              <div className="p-5">
                {post.category && (
                  <span className="text-[10px] tracking-[0.15em] uppercase font-semibold" style={{ color: c.accent }}>{post.category}</span>
                )}
                <h3 className="font-bold text-sm mt-1 mb-2 line-clamp-2" style={{ color: c.text, fontFamily: theme.typography.headingFamily }}>{post.title}</h3>
                {post.excerpt && <p className="text-xs line-clamp-2" style={{ color: c.textSecondary }}>{post.excerpt}</p>}
                <div className="flex items-center gap-2 mt-3 text-[10px]" style={{ color: c.textTertiary }}>
                  <Calendar className="h-3 w-3" />
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </a>
          ))}
        </div>
        <div className="text-center mt-8">
          <a
            href={`${basePath}/blog`}
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: c.accent }}
            data-testid="link-blog-all"
          >
            View All Posts <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
