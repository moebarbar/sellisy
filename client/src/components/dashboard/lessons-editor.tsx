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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Video, Pencil, FolderPlus } from "lucide-react";
import { QuizEditor } from "@/components/dashboard/quiz-editor";
import { CommentsModeration } from "@/components/dashboard/comments-moderation";

type Lesson = {
  id: string;
  productId: string;
  moduleId: string | null;
  title: string;
  description: string | null;
  videoUrl: string | null;
  attachmentUrl: string | null;
  durationSeconds: number | null;
  sortOrder: number;
  unlockAfterDays: number | null;
};

type Module = {
  id: string;
  productId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  unlockAfterDays: number | null;
};

function fmtDuration(s: number | null): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function LessonsEditor({ productId }: { productId: string | undefined }) {
  if (!productId) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Save the product first, then come back to add modules and lessons.
        </CardContent>
      </Card>
    );
  }
  return <InnerEditor productId={productId} />;
}

function InnerEditor({ productId }: { productId: string }) {
  const { toast } = useToast();
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [creatingLessonInModule, setCreatingLessonInModule] = useState<string | null | undefined>(undefined);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [creatingModule, setCreatingModule] = useState(false);

  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/courses/products", productId, "lessons"],
    queryFn: async () => (await apiRequest("GET", `/api/courses/products/${productId}/lessons`)).json(),
  });

  const { data: modules, isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ["/api/courses/products", productId, "modules"],
    queryFn: async () => (await apiRequest("GET", `/api/courses/products/${productId}/modules`)).json(),
  });

  const reorderLessons = useMutation({
    mutationFn: async (lessonIds: string[]) => {
      await apiRequest("POST", `/api/courses/products/${productId}/lessons/reorder`, { lessonIds });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/courses/products", productId, "lessons"] }),
  });

  const reorderModules = useMutation({
    mutationFn: async (moduleIds: string[]) => {
      await apiRequest("POST", `/api/courses/products/${productId}/modules/reorder`, { moduleIds });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/courses/products", productId, "modules"] }),
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/courses/lessons/${id}`); },
    onSuccess: () => {
      toast({ title: "Lesson deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/products", productId, "lessons"] });
    },
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/courses/modules/${id}`); },
    onSuccess: () => {
      toast({ title: "Module deleted", description: "Lessons inside it are now ungrouped." });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/products", productId, "modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/products", productId, "lessons"] });
    },
  });

  if (lessonsLoading || modulesLoading) return <Skeleton className="h-40" />;

  const lessonsByModule = (mId: string | null) =>
    (lessons || [])
      .filter((l) => (l.moduleId ?? null) === mId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  // Move lesson within its current module/group
  const moveLesson = (lessonId: string, dir: -1 | 1) => {
    const target = (lessons || []).find((l) => l.id === lessonId);
    if (!target) return;
    const peers = lessonsByModule(target.moduleId ?? null);
    const idx = peers.findIndex((l) => l.id === lessonId);
    const next = idx + dir;
    if (next < 0 || next >= peers.length) return;
    const reordered = [...peers];
    [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];
    // Reorder is sent for the whole product (server keys by productId + sortOrder).
    // Server expects a flat array — we send each scope concatenated.
    const all = [
      ...lessonsByModule(null),
      ...(modules || []).flatMap((m) => (m.id === target.moduleId ? reordered : lessonsByModule(m.id))),
    ];
    // If target is in top-level (no module), replace that part instead.
    if (target.moduleId === null) {
      const finalIds = [...reordered, ...(modules || []).flatMap((m) => lessonsByModule(m.id))].map((l) => l.id);
      reorderLessons.mutate(finalIds);
    } else {
      reorderLessons.mutate(all.map((l) => l.id));
    }
  };

  const moveModule = (moduleId: string, dir: -1 | 1) => {
    const list = modules || [];
    const idx = list.findIndex((m) => m.id === moduleId);
    const next = idx + dir;
    if (next < 0 || next >= list.length) return;
    const reordered = [...list];
    [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];
    reorderModules.mutate(reordered.map((m) => m.id));
  };

  const moveLessonToModule = useMutation({
    mutationFn: async ({ lessonId, moduleId }: { lessonId: string; moduleId: string | null }) => {
      await apiRequest("PATCH", `/api/courses/lessons/${lessonId}`, { moduleId });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/courses/products", productId, "lessons"] }),
  });

  const ungrouped = lessonsByModule(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-base">Modules & lessons</Label>
          <p className="text-xs text-muted-foreground">
            Group lessons into modules (chapters). Lessons without a module appear at the top.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={creatingModule} onOpenChange={setCreatingModule}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-add-module">
                <FolderPlus className="mr-2 h-4 w-4" /> Add Module
              </Button>
            </DialogTrigger>
            <ModuleFormDialog productId={productId} mode="create" onSaved={() => setCreatingModule(false)} />
          </Dialog>
          <Button
            size="sm"
            onClick={() => setCreatingLessonInModule(null)}
            data-testid="button-add-lesson"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Lesson
          </Button>
        </div>
      </div>

      {/* Ungrouped lessons */}
      {ungrouped.length > 0 && (
        <div className="space-y-1">
          {modules && modules.length > 0 && (
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Ungrouped</p>
          )}
          {ungrouped.map((lesson, idx) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              idx={idx}
              total={ungrouped.length}
              modules={modules || []}
              onMove={(d) => moveLesson(lesson.id, d)}
              onEdit={() => setEditingLesson(lesson)}
              onDelete={() => deleteLesson.mutate(lesson.id)}
              onAssignModule={(moduleId) => moveLessonToModule.mutate({ lessonId: lesson.id, moduleId })}
            />
          ))}
        </div>
      )}

      {/* Modules with their lessons */}
      {(modules || []).map((mod, mIdx) => {
        const lessonsHere = lessonsByModule(mod.id);
        return (
          <Card key={mod.id} data-testid={`card-module-${mod.id}`}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{mod.title}</p>
                  {mod.description && <p className="text-xs text-muted-foreground truncate">{mod.description}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => moveModule(mod.id, -1)} disabled={mIdx === 0}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => moveModule(mod.id, 1)} disabled={mIdx === (modules || []).length - 1}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditingModule(mod)} data-testid={`button-edit-module-${mod.id}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteModule.mutate(mod.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="pl-6 space-y-1">
                {lessonsHere.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No lessons in this module yet.</p>
                ) : (
                  lessonsHere.map((lesson, idx) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      idx={idx}
                      total={lessonsHere.length}
                      modules={modules || []}
                      onMove={(d) => moveLesson(lesson.id, d)}
                      onEdit={() => setEditingLesson(lesson)}
                      onDelete={() => deleteLesson.mutate(lesson.id)}
                      onAssignModule={(moduleId) => moveLessonToModule.mutate({ lessonId: lesson.id, moduleId })}
                    />
                  ))
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreatingLessonInModule(mod.id)}
                  className="text-xs"
                  data-testid={`button-add-lesson-to-${mod.id}`}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add lesson to this module
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Empty state */}
      {ungrouped.length === 0 && (modules || []).length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No lessons or modules yet. Add a lesson directly, or create a module first to group lessons.
          </CardContent>
        </Card>
      )}

      {/* Lesson create / edit dialogs */}
      <Dialog open={creatingLessonInModule !== undefined} onOpenChange={(o) => !o && setCreatingLessonInModule(undefined)}>
        {creatingLessonInModule !== undefined && (
          <LessonFormDialog
            productId={productId}
            mode="create"
            initialModuleId={creatingLessonInModule}
            onSaved={() => setCreatingLessonInModule(undefined)}
          />
        )}
      </Dialog>
      <Dialog open={!!editingLesson} onOpenChange={(o) => !o && setEditingLesson(null)}>
        {editingLesson && (
          <LessonFormDialog
            productId={productId}
            mode="edit"
            lesson={editingLesson}
            onSaved={() => setEditingLesson(null)}
          />
        )}
      </Dialog>
      <Dialog open={!!editingModule} onOpenChange={(o) => !o && setEditingModule(null)}>
        {editingModule && (
          <ModuleFormDialog
            productId={productId}
            mode="edit"
            module={editingModule}
            onSaved={() => setEditingModule(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

function LessonCard({
  lesson, idx, total, modules, onMove, onEdit, onDelete, onAssignModule,
}: {
  lesson: Lesson;
  idx: number;
  total: number;
  modules: Module[];
  onMove: (dir: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssignModule: (moduleId: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2" data-testid={`card-lesson-${lesson.id}`}>
      <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
      <div className="text-xs text-muted-foreground tabular-nums w-5 text-right">{idx + 1}.</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{lesson.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {lesson.videoUrl && <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" />video</span>}
          {lesson.durationSeconds ? <span>· {fmtDuration(lesson.durationSeconds)}</span> : null}
        </div>
      </div>
      <Select
        value={lesson.moduleId ?? "__none"}
        onValueChange={(v) => onAssignModule(v === "__none" ? null : v)}
      >
        <SelectTrigger className="h-7 text-xs w-32 shrink-0" data-testid={`select-lesson-module-${lesson.id}`}>
          <SelectValue placeholder="Module" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">(no module)</SelectItem>
          {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
        </SelectContent>
      </Select>
      <QuizEditor lessonId={lesson.id} lessonTitle={lesson.title} />
      <CommentsModeration lessonId={lesson.id} lessonTitle={lesson.title} />
      <div className="flex items-center shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(-1)} disabled={idx === 0}>
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(1)} disabled={idx === total - 1}>
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function ModuleFormDialog({
  productId, module: mod, mode, onSaved,
}: {
  productId: string;
  module?: Module;
  mode: "create" | "edit";
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(mod?.title ?? "");
  const [description, setDescription] = useState(mod?.description ?? "");
  const [unlockAfterDays, setUnlockAfterDays] = useState<number | null>(mod?.unlockAfterDays ?? null);

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        unlockAfterDays: unlockAfterDays,
      };
      if (mode === "create") {
        await apiRequest("POST", `/api/courses/products/${productId}/modules`, body);
      } else if (mod) {
        await apiRequest("PATCH", `/api/courses/modules/${mod.id}`, body);
      }
    },
    onSuccess: () => {
      toast({ title: mode === "create" ? "Module added" : "Module updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/products", productId, "modules"] });
      onSaved();
    },
    onError: (err: any) => {
      toast({ title: "Failed to save module", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Add module" : "Edit module"}</DialogTitle>
        <DialogDescription>Modules group lessons into chapters or sections.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="module-title">Title</Label>
          <Input id="module-title" value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-module-title" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="module-description">Description (optional)</Label>
          <Textarea
            id="module-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            data-testid="input-module-description"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="module-drip">Drip: unlock after (days, optional)</Label>
          <Input
            id="module-drip"
            type="number"
            min={0}
            max={730}
            placeholder="Leave empty for no drip"
            value={unlockAfterDays ?? ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              setUnlockAfterDays(v === "" ? null : Math.max(0, Number(v)));
            }}
            data-testid="input-module-unlock-after"
          />
          <p className="text-xs text-muted-foreground">
            All lessons in this module stay locked until N days after the buyer's purchase.
            Leave empty to make the module available immediately. Lesson-level drip can extend
            this for individual lessons.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onSaved}>Cancel</Button>
        <Button onClick={() => save.mutate()} disabled={!title.trim() || save.isPending}>
          {save.isPending ? "Saving..." : "Save module"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function LessonFormDialog({
  productId, lesson, mode, initialModuleId, onSaved,
}: {
  productId: string;
  lesson?: Lesson;
  mode: "create" | "edit";
  initialModuleId?: string | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? "");
  const [attachmentUrl, setAttachmentUrl] = useState(lesson?.attachmentUrl ?? "");
  const [duration, setDuration] = useState(lesson?.durationSeconds ?? 0);
  const [unlockAfterDays, setUnlockAfterDays] = useState<number | null>(lesson?.unlockAfterDays ?? null);

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
        durationSeconds: duration > 0 ? duration : undefined,
        unlockAfterDays: unlockAfterDays,
        ...(mode === "create" ? { moduleId: initialModuleId ?? undefined } : {}),
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
          Videos can be YouTube or Vimeo links — Sellisy embeds them automatically on the buyer's course player.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lesson-title">Title</Label>
          <Input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-lesson-title" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-description">Description (optional)</Label>
          <Textarea id="lesson-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-lesson-description" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-video">Video URL (YouTube / Vimeo)</Label>
          <Input id="lesson-video" placeholder="https://www.youtube.com/watch?v=..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} data-testid="input-lesson-video" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-attachment">Attachment URL (optional)</Label>
          <Input id="lesson-attachment" placeholder="https://link-to-pdf-or-zip" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} data-testid="input-lesson-attachment" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-duration">Duration (seconds)</Label>
          <Input id="lesson-duration" type="number" min={0} value={duration} onChange={(e) => setDuration(Math.max(0, Number(e.target.value)))} data-testid="input-lesson-duration" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-drip">Drip: unlock after (days, optional)</Label>
          <Input
            id="lesson-drip"
            type="number"
            min={0}
            max={730}
            placeholder="Leave empty for no drip"
            value={unlockAfterDays ?? ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              setUnlockAfterDays(v === "" ? null : Math.max(0, Number(v)));
            }}
            data-testid="input-lesson-unlock-after"
          />
          <p className="text-xs text-muted-foreground">
            Lesson stays locked until N days after the buyer's purchase. If the lesson is in a
            module that ALSO drips, the later of the two unlock times wins.
          </p>
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
