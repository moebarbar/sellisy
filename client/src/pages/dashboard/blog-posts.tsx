import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useActiveStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, Trash2, Loader2, MoreHorizontal, Eye, EyeOff, Calendar, Pencil, ExternalLink } from "lucide-react";
import type { BlogPost } from "@shared/schema";

export default function BlogPostsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { activeStore } = useActiveStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts", activeStore?.id],
    queryFn: async () => {
      if (!activeStore) return [];
      const res = await fetch(`/api/blog-posts?storeId=${activeStore.id}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!activeStore,
  });

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/blog-posts", { storeId: activeStore!.id, title: title || "Untitled" });
      return res.json();
    },
    onSuccess: (post: BlogPost) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", activeStore?.id] });
      toast({ title: "Created", description: `"${post.title}" is ready to edit.` });
      setShowCreate(false);
      setNewTitle("");
      navigate(`/dashboard/blog/${post.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/blog-posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", activeStore?.id] });
      toast({ title: "Deleted", description: "Blog post has been deleted." });
      setDeleteTarget(null);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const res = await apiRequest("PATCH", `/api/blog-posts/${id}`, { isPublished });
      return res.json();
    },
    onSuccess: (updated: BlogPost) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", activeStore?.id] });
      toast({ title: updated.isPublished ? "Published" : "Unpublished", description: `"${updated.title}" is now ${updated.isPublished ? "live" : "hidden"}.` });
    },
  });

  if (!activeStore) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Create a store first to start blogging.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-blog-title">Blog</h1>
          <p className="text-muted-foreground text-sm mt-1">Write and publish articles for your store</p>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-blog-post">
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      {!activeStore.blogEnabled && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Blog is disabled</p>
              <p className="text-xs text-muted-foreground mt-0.5">Enable the blog in Store Settings to make your posts visible on your storefront.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/settings")} data-testid="button-goto-settings">
              Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : !posts?.length ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No blog posts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first blog post to share content with your audience.</p>
            <Button onClick={() => setShowCreate(true)} data-testid="button-create-first-post">
              <Plus className="h-4 w-4 mr-2" /> Create First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-blog-post-${post.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                {post.coverImageUrl ? (
                  <img src={post.coverImageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0" onClick={() => navigate(`/dashboard/blog/${post.id}`)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">{post.category}</Badge>
                    <Badge variant={post.isPublished ? "default" : "secondary"} className="text-xs flex-shrink-0">
                      {post.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  {post.excerpt && <p className="text-sm text-muted-foreground truncate">{post.excerpt}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    {post.publishedAt && (
                      <span>Published {new Date(post.publishedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0" data-testid={`button-menu-${post.id}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/dashboard/blog/${post.id}`)}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => togglePublishMutation.mutate({ id: post.id, isPublished: !post.isPublished })}>
                      {post.isPublished ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {post.isPublished ? "Unpublish" : "Publish"}
                    </DropdownMenuItem>
                    {post.isPublished && activeStore.blogEnabled && (
                      <DropdownMenuItem onClick={() => window.open(`/s/${activeStore.slug}/blog/${post.slug}`, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" /> View Live
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(post)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Blog Post</DialogTitle>
            <DialogDescription>Give your blog post a title to get started.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="My awesome post..."
                onKeyDown={(e) => e.key === "Enter" && createMutation.mutate(newTitle)}
                data-testid="input-blog-title"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(newTitle)} disabled={createMutation.isPending} data-testid="button-submit-create">
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
