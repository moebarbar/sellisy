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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle2, HelpCircle, Pencil } from "lucide-react";

type Choice = {
  id?: string;
  label: string;
  isCorrect: boolean;
  sortOrder?: number;
};

type QuestionType = "single" | "multi";

type Question = {
  id: string;
  lessonId: string;
  prompt: string;
  questionType: QuestionType;
  sortOrder: number;
  choices: Choice[];
};

export function QuizEditor({ lessonId, lessonTitle, onChanged }: { lessonId: string; lessonTitle: string; onChanged?: () => void }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/courses/lessons", lessonId, "questions"],
    queryFn: async () => (await apiRequest("GET", `/api/courses/lessons/${lessonId}/questions`)).json(),
    enabled: open,
  });

  const { toast } = useToast();
  const [editing, setEditing] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);

  const deleteQ = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/courses/questions/${id}`); },
    onSuccess: () => {
      toast({ title: "Question removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/lessons", lessonId, "questions"] });
      onChanged?.();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-manage-quiz-${lessonId}`}>
          <HelpCircle className="h-3 w-3 mr-1" /> Quiz
          {(data?.length ?? 0) > 0 && <span className="ml-1.5 text-xs">({data!.length})</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quiz for "{lessonTitle}"</DialogTitle>
          <DialogDescription>
            Add questions to gate the lesson. Buyers must score ≥70% to mark the lesson complete.
            Each question can be single-answer (one correct) or multi-answer (one or more correct,
            buyer must pick the exact set).
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-40" />
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {(data || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No questions yet. Add the first one to turn this lesson into a quiz.
              </p>
            ) : (
              (data || []).map((q, idx) => (
                <Card key={q.id} data-testid={`card-question-${q.id}`}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="text-xs text-muted-foreground tabular-nums w-6 mt-1">Q{idx + 1}.</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{q.prompt}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                          {q.questionType === "multi" ? "Multi-answer" : "Single answer"}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setEditing(q)} data-testid={`button-edit-question-${q.id}`}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteQ.mutate(q.id)} disabled={deleteQ.isPending}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="pl-9 space-y-1">
                      {q.choices.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 text-xs">
                          {c.isCorrect ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <span className="h-3 w-3 inline-block" />}
                          <span className={c.isCorrect ? "text-foreground font-medium" : "text-muted-foreground"}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={() => setCreating(true)} data-testid="button-add-question">
            <Plus className="h-4 w-4 mr-1" /> Add question
          </Button>
        </DialogFooter>

        <Dialog open={creating} onOpenChange={setCreating}>
          <QuestionFormDialog
            lessonId={lessonId}
            mode="create"
            onSaved={() => { setCreating(false); onChanged?.(); }}
          />
        </Dialog>
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          {editing && (
            <QuestionFormDialog
              lessonId={lessonId}
              mode="edit"
              question={editing}
              onSaved={() => { setEditing(null); onChanged?.(); }}
            />
          )}
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

function QuestionFormDialog({
  lessonId, question, mode, onSaved,
}: {
  lessonId: string;
  question?: Question;
  mode: "create" | "edit";
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [questionType, setQuestionType] = useState<QuestionType>(question?.questionType ?? "single");
  const initialChoices: Choice[] = question?.choices.length
    ? question.choices.map((c) => ({ label: c.label, isCorrect: c.isCorrect }))
    : [
        { label: "", isCorrect: true },
        { label: "", isCorrect: false },
      ];
  const [choices, setChoices] = useState<Choice[]>(initialChoices);

  const save = useMutation({
    mutationFn: async () => {
      const cleanChoices = choices
        .map((c) => ({ label: c.label.trim(), isCorrect: c.isCorrect }))
        .filter((c) => c.label.length > 0);
      const body = { prompt: prompt.trim(), questionType, choices: cleanChoices };
      if (mode === "create") {
        await apiRequest("POST", `/api/courses/lessons/${lessonId}/questions`, body);
      } else if (question) {
        await apiRequest("PATCH", `/api/courses/questions/${question.id}`, body);
      }
    },
    onSuccess: () => {
      toast({ title: mode === "create" ? "Question added" : "Question updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/lessons", lessonId, "questions"] });
      onSaved();
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  // For "single" type: clicking a choice makes it the only correct one.
  // For "multi": clicking toggles that one choice on/off.
  const toggleCorrect = (idx: number) => {
    if (questionType === "single") {
      setChoices(choices.map((c, i) => ({ ...c, isCorrect: i === idx })));
    } else {
      setChoices(choices.map((c, i) => i === idx ? { ...c, isCorrect: !c.isCorrect } : c));
    }
  };

  // Switching the type can leave choices in an invalid shape (e.g. multi → single
  // with two corrects). Repair on the fly so the user can keep working.
  const onTypeChange = (next: QuestionType) => {
    setQuestionType(next);
    if (next === "single") {
      // Keep first correct, drop the rest. If none, mark first as correct.
      let foundCorrect = false;
      const fixed = choices.map((c) => {
        if (!foundCorrect && c.isCorrect) {
          foundCorrect = true;
          return { ...c, isCorrect: true };
        }
        return { ...c, isCorrect: false };
      });
      if (!foundCorrect && fixed.length > 0) fixed[0].isCorrect = true;
      setChoices(fixed);
    }
  };

  const addChoice = () => {
    if (choices.length >= 8) return;
    setChoices([...choices, { label: "", isCorrect: false }]);
  };

  const removeChoice = (idx: number) => {
    if (choices.length <= 2) return;
    const next = choices.filter((_, i) => i !== idx);
    if (questionType === "single" && !next.some((c) => c.isCorrect)) {
      next[0].isCorrect = true;
    }
    setChoices(next);
  };

  const validChoices = choices.filter((c) => c.label.trim().length > 0);
  const correctCount = validChoices.filter((c) => c.isCorrect).length;
  const shapeValid =
    questionType === "single"
      ? correctCount === 1
      : correctCount >= 1 && correctCount < validChoices.length;
  const canSave = prompt.trim().length > 0 && validChoices.length >= 2 && shapeValid;

  const shapeHint =
    questionType === "single"
      ? "Mark exactly one choice as correct."
      : "Mark one or more choices as correct (but not all). Buyer must select the exact set.";

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Add question" : "Edit question"}</DialogTitle>
        <DialogDescription>Empty choices are dropped on save.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Question type</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={questionType === "single" ? "default" : "outline"}
              onClick={() => onTypeChange("single")}
              data-testid="button-type-single"
            >
              Single answer
            </Button>
            <Button
              type="button"
              size="sm"
              variant={questionType === "multi" ? "default" : "outline"}
              onClick={() => onTypeChange("multi")}
              data-testid="button-type-multi"
            >
              Multi-answer
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{shapeHint}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quiz-prompt">Question</Label>
          <Textarea
            id="quiz-prompt"
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. What's the first step of the workflow?"
            data-testid="input-quiz-prompt"
          />
        </div>
        <div className="space-y-2">
          <Label>Choices (2–8)</Label>
          <div className="space-y-2">
            {choices.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Checkbox
                  checked={c.isCorrect}
                  onCheckedChange={() => toggleCorrect(idx)}
                  data-testid={`checkbox-choice-correct-${idx}`}
                />
                <Input
                  value={c.label}
                  onChange={(e) => setChoices(choices.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                  placeholder={`Choice ${idx + 1}`}
                  data-testid={`input-choice-label-${idx}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeChoice(idx)}
                  disabled={choices.length <= 2}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {choices.length < 8 && (
              <Button variant="ghost" size="sm" onClick={addChoice}>
                <Plus className="h-3 w-3 mr-1" /> Add choice
              </Button>
            )}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onSaved}>Cancel</Button>
        <Button onClick={() => save.mutate()} disabled={!canSave || save.isPending} data-testid="button-save-question">
          {save.isPending ? "Saving..." : "Save question"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
