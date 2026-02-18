import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useActiveStore } from "@/lib/store-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MarketingStrategy, StoreStrategyProgress } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Rocket,
  Mail,
  Share2,
  Search,
  FileText,
  DollarSign,
  BarChart3,
  Megaphone,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Filter,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_ICONS: Record<string, typeof Rocket> = {
  Launch: Rocket,
  "Email Marketing": Mail,
  "Social Media": Share2,
  SEO: Search,
  "Content Marketing": FileText,
  "Sales Strategy": DollarSign,
  "Paid Ads": Megaphone,
  Analytics: BarChart3,
};

const CATEGORY_ORDER = [
  "Launch",
  "Email Marketing",
  "Social Media",
  "SEO",
  "Content Marketing",
  "Sales Strategy",
  "Paid Ads",
  "Analytics",
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const IMPACT_COLORS: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-emerald-600 dark:text-emerald-400",
};

const STATUS_LABELS = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

function StatusButton({ status, onChange }: { status: "not_started" | "in_progress" | "completed"; onChange: (s: "not_started" | "in_progress" | "completed") => void }) {
  const next = status === "not_started" ? "in_progress" : status === "in_progress" ? "completed" : "not_started";

  if (status === "completed") {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="gap-1.5 text-emerald-600 dark:text-emerald-400"
        onClick={() => onChange(next)}
        data-testid="button-status-toggle"
      >
        <CheckCircle2 className="h-4 w-4" />
        {STATUS_LABELS[status]}
      </Button>
    );
  }

  if (status === "in_progress") {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="gap-1.5 text-amber-600 dark:text-amber-400"
        onClick={() => onChange(next)}
        data-testid="button-status-toggle"
      >
        <Clock className="h-4 w-4" />
        {STATUS_LABELS[status]}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="gap-1.5 text-muted-foreground"
      onClick={() => onChange(next)}
      data-testid="button-status-toggle"
    >
      <Circle className="h-4 w-4" />
      {STATUS_LABELS[status]}
    </Button>
  );
}

function StrategyCard({
  strategy,
  status,
  onStatusChange,
}: {
  strategy: MarketingStrategy;
  status: "not_started" | "in_progress" | "completed";
  onStatusChange: (s: "not_started" | "in_progress" | "completed") => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={`transition-colors ${status === "completed" ? "opacity-75" : ""}`}
      data-testid={`card-strategy-${strategy.id}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight" data-testid={`text-strategy-title-${strategy.id}`}>
              {strategy.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {strategy.description}
            </p>
          </div>
          <StatusButton status={status} onChange={onStatusChange} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-[10px] border-0 ${DIFFICULTY_COLORS[strategy.difficulty]}`}>
            <Zap className="h-2.5 w-2.5 mr-0.5" />
            {strategy.difficulty}
          </Badge>
          <span className={`text-[10px] flex items-center gap-0.5 ${IMPACT_COLORS[strategy.impact]}`}>
            <Target className="h-2.5 w-2.5" />
            {strategy.impact} impact
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-between text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-${strategy.id}`}
          >
            {expanded ? "Hide steps" : `${strategy.steps.length} actionable steps`}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
          {strategy.content && (
            <Link href={`/dashboard/marketing/${strategy.id}`}>
              <Button variant="outline" size="sm" className="gap-1 text-xs" data-testid={`button-view-guide-${strategy.id}`}>
                Full Guide
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>

        {expanded && (
          <ol className="space-y-2 pl-1">
            {strategy.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-[10px] font-mono text-foreground/40 mt-0.5 shrink-0 w-4 text-right">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default function MarketingPlaybookPage() {
  const { activeStoreId } = useActiveStore();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: strategies = [], isLoading: loadingStrategies } = useQuery<MarketingStrategy[]>({
    queryKey: ["/api/marketing/strategies"],
  });

  const { data: progress = [], isLoading: loadingProgress } = useQuery<StoreStrategyProgress[]>({
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
    mutationFn: async ({ strategyId, status }: { strategyId: string; status: string }) => {
      await apiRequest("PATCH", `/api/marketing/progress/${activeStoreId}/${strategyId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/progress", activeStoreId] });
    },
  });

  const progressMap = new Map(progress.map((p) => [p.strategyId, p.status as "not_started" | "in_progress" | "completed"]));

  const getStatus = (strategyId: string) => progressMap.get(strategyId) || "not_started";

  const categories = CATEGORY_ORDER.filter((c) => strategies.some((s) => s.category === c));

  const filteredStrategies = strategies.filter((s) => {
    if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
    if (statusFilter !== "all" && getStatus(s.id) !== statusFilter) return false;
    return true;
  });

  const groupedStrategies = categories
    .map((cat) => ({
      category: cat,
      items: filteredStrategies.filter((s) => s.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const totalCount = strategies.length;
  const completedCount = strategies.filter((s) => getStatus(s.id) === "completed").length;
  const inProgressCount = strategies.filter((s) => getStatus(s.id) === "in_progress").length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isLoading = loadingStrategies || loadingProgress;

  if (!activeStoreId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Select a store to view marketing strategies.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Marketing Playbook</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Proven strategies and SOPs to market your digital products effectively. Track your progress as you implement each one.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          <Card data-testid="card-progress-summary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                <div>
                  <p className="text-sm font-medium">Overall Progress</p>
                  <p className="text-xs text-muted-foreground">
                    {completedCount} of {totalCount} strategies completed
                    {inProgressCount > 0 && ` \u00b7 ${inProgressCount} in progress`}
                  </p>
                </div>
                <span className="text-2xl font-bold tabular-nums" data-testid="text-progress-percent">
                  {progressPercent}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" data-testid="progress-bar" />
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {groupedStrategies.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground text-sm">No strategies match your filters.</p>
              </CardContent>
            </Card>
          ) : (
            groupedStrategies.map((group) => {
              const Icon = CATEGORY_ICONS[group.category] || Rocket;
              const catCompleted = group.items.filter((s) => getStatus(s.id) === "completed").length;
              return (
                <div key={group.category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h2 className="font-semibold text-sm" data-testid={`text-category-${group.category.toLowerCase().replace(/\s+/g, "-")}`}>
                      {group.category}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {catCompleted}/{group.items.length}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.items.map((strategy) => (
                      <StrategyCard
                        key={strategy.id}
                        strategy={strategy}
                        status={getStatus(strategy.id)}
                        onStatusChange={(newStatus) =>
                          progressMutation.mutate({ strategyId: strategy.id, status: newStatus })
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
