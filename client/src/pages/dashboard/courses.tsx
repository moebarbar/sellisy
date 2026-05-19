import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LessonsEditor } from "@/components/dashboard/lessons-editor";
import { ImageUploadField } from "@/components/image-upload-field";
import { ProductPlaceholder } from "@/components/product-placeholder";
import {
  Plus,
  Loader2,
  GraduationCap,
  BookOpen,
  Layers,
  Award,
  Clock,
  HelpCircle,
  Pencil,
} from "lucide-react";

interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  priceCents: number;
  status: "DRAFT" | "ACTIVE";
  lessonCount: number;
  moduleCount: number;
  quizLessonCount: number;
  hasDrip: boolean;
  certificatesEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CoursesPage() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery<CourseSummary[]>({
    queryKey: ["/api/courses/my-courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/products", {
        title,
        category: "templates",
        priceCents: 0,
        productType: "course",
        status: "DRAFT",
        images: [],
      });
      return res.json();
    },
    onSuccess: (product: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/mine"] });
      setCreateOpen(false);
      setEditId(product.id);
      toast({ title: "Course created", description: "Add your first lesson to get started." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create course", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-courses-title">
            <GraduationCap className="h-6 w-6" />
            Courses
          </h1>
          <p className="text-muted-foreground mt-1">
            Build and manage your video courses. Add lessons, modules, drip schedules, quizzes, and certificates — all in one place.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="button-create-course">
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="aspect-video w-full rounded-t-md" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} onEdit={() => setEditId(course.id)} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No courses yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Create your first course to start selling structured learning experiences with video
              lessons, quizzes, and completion certificates.
            </p>
            <Button onClick={() => setCreateOpen(true)} data-testid="button-create-course-empty">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Course
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateCourseDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(title) => createMutation.mutate(title)}
        isPending={createMutation.isPending}
      />

      <CourseEditorDialog
        courseId={editId}
        onClose={() => setEditId(null)}
      />
    </div>
  );
}

function CourseCard({ course, onEdit }: { course: CourseSummary; onEdit: () => void }) {
  return (
    <Card data-testid={`card-course-${course.id}`}>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-muted overflow-hidden rounded-t-md">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ProductPlaceholder productType="course" title={course.title} />
          )}
          <div className="absolute top-2 right-2">
            <Badge variant={course.status === "ACTIVE" ? "default" : "secondary"} data-testid={`badge-status-${course.id}`}>
              {course.status}
            </Badge>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight" data-testid={`text-course-title-${course.id}`}>
              {course.title}
            </h3>
            <Badge variant="secondary" className="shrink-0">
              ${(course.priceCents / 100).toFixed(2)}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1" data-testid={`stat-lessons-${course.id}`}>
              <BookOpen className="h-3.5 w-3.5" />
              {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
            </span>
            {course.moduleCount > 0 && (
              <span className="inline-flex items-center gap-1" data-testid={`stat-modules-${course.id}`}>
                <Layers className="h-3.5 w-3.5" />
                {course.moduleCount} {course.moduleCount === 1 ? "module" : "modules"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {course.hasDrip && (
              <Badge variant="outline" className="text-xs gap-1" data-testid={`badge-drip-${course.id}`}>
                <Clock className="h-3 w-3" />
                Drip
              </Badge>
            )}
            {course.quizLessonCount > 0 && (
              <Badge variant="outline" className="text-xs gap-1" data-testid={`badge-quizzes-${course.id}`}>
                <HelpCircle className="h-3 w-3" />
                {course.quizLessonCount} {course.quizLessonCount === 1 ? "quiz" : "quizzes"}
              </Badge>
            )}
            {course.certificatesEnabled && (
              <Badge variant="outline" className="text-xs gap-1" data-testid={`badge-cert-${course.id}`}>
                <Award className="h-3 w-3" />
                Certificate
              </Badge>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onEdit}
              data-testid={`button-manage-course-${course.id}`}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Manage
            </Button>
            <Link href={`/p/${course.slug}`}>
              <Button variant="ghost" size="sm" data-testid={`button-view-course-${course.id}`}>
                View
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateCourseDialog({
  open,
  onClose,
  onCreate,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!open) setTitle("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new course</DialogTitle>
          <DialogDescription>
            Give your course a title. You'll be able to add lessons, modules, pricing, and more after creation.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) onCreate(title.trim());
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="course-title">Course title</Label>
            <Input
              id="course-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Complete Guide to ..."
              autoFocus
              required
              data-testid="input-new-course-title"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!title.trim() || isPending}
            data-testid="button-confirm-create-course"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create course
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CourseEditorDialog({
  courseId,
  onClose,
}: {
  courseId: string | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const open = !!courseId;

  const { data: product, isLoading } = useQuery<any>({
    queryKey: ["/api/products", courseId],
    enabled: open,
    queryFn: async () => (await apiRequest("GET", `/api/products/${courseId}`)).json(),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagline, setTagline] = useState("");
  const [price, setPrice] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE">("DRAFT");
  const [certificatesEnabled, setCertificatesEnabled] = useState(false);
  const [certAccentColor, setCertAccentColor] = useState("#1e40af");
  const [certLogoUrl, setCertLogoUrl] = useState("");
  const [reviewsEnabled, setReviewsEnabled] = useState(true);

  useEffect(() => {
    if (product) {
      setTitle(product.title || "");
      setDescription(product.description || "");
      setTagline(product.tagline || "");
      setPrice(product.priceCents != null ? (product.priceCents / 100).toFixed(2) : "");
      setThumbnailUrl(product.thumbnailUrl || "");
      setStatus(product.status || "DRAFT");
      setCertificatesEnabled(!!product.certificatesEnabled);
      setCertAccentColor(product.certAccentColor || "#1e40af");
      setCertLogoUrl(product.certLogoUrl || "");
      setReviewsEnabled(product.reviewsEnabled !== false);
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const priceCents = price ? Math.round(parseFloat(price) * 100) : 0;
      await apiRequest("PATCH", `/api/products/${courseId}`, {
        title,
        description: description || null,
        tagline: tagline || null,
        priceCents,
        thumbnailUrl: thumbnailUrl || null,
        status,
        certificatesEnabled,
        certAccentColor: certificatesEnabled ? certAccentColor : null,
        certLogoUrl: certificatesEnabled ? (certLogoUrl || null) : null,
        reviewsEnabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", courseId] });
      toast({ title: "Course settings saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-course-editor-title">
            {product?.title ? `Manage: ${product.title}` : "Manage course"}
          </DialogTitle>
          <DialogDescription>
            Edit course details, lessons, modules, drip schedule, quizzes, and certificates.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !product ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Course details</h3>

              <div className="space-y-2">
                <Label htmlFor="course-edit-title">Title</Label>
                <Input
                  id="course-edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-course-edit-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-edit-tagline">Tagline</Label>
                <Input
                  id="course-edit-tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="A short pitch for the course"
                  data-testid="input-course-edit-tagline"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-edit-description">Description</Label>
                <Textarea
                  id="course-edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  data-testid="input-course-edit-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-edit-price">Price ($)</Label>
                  <Input
                    id="course-edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    data-testid="input-course-edit-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-edit-status">Status</Label>
                  <select
                    id="course-edit-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "DRAFT" | "ACTIVE")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    data-testid="select-course-edit-status"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Course thumbnail</Label>
                <ImageUploadField
                  value={thumbnailUrl}
                  onChange={(v) => setThumbnailUrl(v ?? "")}
                  helpText="A landscape image (16:9) works best for course cards."
                  previewClass="aspect-video w-full max-w-md"
                  testIdPrefix="course-thumbnail"
                />
              </div>

              <div className="rounded-md border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="course-cert-toggle" className="text-sm">
                      Issue a certificate of completion
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Buyers who complete 100% of lessons get a downloadable PDF certificate.
                    </p>
                  </div>
                  <Switch
                    id="course-cert-toggle"
                    checked={certificatesEnabled}
                    onCheckedChange={setCertificatesEnabled}
                    data-testid="switch-course-cert"
                  />
                </div>

                {certificatesEnabled && (
                  <div className="rounded-md bg-muted/40 p-3 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Certificate design
                    </p>
                    <div className="grid sm:grid-cols-[160px_1fr] gap-3 items-start">
                      <div className="space-y-1">
                        <Label htmlFor="cert-accent-color" className="text-xs">Accent color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="cert-accent-color"
                            type="color"
                            value={certAccentColor}
                            onChange={(e) => setCertAccentColor(e.target.value)}
                            className="h-9 w-12 rounded-md border cursor-pointer"
                            data-testid="input-cert-accent-color"
                          />
                          <Input
                            value={certAccentColor}
                            onChange={(e) => setCertAccentColor(e.target.value)}
                            placeholder="#1e40af"
                            className="font-mono text-xs"
                            data-testid="input-cert-accent-hex"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Used for the headline + inner border.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Logo</Label>
                        <ImageUploadField
                          value={certLogoUrl}
                          onChange={(v) => setCertLogoUrl(v ?? "")}
                          accept="image/png,image/jpeg"
                          helpText="PNG or JPEG, ideally with a transparent background. Shown top-center on the cert."
                          previewClass="h-20 w-40"
                          testIdPrefix="cert-logo"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 pt-3 border-t">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="course-reviews-toggle" className="text-sm">
                      Allow reviews
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Buyers can leave a 1–5 star review with a title and comment.
                    </p>
                  </div>
                  <Switch
                    id="course-reviews-toggle"
                    checked={reviewsEnabled}
                    onCheckedChange={setReviewsEnabled}
                    data-testid="switch-course-reviews"
                  />
                </div>
              </div>

              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !title.trim()}
                data-testid="button-save-course-details"
              >
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save course details
              </Button>
            </section>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold mb-3">Lessons & modules</h3>
              <LessonsEditor productId={courseId || undefined} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
