import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, Tag, Share2, Link2, ArrowRight, FileText, Check } from "lucide-react";
import { useState } from "react";
import DOMPurify from "dompurify";
import type { Store, BlogPost, BlogBlock } from "@shared/schema";
import { usePageMeta } from "@/hooks/use-page-meta";

function sanitize(html: string) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ["b", "i", "u", "s", "em", "strong", "a", "br", "span", "code", "mark", "sub", "sup"], ALLOWED_ATTR: ["href", "target", "rel", "class", "style"] });
}

function BlogBlockRenderer({ block }: { block: BlogBlock }) {
  const content = block.content || "";

  switch (block.type) {
    case "heading1":
      return <h2 className="text-3xl font-bold mt-10 mb-4" dangerouslySetInnerHTML={{ __html: sanitize(content) }} />;
    case "heading2":
      return <h3 className="text-2xl font-semibold mt-8 mb-3" dangerouslySetInnerHTML={{ __html: sanitize(content) }} />;
    case "heading3":
      return <h4 className="text-xl font-semibold mt-6 mb-2" dangerouslySetInnerHTML={{ __html: sanitize(content) }} />;
    case "text":
      if (!content.trim()) return <div className="h-4" />;
      return <p className="text-base leading-relaxed mb-4 text-foreground/85" dangerouslySetInnerHTML={{ __html: sanitize(content) }} />;
    case "bullet_list":
      return (
        <div className="flex gap-3 mb-1">
          <span className="text-muted-foreground mt-1.5 text-xs">&#8226;</span>
          <div className="flex-1" dangerouslySetInnerHTML={{ __html: sanitize(content) }} />
        </div>
      );
    case "numbered_list":
      return (
        <div className="flex gap-3 mb-1">
          <span className="text-muted-foreground text-sm font-medium min-w-[1.5em] text-right">{(block.sortOrder || 0) + 1}.</span>
          <div className="flex-1" dangerouslySetInnerHTML={{ __html: sanitize(content) }} />
        </div>
      );
    case "todo": {
      const isChecked = content.startsWith("[x]") || content.startsWith("[X]");
      const text = content.replace(/^\[[ xX]\]\s*/, "");
      return (
        <div className="flex gap-3 mb-1 items-start">
          <input type="checkbox" checked={isChecked} readOnly className="mt-1.5 rounded" />
          <span className={isChecked ? "line-through text-muted-foreground" : ""} dangerouslySetInnerHTML={{ __html: sanitize(text) }} />
        </div>
      );
    }
    case "quote":
      return (
        <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-4 italic text-muted-foreground">
          <span dangerouslySetInnerHTML={{ __html: sanitize(content) }} />
        </blockquote>
      );
    case "callout":
      return (
        <div className="bg-muted/50 border rounded-lg p-4 my-4">
          <span dangerouslySetInnerHTML={{ __html: sanitize(content) }} />
        </div>
      );
    case "code":
      return (
        <pre className="bg-muted rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono">
          <code>{content}</code>
        </pre>
      );
    case "divider":
      return <hr className="my-8 border-border" />;
    case "image":
      if (!content) return null;
      return (
        <figure className="my-8">
          <img src={content} alt="" className="rounded-xl max-w-full mx-auto shadow-sm" />
        </figure>
      );
    case "video":
      if (!content) return null;
      if (content.includes("youtube.com") || content.includes("youtu.be")) {
        const videoId = content.includes("youtu.be")
          ? content.split("/").pop()?.split("?")[0]
          : new URL(content).searchParams.get("v");
        if (videoId) {
          return (
            <div className="my-8 aspect-video rounded-xl overflow-hidden shadow-sm">
              <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full" allowFullScreen />
            </div>
          );
        }
      }
      return (
        <div className="my-8">
          <video src={content} controls className="rounded-xl max-w-full mx-auto" />
        </div>
      );
    case "link": {
      let url = content;
      let label = content;
      if (content.includes("|")) {
        const [u, l] = content.split("|");
        url = u;
        label = l || u;
      }
      return (
        <a href={url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80 block mb-2">
          {label}
        </a>
      );
    }
    case "toggle": {
      const parts = content.split("\n---\n");
      const title = parts[0] || "Toggle";
      const body = parts.slice(1).join("\n---\n");
      return (
        <details className="my-4 border rounded-lg">
          <summary className="p-3 cursor-pointer font-medium" dangerouslySetInnerHTML={{ __html: sanitize(title) }} />
          {body && <div className="px-3 pb-3 text-sm" dangerouslySetInnerHTML={{ __html: sanitize(body) }} />}
        </details>
      );
    }
    default:
      if (!content.trim()) return null;
      return <p className="mb-4" dangerouslySetInnerHTML={{ __html: sanitize(content) }} />;
  }
}

function ShareButton({ accent }: { accent: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
        data-testid="button-share-copy"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
        data-testid="button-share-twitter"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </a>
    </div>
  );
}

function RelatedPostCard({ post, slug, accent }: { post: BlogPost; slug: string; accent: string }) {
  return (
    <Link href={`/s/${slug}/blog/${post.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-0 shadow-sm" data-testid={`card-related-${post.id}`}>
        <CardContent className="p-0 flex flex-col h-full">
          <div className="aspect-[16/10] overflow-hidden">
            {post.coverImageUrl ? (
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accent}10, ${accent}25)` }}
              >
                <FileText className="h-8 w-8 text-muted-foreground/20" />
              </div>
            )}
          </div>
          <div className="p-4">
            <Badge variant="secondary" className="text-[10px] mb-2">
              {post.category}
            </Badge>
            <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2 mb-1.5">
              {post.title}
            </h4>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readingTimeMinutes || 1} min
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPostPage() {
  const [, params] = useRoute("/s/:slug/blog/:postSlug");
  const slug = params?.slug;
  const postSlug = params?.postSlug;

  const { data, isLoading, error } = useQuery<{ store: Store; post: BlogPost; blocks: BlogBlock[]; relatedPosts: BlogPost[] }>({
    queryKey: ["/api/storefront", slug, "blog", postSlug],
    queryFn: async () => {
      const res = await fetch(`/api/storefront/${slug}/blog/${postSlug}`);
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    },
    enabled: !!slug && !!postSlug,
  });

  usePageMeta({
    title: data ? `${data.post.title} - ${data.store.name}` : "Blog Post",
    description: data?.post.excerpt || undefined,
    favicon: data?.store?.faviconUrl || data?.store?.logoUrl || undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Post not found</h1>
          <p className="text-muted-foreground">This blog post doesn't exist or hasn't been published yet.</p>
        </div>
      </div>
    );
  }

  const { store, post, blocks, relatedPosts } = data;
  const accent = store.accentColor || "#3b82f6";

  return (
    <div className="min-h-screen bg-background" style={post.fontFamily ? { fontFamily: `'${post.fontFamily}', sans-serif` } : undefined}>
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href={`/s/${slug}/blog`} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-to-blog">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            {store.logoUrl && (
              <img src={store.logoUrl} alt={store.name} className="w-7 h-7 rounded-full object-cover" />
            )}
            <span className="font-medium text-sm">{store.name}</span>
          </div>
          <ShareButton accent={accent} />
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-10">
        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full rounded-2xl mb-8 object-cover max-h-[420px] shadow-sm"
          />
        )}

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge className="text-[11px] font-medium" style={{ backgroundColor: accent, color: "#fff" }} data-testid="badge-post-category">
            <Tag className="h-3 w-3 mr-1" />
            {post.category}
          </Badge>
          <Badge variant="outline" className="text-[11px]" data-testid="badge-reading-time">
            <Clock className="h-3 w-3 mr-1" />
            {post.readingTimeMinutes || 1} min read
          </Badge>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" data-testid="text-post-title">{post.title}</h1>

        {post.excerpt && (
          <p className="text-lg text-muted-foreground mb-4 leading-relaxed">{post.excerpt}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {post.publishedAt
              ? formatDate(post.publishedAt)
              : formatDate(post.createdAt)}
          </span>
        </div>

        <div className="prose prose-lg max-w-none dark:prose-invert">
          {blocks.map((block) => (
            <BlogBlockRenderer key={block.id} block={block} />
          ))}
        </div>

        <div className="mt-12 pt-8 border-t flex items-center justify-between">
          <Link
            href={`/s/${slug}/blog`}
            className="text-sm font-medium flex items-center gap-1.5 hover:underline"
            style={{ color: accent }}
            data-testid="link-all-articles"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All articles
          </Link>
          <ShareButton accent={accent} />
        </div>
      </article>

      {relatedPosts && relatedPosts.length > 0 && (
        <section className="border-t bg-muted/30">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <h3 className="text-xl font-bold mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <RelatedPostCard key={rp.id} post={rp} slug={slug!} accent={accent} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
