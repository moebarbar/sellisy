import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar } from "lucide-react";
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
      return <h2 className="text-3xl font-bold mt-8 mb-4" dangerouslySetInnerHTML={{ __html: sanitize(content) }} />;
    case "heading2":
      return <h3 className="text-2xl font-semibold mt-6 mb-3" dangerouslySetInnerHTML={{ __html: sanitize(content) }} />;
    case "heading3":
      return <h4 className="text-xl font-semibold mt-5 mb-2" dangerouslySetInnerHTML={{ __html: sanitize(content) }} />;
    case "text":
      if (!content.trim()) return <div className="h-4" />;
      return <p className="text-base leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: sanitize(content) }} />;
    case "bullet_list":
      return (
        <div className="flex gap-3 mb-1">
          <span className="text-muted-foreground mt-1.5 text-xs">•</span>
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
      return <hr className="my-6 border-border" />;
    case "image":
      if (!content) return null;
      return (
        <figure className="my-6">
          <img src={content} alt="" className="rounded-lg max-w-full mx-auto" />
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
            <div className="my-6 aspect-video rounded-lg overflow-hidden">
              <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full" allowFullScreen />
            </div>
          );
        }
      }
      return (
        <div className="my-6">
          <video src={content} controls className="rounded-lg max-w-full mx-auto" />
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

export default function BlogPostPage() {
  const [, params] = useRoute("/s/:slug/blog/:postSlug");
  const slug = params?.slug;
  const postSlug = params?.postSlug;

  const { data, isLoading, error } = useQuery<{ store: Store; post: BlogPost; blocks: BlogBlock[] }>({
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
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-64 w-full rounded-xl" />
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

  const { store, post, blocks } = data;

  return (
    <div className="min-h-screen bg-background" style={post.fontFamily ? { fontFamily: `'${post.fontFamily}', sans-serif` } : undefined}>
      <div className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/s/${slug}/blog`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            {store.logoUrl && (
              <img src={store.logoUrl} alt={store.name} className="w-8 h-8 rounded-full object-cover" />
            )}
            <span className="font-medium text-sm">{store.name}</span>
          </div>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-8">
        {post.coverImageUrl && (
          <img src={post.coverImageUrl} alt={post.title} className="w-full rounded-xl mb-8 object-cover max-h-[400px]" />
        )}

        <h1 className="text-4xl font-bold mb-4" data-testid="text-post-title">{post.title}</h1>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Calendar className="h-4 w-4" />
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            : new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </div>

        <div className="prose prose-lg max-w-none dark:prose-invert">
          {blocks.map((block) => (
            <BlogBlockRenderer key={block.id} block={block} />
          ))}
        </div>
      </article>
    </div>
  );
}
