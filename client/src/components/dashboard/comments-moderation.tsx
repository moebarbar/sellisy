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
import { MessageSquare, Pin, PinOff, Trash2, Crown, Send } from "lucide-react";

type ModerationComment = {
  id: string;
  body: string;
  authorType: "buyer" | "owner";
  authorName: string | null;
  authorEmail: string | null;
  isPinned: boolean;
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
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/lessons/${lessonId}/comments`, { body: reply.trim() });
    },
    onSuccess: () => {
      setReply("");
      toast({ title: "Posted as Instructor" });
      queryClient.invalidateQueries({ queryKey });
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-moderate-${lessonId}`}>
          <MessageSquare className="h-3 w-3 mr-1" /> Comments
          {(data?.length ?? 0) > 0 && <span className="ml-1.5 text-xs">({data!.length})</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comments — "{lessonTitle}"</DialogTitle>
          <DialogDescription>
            Pin, delete, or reply as Instructor. Pinned comments float to the top of the
            buyer's view.
          </DialogDescription>
        </DialogHeader>

        {/* Reply box for owner */}
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
              onClick={() => post.mutate()}
              disabled={!reply.trim() || post.isPending}
              data-testid="button-post-instructor-reply"
            >
              <Send className="h-3 w-3 mr-1" />
              {post.isPending ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>

        {/* Comment list */}
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {isLoading ? (
            <>
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No comments yet for this lesson.
            </p>
          ) : (
            data.map((c) => (
              <Card key={c.id} data-testid={`card-mod-comment-${c.id}`}>
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {c.authorName || (c.authorType === "owner" ? "Instructor" : "Anonymous")}
                    </span>
                    {c.authorType === "owner" && (
                      <Badge variant="default" className="text-[10px]">
                        <Crown className="h-2.5 w-2.5 mr-0.5" /> Instructor
                      </Badge>
                    )}
                    {c.isPinned && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Pin className="h-2.5 w-2.5 mr-0.5" /> Pinned
                      </Badge>
                    )}
                    {c.authorEmail && c.authorType === "buyer" && (
                      <span className="text-xs text-muted-foreground truncate">{c.authorEmail}</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-line">{c.body}</p>
                  <div className="flex items-center gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => togglePin.mutate({ id: c.id, isPinned: !c.isPinned })}
                      disabled={togglePin.isPending}
                      data-testid={`button-toggle-pin-${c.id}`}
                    >
                      {c.isPinned ? (
                        <><PinOff className="h-3 w-3 mr-1" /> Unpin</>
                      ) : (
                        <><Pin className="h-3 w-3 mr-1" /> Pin</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => remove.mutate(c.id)}
                      disabled={remove.isPending}
                      data-testid={`button-delete-mod-${c.id}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
