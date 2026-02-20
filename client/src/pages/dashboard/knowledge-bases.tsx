import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, BookOpen, Trash2, Loader2, FileText, ExternalLink, MoreHorizontal, Copy, Calendar, Layers } from "lucide-react";
import type { KnowledgeBase } from "@shared/schema";
import kbPlaceholder from "@/assets/images/kb-placeholder.png";

export default function KnowledgeBasesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBase | null>(null);

  const { data: knowledgeBases, isLoading } = useQuery<KnowledgeBase[]>({
    queryKey: ["/api/knowledge-bases"],
  });

  const [createError, setCreateError] = useState("");

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/knowledge-bases", { title: title || "Untitled" });
      return res.json();
    },
    onSuccess: (kb: KnowledgeBase) => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-bases"] });
      toast({ title: "Created", description: `"${kb.title}" is ready to edit.` });
      setShowCreate(false);
      setNewTitle("");
      setCreateError("");
      navigate(`/dashboard/kb/${kb.id}`);
    },
    onError: (err: Error) => {
      if (err.message.includes("already exists")) {
        setCreateError(err.message.replace(/^\d+:\s*/, "").replace(/[{}"]/g, "").replace("message:", "").trim());
      } else {
        toast({ title: "Error", description: "Failed to create knowledge base.", variant: "destructive" });
      }
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (kb: KnowledgeBase) => {
      const existingTitles = (knowledgeBases || []).map((k) => k.title.toLowerCase());
      let copyTitle = `${kb.title} (Copy)`;
      let n = 2;
      while (existingTitles.includes(copyTitle.toLowerCase())) {
        copyTitle = `${kb.title} (Copy ${n})`;
        n++;
      }
      const res = await apiRequest("POST", "/api/knowledge-bases", { title: copyTitle });
      return res.json();
    },
    onSuccess: (newKb: KnowledgeBase) => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-bases"] });
      toast({ title: "Duplicated", description: `"${newKb.title}" created.` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/knowledge-bases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-bases"] });
      toast({ title: "Deleted", description: "Knowledge base removed." });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-kb-heading">Content Creator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build courses, guides, SOPs, and digital products with the block editor
          </p>
        </div>
        <Button onClick={() => { setShowCreate(true); setCreateError(""); }} data-testid="button-create-kb">
          <Plus className="mr-2 h-4 w-4" />
          New Knowledge Base
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
      ) : !knowledgeBases || knowledgeBases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No knowledge bases yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create your first knowledge base to start building courses, guides, and digital products.
            </p>
            <Button onClick={() => { setShowCreate(true); setCreateError(""); }} data-testid="button-create-kb-empty">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {knowledgeBases.map((kb) => (
            <Card
              key={kb.id}
              className="cursor-pointer hover-elevate group/kb overflow-visible"
              onClick={() => navigate(`/dashboard/kb/${kb.id}`)}
              data-testid={`card-kb-${kb.id}`}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <div className="aspect-square rounded-t-md overflow-hidden">
                    <img
                      src={kb.coverImageUrl || kbPlaceholder}
                      alt={kb.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/kb:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>
                  <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
                    {kb.isPublished ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Published</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background/60 backdrop-blur-sm">Draft</Badge>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 invisible group-hover/kb:visible" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 bg-background/60 backdrop-blur-sm"
                          data-testid={`button-kb-menu-${kb.id}`}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onClick={() => duplicateMutation.mutate(kb)}
                          data-testid={`button-duplicate-kb-${kb.id}`}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(kb)}
                          data-testid={`button-delete-kb-${kb.id}`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-semibold text-sm leading-snug break-words text-white drop-shadow-sm" data-testid={`text-kb-title-${kb.id}`}>
                      {kb.title}
                    </h3>
                  </div>
                </div>
                <div className="px-3.5 py-2.5 space-y-1.5">
                  {kb.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{kb.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(kb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {kb.priceCents > 0 && (
                      <Badge variant="outline" className="text-[10px]">${(kb.priceCents / 100).toFixed(2)}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Knowledge Base</DialogTitle>
            <DialogDescription>Give your knowledge base a name to get started.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="kb-title">Title</Label>
              <Input
                id="kb-title"
                placeholder="e.g., Social Media Mastery Course"
                value={newTitle}
                onChange={(e) => { setNewTitle(e.target.value); setCreateError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") createMutation.mutate(newTitle); }}
                data-testid="input-kb-title"
              />
              {createError && (
                <p className="text-sm text-destructive" data-testid="text-create-kb-error">{createError}</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={() => createMutation.mutate(newTitle)}
              disabled={createMutation.isPending}
              data-testid="button-confirm-create-kb"
            >
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create & Open Editor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Knowledge Base</DialogTitle>
            <DialogDescription>
              This will permanently delete "{deleteTarget?.title}" and all its pages and content. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} data-testid="button-cancel-delete-kb">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-kb"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
