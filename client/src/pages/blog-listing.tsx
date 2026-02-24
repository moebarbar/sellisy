import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import type { Store, BlogPost } from "@shared/schema";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function BlogListingPage() {
  const [, params] = useRoute("/s/:slug/blog");
  const slug = params?.slug;

  const { data, isLoading, error } = useQuery<{ store: Store; posts: BlogPost[] }>({
    queryKey: ["/api/storefront", slug, "blog"],
    queryFn: async () => {
      const res = await fetch(`/api/storefront/${slug}/blog`);
      if (!res.ok) throw new Error("Blog not found");
      return res.json();
    },
    enabled: !!slug,
  });

  usePageMeta({
    title: data ? `Blog - ${data.store.name}` : "Blog",
    description: data ? `Read the latest articles from ${data.store.name}` : undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Blog not found</h1>
          <p className="text-muted-foreground">This store doesn't have a blog or it's not enabled.</p>
        </div>
      </div>
    );
  }

  const { store, posts } = data;
  const accent = store.accentColor || "#3b82f6";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/s/${slug}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            {store.logoUrl && (
              <img src={store.logoUrl} alt={store.name} className="w-8 h-8 rounded-full object-cover" />
            )}
            <div>
              <h1 className="font-bold text-lg" data-testid="text-blog-store-name">{store.name}</h1>
              <p className="text-xs text-muted-foreground">Blog</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold mb-8" data-testid="text-blog-heading">Blog</h2>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No articles published yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/s/${slug}/blog/${post.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group" data-testid={`card-blog-${post.id}`}>
                  <CardContent className="p-0 flex">
                    {post.coverImageUrl ? (
                      <div className="w-48 flex-shrink-0">
                        <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover rounded-l-xl" />
                      </div>
                    ) : null}
                    <div className="p-6 flex-1">
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors mb-2" style={{ color: undefined }}>
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
