// AI Store Launcher wizard — the "describe your business, get a live store"
// flow. Three states: input (with example chips), progress (polls the
// launch row, animates through the pipeline stages), and done/failed.
//
// Resilient by design: if a launch is already running (409 from POST, or
// the user refreshed mid-run), the wizard resumes polling that run instead
// of erroring.

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { fireConfetti } from "@/lib/confetti";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Check, Store, ExternalLink, AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

type LaunchStatus = "pending" | "analyzing" | "selecting" | "assembling" | "completed" | "failed";

type Launch = {
  id: string;
  status: LaunchStatus;
  storeId: string | null;
  storeSlug: string | null;
  productCount: number | null;
  error: string | null;
};

const EXAMPLES = [
  "Notion templates for freelance designers",
  "Fitness ebooks and meal-plan guides",
  "Lightroom presets for travel photographers",
  "Social media templates for small bakeries",
];

const STAGES: { key: LaunchStatus; label: string }[] = [
  { key: "analyzing", label: "Naming your store & writing its copy" },
  { key: "selecting", label: "Curating products for your niche" },
  { key: "assembling", label: "Building your storefront" },
];

function stageIndex(status: LaunchStatus): number {
  if (status === "pending") return -1;
  const i = STAGES.findIndex((s) => s.key === status);
  if (i >= 0) return i;
  return STAGES.length; // completed
}

export function AiLaunchWizard() {
  const { setActiveStoreId } = useActiveStore();
  const [prompt, setPrompt] = useState("");
  const [launchId, setLaunchId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const celebratedRef = useRef(false);

  const startMutation = useMutation({
    mutationFn: async (p: string) => {
      const res = await fetch("/api/ai-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: p }),
      });
      const body = await res.json();
      if (res.status === 409 && body.launchId) {
        // A run is already going (e.g. page refreshed mid-launch) — resume it.
        return { id: body.launchId as string };
      }
      if (!res.ok) {
        const err: any = new Error(body.message || "Couldn't start the launch");
        err.upgradeRequired = !!body.upgradeRequired;
        throw err;
      }
      return body as { id: string };
    },
    onSuccess: (data) => {
      setSubmitError(null);
      setUpgradeRequired(false);
      celebratedRef.current = false;
      setLaunchId(data.id);
    },
    onError: (err: any) => {
      setSubmitError(err.message);
      setUpgradeRequired(!!err.upgradeRequired);
    },
  });

  const { data: launch } = useQuery<Launch>({
    queryKey: ["/api/ai-launch", launchId],
    queryFn: async () => {
      const res = await fetch(`/api/ai-launch/${launchId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Launch not found");
      return res.json();
    },
    enabled: !!launchId,
    refetchInterval: (query) => {
      const d = query.state.data as Launch | undefined;
      if (d && (d.status === "completed" || d.status === "failed")) return false;
      return 1500;
    },
  });

  // Completion side effects: activate the new store + refresh the store list.
  useEffect(() => {
    if (launch?.status === "completed" && launch.storeId && !celebratedRef.current) {
      celebratedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      setActiveStoreId(launch.storeId);
      fireConfetti();
    }
  }, [launch?.status, launch?.storeId, setActiveStoreId]);

  const trimmed = prompt.trim();
  const canSubmit = trimmed.length >= 10 && trimmed.length <= 300 && !startMutation.isPending;
  const currentStage = launch ? stageIndex(launch.status) : -1;
  const running = !!launch && launch.status !== "completed" && launch.status !== "failed";

  // ── Done ────────────────────────────────────────────────────────────
  if (launch?.status === "completed") {
    return (
      <div className="text-center space-y-5 py-4" data-testid="ai-launch-done">
        <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500/10 mx-auto">
          <Check className="h-8 w-8 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight">Your store is live</h3>
          <p className="text-muted-foreground mt-1">
            Stocked with {launch.productCount} products, copy written, theme picked. Connect payments when you're ready to sell.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a href={`/s/${launch.storeSlug}`} target="_blank" rel="noreferrer">
            <Button data-testid="button-view-ai-store">
              <ExternalLink className="h-4 w-4 mr-2" /> View your store
            </Button>
          </a>
          <Link href="/dashboard/products">
            <Button variant="outline" data-testid="button-manage-ai-store">
              <Store className="h-4 w-4 mr-2" /> Manage products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Running ─────────────────────────────────────────────────────────
  if (running) {
    return (
      <div className="space-y-5 py-4" data-testid="ai-launch-progress">
        <div className="text-center">
          <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight">Building your store</h3>
          <p className="text-sm text-muted-foreground mt-1">Usually under a minute. Don't close this page — though if you do, we'll pick up where we left off.</p>
        </div>
        <div className="max-w-sm mx-auto space-y-3">
          {STAGES.map((stage, i) => {
            const state = i < currentStage ? "done" : i === currentStage ? "active" : "pending";
            return (
              <div key={stage.key} className="flex items-center gap-3" data-testid={`stage-${stage.key}`}>
                <div className={`flex items-center justify-center h-6 w-6 rounded-full shrink-0 ${
                  state === "done" ? "bg-emerald-500/15" : state === "active" ? "bg-primary/15" : "bg-muted"
                }`}>
                  {state === "done" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : state === "active" ? (
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  )}
                </div>
                <span className={`text-sm ${state === "pending" ? "text-muted-foreground/60" : state === "active" ? "font-medium" : "text-muted-foreground"}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Input (also shows failure from a previous run) ──────────────────
  return (
    <div className="space-y-4" data-testid="ai-launch-input">
      {launch?.status === "failed" && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5" role="alert" data-testid="ai-launch-error">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{launch.error || "The launch failed. Please try again."}</p>
        </div>
      )}
      {submitError && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5" role="alert" data-testid="ai-launch-submit-error">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{submitError}</p>
            {upgradeRequired && (
              <Link href="/dashboard/settings">
                <Button size="sm" variant="outline" className="mt-2">View plans</Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setSubmitError(null); }}
          placeholder='Describe what you sell — e.g. "Notion templates and productivity guides for freelance designers"'
          rows={3}
          maxLength={300}
          className="resize-none text-base"
          data-testid="input-ai-prompt"
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { setPrompt(ex); setSubmitError(null); }}
                className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                data-testid="button-ai-example"
              >
                {ex}
              </button>
            ))}
          </div>
          <span className={`text-xs tabular-nums ${trimmed.length > 0 && trimmed.length < 10 ? "text-destructive" : "text-muted-foreground"}`}>
            {trimmed.length}/300
          </span>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!canSubmit}
        onClick={() => startMutation.mutate(trimmed)}
        data-testid="button-ai-launch"
      >
        {startMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        {startMutation.isPending ? "Starting..." : "Build my store"}
        {!startMutation.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        AI names your store, writes the copy, picks a theme, and stocks it with matching products from the library — ready in about a minute. You can edit everything afterwards.
      </p>
    </div>
  );
}
