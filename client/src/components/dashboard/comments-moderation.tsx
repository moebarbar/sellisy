import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { MessageSquare, Pin, PinOff, Trash2, Crown, Send, Reply, Pencil, X } from "lucide-react";

type ModerationComment = {
  id: string;
  body: string;
  parentId: string | null;
  authorType: "buyer" | "owner";
  authorName: string | null;
  authorEmail: string | null;
  isPinned: boolean;
  editedAt: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function CommentsModeration({ lessonId, lessonTitle }: { lessonId: string; lessonTitle: string }) {
  const [open, setOpen] = useState(false);

  const queryKey = ["/api/courses/lessons", lessonId, "comments"];
  const { data, isLoading } = useQuery<ModerationComment[]>({
    queryKey,
    queryFn: async () => (await apiRequest("GET", `/api/courses/lessons/${lessonId}/comments`)).json(),
    enabled: open,
  });

  const { toast } = useToast();
  const [reply, setReply] = useState("");

  const post = useMutation({
    mutationFn: async (vars: { body: string; parentId?: string }) => {
      await apiRequest("POST", `/api/courses/lessons/${lessonId}/comments`, {
        body: vars.body.trim(),
        parentId: vars.parentId,
      });
    },
    onSuccess: () => {
      setReply("");
      toast({ title: "Posted as Instructor" });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast({ title: "Failed to post", description: err.message, variant: "destructive" });
    },
  });

  const edit = useMutation({
    mutationFn: async (vars: { id: string; body: string }) => {
      await apiRequest("PATCH", `/api/courses/comments/${vars.id}`, { body: vars.body.trim() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err: any) => {
      toast({ title: "Edit failed", description: err.message, variant: "destructive" });
    },
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      await apiRequest("PATCH", `/api/courses/comments/${id}`, { isPinned });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/courses/comments/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Comment removed" });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const topLevel = (data ?? []).filter((c) => !c.parentId);
  const repliesByParent = new Map<string, ModerationComment[]>();
  for (const c of data ?? []) {
    if (c.parentId) {
      const list = repliesByParent.get(c.parentId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentId, list);
    }
  }
  Array.from(repliesByParent.values()).forEach((list) => {
    list.sort((a: ModerationComment, b: ModerationComment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-moderate-${lessonId}`}>
          <MessageSquare className="h-3 w-3 mr-1" /> Comments
          {(data?.length ?? 0) > 0 && <span className="ml-1.5 text-xs">({data!.length})</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comments — "{lessonTitle}"</DialogTitle>
          <DialogDescription>
            Pin, delete, edit your own posts, or reply as Instructor. Pinned comments float to the
            top of the buyer's view.
          </DialogDescription>
        </DialogHeader>

        {/* Top-level reply box for owner */}
        <div className="space-y-2 rounded-md border p-3 bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground">Post as Instructor</p>
          <Textarea
            rows={2}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply to the discussion as the instructor…"
            maxLength={2000}
            data-testid="input-instructor-reply"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => reply.trim() && post.mutate({ body: reply })}
              disabled={!reply.trim() || post.isPending}
              data-testid="button-post-instructor-reply"
            >
              <Send className="h-3 w-3 mr-1" />
              {post.isPending ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </>
          ) : topLevel.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No comments yet for this lesson.
            </p>
          ) : (
            topLevel.map((c) => (
              <ModerationThread
                key={c.id}
                comment={c}
                replies={repliesByParent.get(c.id) ?? []}
                onReply={(b) => post.mutate({ body: b, parentId: c.id })}
                onEdit={(id, b) => edit.mutate({ id, body: b })}
                onTogglePin={(id, isPinned) => togglePin.mutate({ id, isPinned })}
                onDelete={(id) => remove.mutate(id)}
                isPosting={post.isPending}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModerationThread({
  comment, replies, onReply, onEdit, onTogglePin, onDelete, isPosting,
}: {
  comment: ModerationComment;
  replies: ModerationComment[];
  onReply: (body: string) => void;
  onEdit: (id: string, body: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onDelete: (id: string) => void;
  isPosting: boolean;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  return (
    <div className="space-y-2">
      <ModerationRow
        comment={comment}
        onEdit={onEdit}
        onTogglePin={onTogglePin}
        onDelete={onDelete}
      />
      <div className="ml-6 space-y-2">
        {replies.map((r) => (
          <ModerationRow
            key={r.id}
            comment={r}
            onEdit={onEdit}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
            isReply
          />
        ))}
        {!replyOpen ? (
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            data-testid={`button-mod-reply-${comment.id}`}
          >
            <Reply className="h-3 w-3" />
            Reply as Instructor
          </button>
        ) : (
          <div className="space-y-2 rounded-md border p-2 bg-muted/20">
            <Textarea
              rows={2}
              placeholder="Reply as Instructor…"
              value={replyBody}
              maxLength={2000}
              onChange={(e) => setReplyBody(e.target.value)}
              data-testid={`input-mod-reply-${comment.id}`}
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setReplyOpen(false); setReplyBody(""); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (replyBody.trim()) {
                    onReply(replyBody);
                    setReplyOpen(false);
                    setReplyBody("");
                  }
                }}
                disabled={!replyBody.trim() || isPosting}
                data-testid={`button-post-mod-reply-${comment.id}`}
              >
                {isPosting ? "Posting…" : "Reply"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModerationRow({
  comment, onEdit, onTogglePin, onDelete, isReply,
}: {
  comment: ModerationComment;
  onEdit: (id: string, body: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onDelete: (id: string) => void;
  isReply?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(comment.body);

  return (
    <Card data-testid={`card-mod-comment-${comment.id}`} className={isReply ? "bg-muted/30" : undefined}>
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">
            {comment.authorName || (comment.authorType === "owner" ? "Instructor" : "Anonymous")}
          </span>
          {comment.authorType === "owner" && (
            <Badge variant="default" className="text-[10px]">
              <Crown className="h-2.5 w-2.5 mr-0.5" /> Instructor
            </Badge>
          )}
          {comment.isPinned && (
            <Badge variant="secondary" className="text-[10px]">
              <Pin className="h-2.5 w-2.5 mr-0.5" /> Pinned
            </Badge>
          )}
          {comment.authorEmail && comment.authorType === "buyer" && (
            <span className="text-xs text-muted-foreground truncate">{comment.authorEmail}</span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {timeAgo(comment.createdAt)}
            {comment.editedAt && <span className="italic"> · edited</span>}
          </span>
        </div>

        {editOpen ? (
          <div className="space-y-2 pt-1">
            <Textarea
              rows={2}
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
              data-testid={`input-mod-edit-${comment.id}`}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditOpen(false)}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (draft.trim() && draft.trim() !== comment.body) {
                    onEdit(comment.id, draft);
                  }
                  setEditOpen(false);
                }}
                disabled={!draft.trim()}
                data-testid={`button-save-mod-edit-${comment.id}`}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-line">{comment.body}</p>
        )}

        {!editOpen && (
          <div className="flex items-center gap-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onTogglePin(comment.id, !comment.isPinned)}
              data-testid={`button-toggle-pin-${comment.id}`}
            >
              {comment.isPinned ? (
                <><PinOff className="h-3 w-3 mr-1" /> Unpin</>
              ) : (
                <><Pin className="h-3 w-3 mr-1" /> Pin</>
              )}
            </Button>
            {comment.authorType === "owner" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => { setDraft(comment.body); setEditOpen(true); }}
                data-testid={`button-edit-mod-${comment.id}`}
              >
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => onDelete(comment.id)}
              data-testid={`button-delete-mod-${comment.id}`}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
