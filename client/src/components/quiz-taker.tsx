import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, RotateCcw, Circle } from "lucide-react";

type Choice = { id: string; label: string; sortOrder: number };
type Question = { id: string; prompt: string; sortOrder: number; choices: Choice[] };

type QuizPayload = {
  questions: Question[];
  passThreshold: number;
  previouslyPassed: boolean;
  previousBestScore: { correctCount: number; totalCount: number } | null;
};

type SubmitResult = {
  correctCount: number;
  totalCount: number;
  passed: boolean;
  passThreshold: number;
  review: { questionId: string; yourChoiceId: string | null; correctChoiceId: string | null }[];
};

export function QuizTaker({
  token, productId, lessonId, onPassed,
}: {
  token: string;
  productId: string;
  lessonId: string;
  onPassed: () => void;  // refetch the course to update completion state
}) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);

  const { data, isLoading } = useQuery<QuizPayload>({
    queryKey: ["/api/courses/access", token, productId, "lessons", lessonId, "quiz"],
    queryFn: async () => (await apiRequest("GET", `/api/courses/access/${token}/${productId}/lessons/${lessonId}/quiz`)).json(),
    enabled: showQuiz,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const payload = {
        answers: Object.entries(answers).map(([questionId, choiceId]) => ({ questionId, choiceId })),
      };
      const res = await apiRequest("POST", `/api/courses/access/${token}/${productId}/lessons/${lessonId}/quiz/submit`, payload);
      return (await res.json()) as SubmitResult;
    },
    onSuccess: (r) => {
      setResult(r);
      if (r.passed) {
        // The course endpoint reflects completion now; refetch upstream.
        queryClient.invalidateQueries({ queryKey: ["/api/courses/access", token, productId] });
        onPassed();
      }
    },
  });

  const retake = () => {
    setAnswers({});
    setResult(null);
  };

  if (!showQuiz) {
    return (
      <Card data-testid="quiz-cta">
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-semibold text-sm">Quiz required</p>
            <p className="text-xs text-muted-foreground">
              Pass the quiz (≥70%) to mark this lesson complete.
            </p>
          </div>
          <Button onClick={() => setShowQuiz(true)} data-testid="button-take-quiz">
            Take quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  if (!data || data.questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          No quiz questions are configured for this lesson yet.
        </CardContent>
      </Card>
    );
  }

  // Result screen
  if (result) {
    const pct = Math.round((result.correctCount / Math.max(1, result.totalCount)) * 100);
    return (
      <Card data-testid="quiz-result">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            {result.passed ? (
              <CheckCircle2 className="h-8 w-8 text-primary shrink-0" />
            ) : (
              <XCircle className="h-8 w-8 text-destructive shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {result.passed ? "You passed!" : "Not quite — try again"}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-quiz-score">
                {result.correctCount} / {result.totalCount} correct ({pct}%) ·
                {" "}passing is {Math.round(result.passThreshold * 100)}%
              </p>
            </div>
          </div>

          {/* Review */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Review</p>
            {data.questions.map((q, idx) => {
              const r = result.review.find((x) => x.questionId === q.id);
              return (
                <div key={q.id} className="space-y-1 text-sm">
                  <p className="font-medium">Q{idx + 1}. {q.prompt}</p>
                  <div className="pl-4 space-y-0.5">
                    {q.choices.map((c) => {
                      const isCorrect = r?.correctChoiceId === c.id;
                      const isYours = r?.yourChoiceId === c.id;
                      let cls = "text-muted-foreground";
                      let icon = <Circle className="h-3 w-3 inline" />;
                      if (isCorrect) {
                        cls = "text-primary font-medium";
                        icon = <CheckCircle2 className="h-3 w-3 inline" />;
                      } else if (isYours) {
                        cls = "text-destructive line-through";
                        icon = <XCircle className="h-3 w-3 inline" />;
                      }
                      return (
                        <p key={c.id} className={`text-xs ${cls} flex items-center gap-1.5`}>
                          {icon}
                          {c.label}
                          {isYours && !isCorrect && <span className="text-[10px]">(your answer)</span>}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!result.passed && (
            <Button onClick={retake} data-testid="button-retake-quiz">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Quiz form
  const canSubmit = data.questions.every((q) => !!answers[q.id]);

  return (
    <Card data-testid="quiz-form">
      <CardContent className="p-4 space-y-5">
        {data.previouslyPassed && data.previousBestScore && (
          <div className="rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
            You already passed this quiz ({data.previousBestScore.correctCount}/{data.previousBestScore.totalCount}). Retaking
            won't change your completion — just for practice.
          </div>
        )}

        {data.questions.map((q, idx) => (
          <div key={q.id} className="space-y-2">
            <p className="font-medium text-sm">
              <span className="text-muted-foreground tabular-nums mr-2">Q{idx + 1}.</span>
              {q.prompt}
            </p>
            <div className="pl-2 space-y-2">
              {q.choices.map((c) => {
                const selected = answers[q.id] === c.id;
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                      selected ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                    }`}
                    data-testid={`label-choice-${c.id}`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={selected}
                      onChange={() => setAnswers({ ...answers, [q.id]: c.id })}
                      className="accent-primary"
                    />
                    {c.label}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-2 border-t">
          <Button onClick={() => submit.mutate()} disabled={!canSubmit || submit.isPending} data-testid="button-submit-quiz">
            {submit.isPending ? "Submitting..." : "Submit quiz"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
