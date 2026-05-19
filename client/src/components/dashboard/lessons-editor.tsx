import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Video, Pencil } from "lucide-react";

type Lesson = {
  id: string;
  productId: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  attachmentUrl: string | null;
  durationSeconds: number | null;
  sortOrder: number;
};

function fmtDuration(s: number | null): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function LessonsEditor({ productId }: { productId: string | undefined }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/courses/products", productId, "lessons"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/courses/products/${productId}/lessons`);
      return res.json();
    },
    enabled: !!productId,
  });

  const reorder = useMutation({
    mutationFn: async (lessonIds: string[]) => {
      await apiRequest("POST", `/api/courses/products/${productId}/lessons/reorder`, { lessonIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/products", productId, "lessons"] });
    },
  });

  const deleteOne = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/courses/lessons/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Lesson deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/products", productId, "lessons"] });
    },
  });

  if (!productId) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Save the product first, then come back to add lessons.
        </CardContent>
      </Card>
    );
  }

  const move = (idx: number, dir: -1 | 1) => {
    if (!data) return;
    const next = [...data];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    reorder.mutate(next.map((l) => l.id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-base">Lessons</Label>
          <p className="text-xs text-muted-foreground">
            Buyers will see these in order on the course player page.
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-lesson">
              <Plus className="mr-2 h-4 w-4" /> Add Lesson
            </Button>
          </DialogTrigger>
          <LessonFormDialog productId={productId} onSaved={() => setCreating(false)} mode="create" />
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No lessons yet. Add the first one to start building your course.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {data.map((lesson, idx) => (
            <Card key={lesson.id} data-testid={`card-lesson-${lesson.id}`}>
              <CardContent className="flex items-center gap-3 p-3">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="text-xs text-muted-foreground tabular-nums w-6 text-right">{idx + 1}.</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{lesson.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {lesson.videoUrl && <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" />video</span>}
                    {lesson.durationSeconds ? <span>· {fmtDuration(lesson.durationSeconds)}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => move(idx, -1)} disabled={idx === 0}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => move(idx, 1)} disabled={idx === data.length - 1}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(lesson)} data-testid={`button-edit-lesson-${lesson.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteOne.mutate(lesson.id)} disabled={deleteOne.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <LessonFormDialog
            productId={productId}
            mode="edit"
            lesson={editing}
            onSaved={() => setEditing(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

function LessonFormDialog({
  productId,
  lesson,
  mode,
  onSaved,
}: {
  productId: string;
  lesson?: Lesson;
  mode: "create" | "edit";
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? "");
  const [attachmentUrl, setAttachmentUrl] = useState(lesson?.attachmentUrl ?? "");
  const [duration, setDuration] = useState(lesson?.durationSeconds ?? 0);

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
        durationSeconds: duration > 0 ? duration : undefined,
      };
      if (mode === "create") {
        await apiRequest("POST", `/api/courses/products/${productId}/lessons`, body);
      } else if (lesson) {
        await apiRequest("PATCH", `/api/courses/lessons/${lesson.id}`, body);
      }
    },
    onSuccess: () => {
      toast({ title: mode === "create" ? "Lesson added" : "Lesson updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/products", productId, "lessons"] });
      onSaved();
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Add lesson" : "Edit lesson"}</DialogTitle>
        <DialogDescription>
          Videos can be YouTube or Vimeo links — Sellisy embeds them automatically on the
          buyer's course player.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lesson-title">Title</Label>
          <Input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-lesson-title" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-description">Description (optional)</Label>
          <Textarea
            id="lesson-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            data-testid="input-lesson-description"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-video">Video URL (YouTube / Vimeo)</Label>
          <Input
            id="lesson-video"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            data-testid="input-lesson-video"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-attachment">Attachment URL (optional)</Label>
          <Input
            id="lesson-attachment"
            placeholder="https://link-to-pdf-or-zip"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            data-testid="input-lesson-attachment"
          />
          <p className="text-xs text-muted-foreground">
            Optional downloadable file for this specific lesson (worksheet, slides, etc.).
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-duration">Duration (seconds)</Label>
          <Input
            id="lesson-duration"
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(Math.max(0, Number(e.target.value)))}
            data-testid="input-lesson-duration"
          />
          <p className="text-xs text-muted-foreground">Optional — shown to buyers as e.g. "5:30".</p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onSaved}>Cancel</Button>
        <Button onClick={() => save.mutate()} disabled={!title.trim() || save.isPending} data-testid="button-save-lesson">
          {save.isPending ? "Saving..." : "Save lesson"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
