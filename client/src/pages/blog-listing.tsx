import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, FileText, Clock, Search, ArrowRight, Tag } from "lucide-react";
import type { Store, BlogPost } from "@shared/schema";
import { usePageMeta } from "@/hooks/use-page-meta";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function PostCard({ post, slug, accent, featured = false }: { post: BlogPost; slug: string; accent: string; featured?: boolean }) {
  if (featured) {
    return (
      <Link href={`/s/${slug}/blog/${post.slug}`}>
        <div className="group relative rounded-2xl overflow-hidden cursor-pointer" data-testid={`card-featured-post-${post.id}`}>
          <div className="relative aspect-[2.2/1] min-h-[280px]">
            {post.coverImageUrl ? (
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}30)` }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="text-[11px] font-medium" style={{ backgroundColor: accent, color: "#fff" }} data-testid="badge-featured">
                Featured
              </Badge>
              <Badge variant="outline" className="text-[11px] border-white/30 text-white/80" data-testid={`badge-category-${post.id}`}>
                {post.category}
              </Badge>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:underline decoration-2 underline-offset-4">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-white/70 text-sm md:text-base line-clamp-2 max-w-2xl mb-3">{post.excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {post.publishedAt ? formatDate(post.publishedAt) : ""}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {post.readingTimeMinutes || 1} min read
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/s/${slug}/blog/${post.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-0 shadow-sm bg-card" data-testid={`card-blog-${post.id}`}>
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
                <FileText className="h-10 w-10 text-muted-foreground/20" />
              </div>
            )}
          </div>
          <div className="p-5 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5" data-testid={`badge-category-${post.id}`}>
                <Tag className="h-2.5 w-2.5 mr-1" />
                {post.category}
              </Badge>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readingTimeMinutes || 1} min
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-snug mb-2 group-hover:underline decoration-1 underline-offset-2 line-clamp-2">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-3 flex-1">{post.excerpt}</p>
            )}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {post.publishedAt ? formatDate(post.publishedAt) : ""}
              </span>
              <span className="text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>
                Read more <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function BlogListingPage() {
  const [, params] = useRoute("/s/:slug/blog");
  const slug = params?.slug;
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery<{ store: Store; posts: BlogPost[]; categories: string[] }>({
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
    ogImage: data?.store?.logoUrl || undefined,
    ogType: "website",
    favicon: data?.store?.faviconUrl || data?.store?.logoUrl || undefined,
  });

  const filteredPosts = useMemo(() => {
    if (!data?.posts) return [];
    let posts = data.posts;
    if (selectedCategory !== "All") {
      posts = posts.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt || "").toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return posts;
  }, [data?.posts, selectedCategory, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[320px] rounded-xl" />
            ))}
          </div>
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

  const { store, posts, categories } = data;
  const accent = store.accentColor || "#3b82f6";
  const allCategories = ["All", ...categories];
  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href={`/s/${slug}`} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-to-store">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            {store.logoUrl && (
              <img src={store.logoUrl} alt={store.name} className="w-8 h-8 rounded-full object-cover" />
            )}
            <div>
              <h1 className="font-bold text-base" data-testid="text-blog-store-name">{store.name}</h1>
              <p className="text-[11px] text-muted-foreground">Blog</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold tracking-tight mb-2" data-testid="text-blog-heading">Blog</h2>
          <p className="text-muted-foreground text-lg">
            Insights, tutorials, and updates from {store.name}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-blog-search"
            />
          </div>
          {allCategories.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap" data-testid="blog-category-filters">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? "text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  style={selectedCategory === cat ? { backgroundColor: accent } : undefined}
                  data-testid={`button-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-24">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground">Check back soon for new content.</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No matching articles</h3>
            <p className="text-muted-foreground text-sm">Try a different search term or category.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {featuredPost && selectedCategory === "All" && !searchQuery && (
              <PostCard post={featuredPost} slug={slug!} accent={accent} featured />
            )}

            <div>
              {(selectedCategory !== "All" || searchQuery) && (
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {filteredPosts.length} article{filteredPosts.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              )}
              {!searchQuery && selectedCategory === "All" && remainingPosts.length > 0 && (
                <h3 className="text-xl font-semibold mb-5">Recent Articles</h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(selectedCategory === "All" && !searchQuery ? remainingPosts : filteredPosts).map((post) => (
                  <PostCard key={post.id} post={post} slug={slug!} accent={accent} />
                ))}
              </div>
            </div>
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-16 pt-8 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {posts.length} article{posts.length !== 1 ? "s" : ""} published
              </p>
              <Link href={`/s/${slug}`} className="text-sm font-medium hover:underline" style={{ color: accent }} data-testid="link-visit-store">
                Visit Store
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
