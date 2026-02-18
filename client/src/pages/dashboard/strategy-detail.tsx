import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useActiveStore } from "@/lib/store-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MarketingStrategy, StoreStrategyProgress } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Target,
  BookOpen,
  ListChecks,
  Lightbulb,
} from "lucide-react";
import { useMemo, useEffect, useRef } from "react";

function parseMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-xl font-bold mt-8 mb-3 text-foreground flex items-center gap-2" data-testid={`heading-${key}`}>
          <BookOpen className="h-5 w-5 text-primary shrink-0" />
          {renderInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-base font-semibold mt-6 mb-2 text-foreground" data-testid={`subheading-${key}`}>
          {renderInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <div key={key++} className="my-4 border-l-3 border-primary/40 bg-primary/5 rounded-r-md px-4 py-3">
          <div className="flex gap-2 items-start">
            <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-foreground/90 space-y-1">
              {quoteLines.map((ql, qi) => (
                <p key={qi}>{renderInline(ql)}</p>
              ))}
            </div>
          </div>
        </div>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} className="my-3 space-y-2 pl-1">
          {listItems.map((item, li) => (
            <li key={li} className="flex gap-3 text-sm text-foreground/80">
              <span className="text-xs font-mono text-primary/60 mt-0.5 shrink-0 w-5 text-right">{li + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} className="my-3 space-y-1.5 pl-1">
          {listItems.map((item, li) => (
            <li key={li} className="flex gap-2.5 text-sm text-foreground/80">
              <span className="text-primary/50 mt-1.5 shrink-0">
                <span className="block w-1.5 h-1.5 rounded-full bg-primary/40" />
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter((tl) => !tl.match(/^\|[\s-:|]+\|$/))
        .map((tl) =>
          tl
            .split("|")
            .filter((c) => c.trim() !== "")
            .map((c) => c.trim())
        );
      if (rows.length > 0) {
        const header = rows[0];
        const body = rows.slice(1);
        elements.push(
          <div key={key++} className="my-4 overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {header.map((h, hi) => (
                    <th key={hi} className="px-3 py-2 text-left font-medium text-foreground/70">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className="border-t">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-foreground/80">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    elements.push(
      <p key={key++} className="text-sm text-foreground/80 leading-relaxed my-2">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return elements;
}

function renderInline(text: string) {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let idx = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(
        <strong key={`b-${idx++}`} className="font-semibold text-foreground">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return <>{parts}</>;
}

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: "Easy", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  medium: { label: "Medium", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  hard: { label: "Advanced", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
};

const IMPACT_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "Low Impact", color: "text-muted-foreground" },
  medium: { label: "Medium Impact", color: "text-amber-600 dark:text-amber-400" },
  high: { label: "High Impact", color: "text-emerald-600 dark:text-emerald-400" },
};

const STATUS_CONFIG = {
  not_started: { label: "Not Started", icon: Circle, variant: "outline" as const, className: "text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Clock, variant: "outline" as const, className: "text-amber-600 dark:text-amber-400 border-amber-500/30" },
  completed: { label: "Completed", icon: CheckCircle2, variant: "outline" as const, className: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
};

export default function StrategyDetailPage() {
  const [, params] = useRoute("/dashboard/marketing/:strategyId");
  const strategyId = params?.strategyId;
  const { activeStoreId } = useActiveStore();

  const { data: strategies = [], isLoading: loadingStrategies } = useQuery<MarketingStrategy[]>({
    queryKey: ["/api/marketing/strategies"],
  });

  const { data: progress = [] } = useQuery<StoreStrategyProgress[]>({
    queryKey: ["/api/marketing/progress", activeStoreId],
    queryFn: async () => {
      if (!activeStoreId) return [];
      const res = await fetch(`/api/marketing/progress/${activeStoreId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!activeStoreId,
  });

  const progressMutation = useMutation({
    mutationFn: async ({ sid, status }: { sid: string; status: string }) => {
      await apiRequest("PATCH", `/api/marketing/progress/${activeStoreId}/${sid}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/progress", activeStoreId] });
    },
  });

  const strategy = strategies.find((s) => s.id === strategyId);
  const progressMap = new Map(progress.map((p) => [p.strategyId, p.status as "not_started" | "in_progress" | "completed"]));
  const currentStatus = strategyId ? progressMap.get(strategyId) || "not_started" : "not_started";
  const nextStatus = currentStatus === "not_started" ? "in_progress" : currentStatus === "in_progress" ? "completed" : "not_started";

  const sameCategory = useMemo(() => {
    if (!strategy) return [];
    return strategies.filter((s) => s.category === strategy.category && s.id !== strategy.id);
  }, [strategy, strategies]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollParent = containerRef.current?.closest("main");
    if (scrollParent) {
      scrollParent.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [strategyId]);

  const renderedContent = useMemo(() => {
    if (!strategy?.content) return null;
    return parseMarkdown(strategy.content);
  }, [strategy?.content]);

  const completedSteps = strategy?.steps.length || 0;

  if (loadingStrategies) {
    return (
      <div className="p-6 max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="p-6 max-w-4xl">
        <Link href="/dashboard/marketing">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4" data-testid="button-back-to-playbook">
            <ArrowLeft className="h-4 w-4" />
            Back to Playbook
          </Button>
        </Link>
        <p className="text-muted-foreground">Strategy not found.</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[currentStatus];
  const StatusIcon = statusConfig.icon;
  const diff = DIFFICULTY_LABELS[strategy.difficulty];
  const imp = IMPACT_LABELS[strategy.impact];

  return (
    <div ref={containerRef} className="p-6 max-w-4xl mx-auto" data-testid="strategy-detail-page">
      <Link href="/dashboard/marketing">
        <Button variant="ghost" size="sm" className="gap-1.5 mb-6 text-muted-foreground" data-testid="button-back-to-playbook">
          <ArrowLeft className="h-4 w-4" />
          Back to Playbook
        </Button>
      </Link>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {strategy.category}
            </Badge>
            <Badge className={`text-xs border ${diff.color}`}>
              <Zap className="h-3 w-3 mr-1" />
              {diff.label}
            </Badge>
            <span className={`text-xs flex items-center gap-1 ${imp.color}`}>
              <Target className="h-3 w-3" />
              {imp.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-strategy-detail-title">
            {strategy.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
            {strategy.description}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant={currentStatus === "completed" ? "default" : "outline"}
            size="sm"
            className={`gap-1.5 ${statusConfig.className}`}
            onClick={() => progressMutation.mutate({ sid: strategy.id, status: nextStatus })}
            data-testid="button-strategy-status"
          >
            <StatusIcon className="h-4 w-4" />
            {statusConfig.label}
          </Button>
          {currentStatus !== "completed" && (
            <span className="text-xs text-muted-foreground">
              Click to mark as {nextStatus === "in_progress" ? "In Progress" : nextStatus === "completed" ? "Completed" : "Not Started"}
            </span>
          )}
        </div>

        <Card data-testid="card-quick-steps">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Quick Action Steps</h2>
              <Badge variant="secondary" className="ml-auto text-xs">
                {completedSteps} steps
              </Badge>
            </div>
            <ol className="space-y-2.5">
              {strategy.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-foreground/80">
                  <span className="flex items-center justify-center w-5 h-5 shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {strategy.content && (
          <Card data-testid="card-full-guide">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">Full Strategy Guide</h2>
              </div>
              <div className="strategy-content">
                {renderedContent}
              </div>
            </CardContent>
          </Card>
        )}

        {sameCategory.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              More in {strategy.category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {sameCategory.map((s) => {
                const st = progressMap.get(s.id) || "not_started";
                const StIcon = STATUS_CONFIG[st].icon;
                return (
                  <Link key={s.id} href={`/dashboard/marketing/${s.id}`}>
                    <Card className="hover-elevate cursor-pointer" data-testid={`card-related-${s.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <StIcon className={`h-4 w-4 mt-0.5 shrink-0 ${STATUS_CONFIG[st].className}`} />
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm truncate">{s.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {s.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 py-4 border-t flex-wrap">
          <Progress
            value={currentStatus === "completed" ? 100 : currentStatus === "in_progress" ? 50 : 0}
            className="h-1.5 flex-1 max-w-xs"
          />
          <span className="text-xs text-muted-foreground">
            {currentStatus === "completed" ? "Strategy completed" : currentStatus === "in_progress" ? "In progress" : "Not started yet"}
          </span>
        </div>
      </div>
    </div>
  );
}