import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Pin, Trash2, Crown, Reply, Pencil, X, Bell, BellOff } from "lucide-react";

type Comment = {
  id: string;
  body: string;
  parentId: string | null;
  authorType: "buyer" | "owner";
  authorName: string | null;
  isPinned: boolean;
  isMine: boolean;
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

export function CourseComments({
  token, productId, lessonId,
}: {
  token: string;
  productId: string;
  lessonId: string;
}) {
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [name, setName] = useState("");

  const queryKey = ["/api/courses/access", token, productId, "lessons", lessonId, "comments"];
  const prefsKey = ["/api/courses/access", token, productId, "notification-prefs"];

  const { data, isLoading } = useQuery<Comment[]>({
    queryKey,
    queryFn: async () => (await apiRequest("GET", `/api/courses/access/${token}/${productId}/lessons/${lessonId}/comments`)).json(),
  });

  const { data: prefs } = useQuery<{ commentNotificationsEnabled: boolean }>({
    queryKey: prefsKey,
    queryFn: async () => (await apiRequest("GET", `/api/courses/access/${token}/${productId}/notification-prefs`)).json(),
  });

  const togglePrefs = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest("PATCH", `/api/courses/access/${token}/${productId}/notification-prefs`, {
        commentNotificationsEnabled: enabled,
      });
    },
    onSuccess: (_, enabled) => {
      queryClient.setQueryData(prefsKey, { commentNotificationsEnabled: enabled });
      toast({
        title: enabled ? "Email notifications on" : "Email notifications off",
        description: enabled
          ? "You'll get emails when the instructor replies."
          : "You won't get discussion emails for this course.",
      });
    },
  });

  // Separate top-level + replies grouped by parent.
  const topLevel = (data ?? []).filter((c) => !c.parentId);
  const repliesByParent = new Map<string, Comment[]>();
  for (const c of data ?? []) {
    if (c.parentId) {
      const list = repliesByParent.get(c.parentId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentId, list);
    }
  }
  // Replies oldest-first under parent so threads read top-to-bottom.
  Array.from(repliesByParent.values()).forEach((list) => {
    list.sort((a: Comment, b: Comment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  const post = useMutation({
    mutationFn: async (vars: { parentId?: string; body: string }) => {
      await apiRequest("POST", `/api/courses/access/${token}/${productId}/lessons/${lessonId}/comments`, {
        body: vars.body.trim(),
        authorName: name.trim() || undefined,
        parentId: vars.parentId,
      });
    },
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast({ title: "Could not post comment", description: err.message, variant: "destructive" });
    },
  });

  const editMine = useMutation({
    mutationFn: async (vars: { id: string; body: string }) => {
      await apiRequest("PATCH", `/api/courses/access/${token}/${productId}/lessons/${lessonId}/comments/${vars.id}`, {
        body: vars.body.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast({ title: "Could not edit", description: err.message, variant: "destructive" });
    },
  });

  const deleteMine = useMutation({
    mutationFn: async (commentId: string) => {
      await apiRequest("DELETE", `/api/courses/access/${token}/${productId}/lessons/${lessonId}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <Card data-testid="course-comments">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4" />
            Discussion
            {data && <span className="text-xs text-muted-foreground font-normal">({data.length})</span>}
          </div>
          {prefs && (
            <button
              type="button"
              onClick={() => togglePrefs.mutate(!prefs.commentNotificationsEnabled)}
              disabled={togglePrefs.isPending}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              title={
                prefs.commentNotificationsEnabled
                  ? "Email me when the instructor replies"
                  : "Email notifications are off"
              }
              data-testid="button-toggle-notifications"
            >
              {prefs.commentNotificationsEnabled ? (
                <><Bell className="h-3 w-3" /> Email notifications on</>
              ) : (
                <><BellOff className="h-3 w-3" /> Email notifications off</>
              )}
            </button>
          )}
        </div>

        {/* Compose top-level */}
        <div className="space-y-2 rounded-md border p-3">
          <Textarea
            rows={2}
            placeholder="Ask a question or share what you learned…"
            value={body}
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
            data-testid="input-comment-body"
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Display name (optional)"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[200px]"
              data-testid="input-comment-author-name"
            />
            <Button
              size="sm"
              onClick={() => body.trim() && post.mutate({ body })}
              disabled={!body.trim() || post.isPending}
              data-testid="button-post-comment"
            >
              {post.isPending ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : topLevel.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No comments yet. Be the first to start the conversation.
          </p>
        ) : (
          <div className="space-y-3">
            {topLevel.map((c) => (
              <CommentNode
                key={c.id}
                comment={c}
                replies={repliesByParent.get(c.id) ?? []}
                onReply={(rb) => post.mutate({ parentId: c.id, body: rb })}
                onEdit={(id, b) => editMine.mutate({ id, body: b })}
                onDelete={(id) => deleteMine.mutate(id)}
                isReplying={post.isPending}
                isEditing={editMine.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommentNode({
  comment, replies, onReply, onEdit, onDelete, isReplying, isEditing,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (body: string) => void;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  isReplying: boolean;
  isEditing: boolean;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  return (
    <div className="space-y-2">
      <CommentRow
        comment={comment}
        onEdit={onEdit}
        onDelete={onDelete}
        isEditing={isEditing}
      />

      <div className="ml-6 space-y-2">
        {replies.map((r) => (
          <CommentRow
            key={r.id}
            comment={r}
            onEdit={onEdit}
            onDelete={onDelete}
            isEditing={isEditing}
            isReply
          />
        ))}

        {!replyOpen ? (
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            data-testid={`button-reply-${comment.id}`}
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>
        ) : (
          <div className="space-y-2 rounded-md border p-2 bg-muted/30">
            <Textarea
              rows={2}
              placeholder="Write a reply…"
              value={replyBody}
              maxLength={2000}
              onChange={(e) => setReplyBody(e.target.value)}
              data-testid={`input-reply-body-${comment.id}`}
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
                disabled={!replyBody.trim() || isReplying}
                data-testid={`button-post-reply-${comment.id}`}
              >
                {isReplying ? "Posting…" : "Reply"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentRow({
  comment, onEdit, onDelete, isEditing, isReply,
}: {
  comment: Comment;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  isReply?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(comment.body);

  return (
    <div
      data-testid={`card-comment-${comment.id}`}
      className={`rounded-md p-3 border ${
        comment.isPinned ? "bg-primary/5 border-primary/30" : isReply ? "bg-muted/30" : "bg-card"
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="text-sm font-semibold truncate">
          {comment.authorName || (comment.authorType === "owner" ? "Instructor" : "Anonymous")}
        </span>
        {comment.authorType === "owner" && (
          <Badge variant="default" className="text-[10px]">
            <Crown className="h-2.5 w-2.5 mr-0.5" />
            Instructor
          </Badge>
        )}
        {comment.isPinned && (
          <Badge variant="secondary" className="text-[10px]">
            <Pin className="h-2.5 w-2.5 mr-0.5" />
            Pinned
          </Badge>
        )}
        {comment.isMine && <Badge variant="outline" className="text-[10px]">You</Badge>}
        <span className="text-xs text-muted-foreground">· {timeAgo(comment.createdAt)}</span>
        {comment.editedAt && (
          <span className="text-xs text-muted-foreground italic">(edited)</span>
        )}
        {comment.isMine && !editOpen && (
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => { setDraft(comment.body); setEditOpen(true); }}
              data-testid={`button-edit-comment-${comment.id}`}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onDelete(comment.id)}
              data-testid={`button-delete-comment-${comment.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {editOpen ? (
        <div className="space-y-2">
          <Textarea
            rows={2}
            value={draft}
            maxLength={2000}
            onChange={(e) => setDraft(e.target.value)}
            data-testid={`input-edit-body-${comment.id}`}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditOpen(false)}
            >
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
              disabled={!draft.trim() || isEditing}
              data-testid={`button-save-edit-${comment.id}`}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-line">{comment.body}</p>
      )}
    </div>
  );
}
