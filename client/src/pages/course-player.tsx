import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Circle, ChevronLeft, ChevronRight, Download, ArrowLeft, AlertCircle,
} from "lucide-react";

type Lesson = {
  id: string;
  moduleId: string | null;
  title: string;
  description: string | null;
  videoUrl: string | null;
  attachmentUrl: string | null;
  durationSeconds: number | null;
  sortOrder: number;
  completed: boolean;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
};

type CourseData = {
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
  };
  modules: Module[];
  lessons: Lesson[];
  completedCount: number;
  totalCount: number;
};

function fmtDuration(s: number | null): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Same transformation logic used in the KB editor for video embeds.
function toEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const u = url.trim();
  // YouTube
  const ytMatch = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = u.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Already an embed URL or non-YT/Vimeo — return as-is and let iframe try
  return u;
}

export default function CoursePlayerPage() {
  const params = useParams<{ token: string; productId: string }>();
  const token = params.token ?? "";
  const productId = params.productId ?? "";

  const { data, isLoading, error } = useQuery<CourseData>({
    queryKey: ["/api/courses/access", token, productId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/courses/access/${token}/${productId}`);
      return res.json();
    },
    enabled: !!token && !!productId,
  });

  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);

  // Jump to the first not-yet-completed lesson on initial load.
  useEffect(() => {
    if (data && data.lessons.length > 0) {
      const firstUncomplete = data.lessons.findIndex((l) => !l.completed);
      setCurrentLessonIdx(firstUncomplete >= 0 ? firstUncomplete : 0);
    }
  }, [data?.course.id]);

  const markComplete = useMutation({
    mutationFn: async ({ lessonId, undo }: { lessonId: string; undo: boolean }) => {
      const method = undo ? "DELETE" : "POST";
      await apiRequest(method, `/api/courses/access/${token}/${productId}/lessons/${lessonId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/access", token, productId] });
    },
  });

  useEffect(() => {
    if (data?.course.title) document.title = `${data.course.title} — Sellisy`;
  }, [data?.course.title]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="aspect-video lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center py-12">
            <AlertCircle className="h-6 w-6 text-muted-foreground mb-3" />
            <h2 className="text-lg font-semibold mb-2">Can't load the course</h2>
            <p className="text-sm text-muted-foreground">
              Your access link may have expired. Go back to your purchases and click "Start course" again
              to get a fresh link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center py-12">
            <h2 className="text-lg font-semibold mb-2">{data.course.title}</h2>
            <p className="text-sm text-muted-foreground">
              The course owner hasn't added any lessons yet. Check back later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const current = data.lessons[currentLessonIdx];
  const embedUrl = toEmbedUrl(current.videoUrl);
  const pct = Math.round((data.completedCount / Math.max(1, data.totalCount)) * 100);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} data-testid="button-course-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="font-semibold truncate flex-1" data-testid="text-course-title">{data.course.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <Progress value={pct} className="w-24 hidden sm:block" />
            <span className="text-xs text-muted-foreground tabular-nums" data-testid="text-course-progress">
              {data.completedCount} / {data.totalCount}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player + current lesson description */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden border" data-testid="course-player">
            {embedUrl ? (
              <iframe
                key={current.id}
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={current.title}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                <p className="text-sm text-muted-foreground mb-2">No video for this lesson yet.</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-bold" data-testid="text-lesson-title">{current.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Lesson {currentLessonIdx + 1} of {data.lessons.length}
                  {current.durationSeconds ? ` · ${fmtDuration(current.durationSeconds)}` : ""}
                </p>
              </div>
              <Button
                variant={current.completed ? "outline" : "default"}
                onClick={() => markComplete.mutate({ lessonId: current.id, undo: current.completed })}
                disabled={markComplete.isPending}
                data-testid="button-mark-complete"
              >
                {current.completed ? (
                  <><CheckCircle2 className="h-4 w-4 mr-2" />Completed (undo)</>
                ) : (
                  <><Circle className="h-4 w-4 mr-2" />Mark complete</>
                )}
              </Button>
            </div>

            {current.description && (
              <div className="prose prose-sm max-w-none whitespace-pre-line">
                {current.description}
              </div>
            )}

            {current.attachmentUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={current.attachmentUrl} target="_blank" rel="noopener noreferrer" data-testid="link-lesson-attachment">
                  <Download className="h-4 w-4 mr-2" />
                  Download lesson resources
                </a>
              </Button>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={currentLessonIdx === 0}
                onClick={() => setCurrentLessonIdx(currentLessonIdx - 1)}
                data-testid="button-prev-lesson"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentLessonIdx >= data.lessons.length - 1}
                onClick={() => setCurrentLessonIdx(currentLessonIdx + 1)}
                data-testid="button-next-lesson"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Lesson sidebar — grouped by module if any modules exist */}
        <aside>
          <div className="sticky top-20">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Course outline
            </h3>
            <CourseOutline
              modules={data.modules || []}
              lessons={data.lessons}
              currentLessonIdx={currentLessonIdx}
              onSelect={setCurrentLessonIdx}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}

function CourseOutline({
  modules,
  lessons,
  currentLessonIdx,
  onSelect,
}: {
  modules: Module[];
  lessons: Lesson[];
  currentLessonIdx: number;
  onSelect: (idx: number) => void;
}) {
  // Group lessons by module (null = ungrouped). Lessons are already sorted by
  // sortOrder from the server. We render ungrouped first (so they appear above
  // any modules), then modules in their sortOrder.
  const ungrouped = lessons.filter((l) => l.moduleId === null);
  const moduleGroups = modules
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => ({ module: m, items: lessons.filter((l) => l.moduleId === m.id) }))
    .filter((g) => g.items.length > 0);

  // The currentLessonIdx is a position in the FLAT lessons array, so we render
  // using each lesson's actual array index.
  const indexOf = (lessonId: string) => lessons.findIndex((l) => l.id === lessonId);

  return (
    <div className="space-y-3">
      {ungrouped.length > 0 && (
        <div className="space-y-1">
          {moduleGroups.length > 0 && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">Intro</p>
          )}
          {ungrouped.map((l) => (
            <LessonRow
              key={l.id}
              lesson={l}
              isCurrent={indexOf(l.id) === currentLessonIdx}
              onSelect={() => onSelect(indexOf(l.id))}
            />
          ))}
        </div>
      )}

      {moduleGroups.map((g) => {
        const done = g.items.filter((l) => l.completed).length;
        return (
          <div key={g.module.id} className="space-y-1">
            <div className="px-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{g.module.title}</p>
              <span className="text-[10px] tabular-nums text-muted-foreground">{done}/{g.items.length}</span>
            </div>
            {g.items.map((l) => (
              <LessonRow
                key={l.id}
                lesson={l}
                isCurrent={indexOf(l.id) === currentLessonIdx}
                onSelect={() => onSelect(indexOf(l.id))}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function LessonRow({ lesson, isCurrent, onSelect }: { lesson: Lesson; isCurrent: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-md px-3 py-2 flex items-start gap-2 transition-colors ${
        isCurrent ? "bg-muted" : "hover:bg-muted/50"
      }`}
      data-testid={`button-lesson-${lesson.id}`}
    >
      {lesson.completed ? (
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{lesson.title}</p>
        {lesson.durationSeconds ? (
          <p className="text-xs text-muted-foreground">{fmtDuration(lesson.durationSeconds)}</p>
        ) : null}
      </div>
      {isCurrent && <Badge variant="secondary" className="text-[10px]">Now</Badge>}
    </button>
  );
}
