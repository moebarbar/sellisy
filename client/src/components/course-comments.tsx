import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Pin, Trash2, Crown } from "lucide-react";

type Comment = {
  id: string;
  body: string;
  authorType: "buyer" | "owner";
  authorName: string | null;
  isPinned: boolean;
  isMine: boolean;
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

  const { data, isLoading } = useQuery<Comment[]>({
    queryKey,
    queryFn: async () => (await apiRequest("GET", `/api/courses/access/${token}/${productId}/lessons/${lessonId}/comments`)).json(),
  });

  const post = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/access/${token}/${productId}/lessons/${lessonId}/comments`, {
        body: body.trim(),
        authorName: name.trim() || undefined,
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
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4" />
          Discussion
          {data && <span className="text-xs text-muted-foreground font-normal">({data.length})</span>}
        </div>

        {/* Compose */}
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
              onClick={() => post.mutate()}
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
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No comments yet. Be the first to start the conversation.
          </p>
        ) : (
          <div className="space-y-2">
            {data.map((c) => (
              <div
                key={c.id}
                data-testid={`card-comment-${c.id}`}
                className={`rounded-md p-3 border ${
                  c.isPinned ? "bg-primary/5 border-primary/30" : "bg-card"
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold truncate">
                    {c.authorName || (c.authorType === "owner" ? "Instructor" : "Anonymous")}
                  </span>
                  {c.authorType === "owner" && (
                    <Badge variant="default" className="text-[10px]">
                      <Crown className="h-2.5 w-2.5 mr-0.5" />
                      Instructor
                    </Badge>
                  )}
                  {c.isPinned && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Pin className="h-2.5 w-2.5 mr-0.5" />
                      Pinned
                    </Badge>
                  )}
                  {c.isMine && <Badge variant="outline" className="text-[10px]">You</Badge>}
                  <span className="text-xs text-muted-foreground">· {timeAgo(c.createdAt)}</span>
                  {c.isMine && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto"
                      onClick={() => deleteMine.mutate(c.id)}
                      disabled={deleteMine.isPending}
                      data-testid={`button-delete-comment-${c.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-line">{c.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
