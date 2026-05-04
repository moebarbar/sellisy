import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, authHeaders, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft, ArrowRight, Check, Upload, SkipForward, Loader2,
  Package, Users, ShoppingCart, Sparkles, AlertCircle, ExternalLink,
  FileUp, X, Link2, Folder,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = "connect" | "select" | "progress" | "files" | "complete";

interface GumroadAccountPreview {
  email: string;
  name: string;
  userId: string;
}

interface GumroadProductPreview {
  gumroadProductId: string;
  name: string;
  price: number;
  currency: string;
  thumbnailUrl: string | null;
  productType: string;
  isSubscription: boolean;
  isPublished: boolean;
  hasCustomFields: boolean;
}

interface VerifyResponse {
  gumroadAccount: GumroadAccountPreview;
  productCount: number;
  products: GumroadProductPreview[];
  estimatedSalesCount: number;
}

interface ImportStatus {
  status: string;
  productsTotal: number;
  productsImported: number;
  customersTotal: number;
  customersImported: number;
  salesTotal: number;
  salesImported: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

interface Shell {
  shellId: string;
  sellisyProductId: string;
  gumroadProductId: string;
  fileStatus: string;
  fileMatchHint: string | null;
  productName: string;
  thumbnailUrl: string | null;
  priceCents: number;
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "connect", label: "Connect" },
  { id: "select", label: "Select Products" },
  { id: "progress", label: "Importing" },
  { id: "files", label: "Upload Files" },
  { id: "complete", label: "Done" },
];

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              i < currentIdx
                ? "bg-green-500 text-white"
                : i === currentIdx
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}>
              {i < currentIdx ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${i === currentIdx ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-12 mx-1 mb-5 transition-colors ${i < currentIdx ? "bg-green-500" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Connect ───────────────────────────────────────────────────────────

function StepConnect({
  onVerified,
}: {
  onVerified: (token: string, preview: VerifyResponse) => void;
}) {
  const [token, setToken] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [oauthStarting, setOauthStarting] = useState(false);
  const [autoClaimError, setAutoClaimError] = useState<string | null>(null);
  const { activeStoreId } = useActiveStore();
  const { toast } = useToast();

  // verify takes both accessToken and storeId so the OAuth round-trip can
  // pass the storeId that was bound at /oauth/start time. Manual-paste
  // calls pass the current activeStoreId.
  const verify = useMutation({
    mutationFn: async ({ accessToken, storeId }: { accessToken: string; storeId: string }) => {
      const res = await apiRequest("POST", "/api/integrations/gumroad/verify", { accessToken, storeId });
      return res.json() as Promise<VerifyResponse>;
    },
    onSuccess: (data, vars) => onVerified(vars.accessToken, data),
    onError: (err: Error) => toast({ title: "Verification failed", description: err.message, variant: "destructive" }),
  });

  // OAuth round-trip handling. After the user returns from Gumroad with
  // ?oauth=connected&stash=xxx, we POST that stash id to /oauth/claim
  // (single-use, server-side delete) to retrieve the access token, then
  // run the normal /verify call to load product previews.
  //
  // We use a ref to ensure the claim runs only once per page load even
  // if React re-renders the component (StrictMode in dev double-invokes
  // effects). Without this guard, the second invocation would 404 because
  // the first already consumed the stash.
  const oauthHandledRef = useRef(false);
  useEffect(() => {
    if (oauthHandledRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauth_error");
    const stash = params.get("stash");
    const oauthStatus = params.get("oauth");

    if (!oauthError && !stash && !oauthStatus) return;

    oauthHandledRef.current = true;

    // Strip OAuth params from the URL so a refresh doesn't re-trigger
    // the claim (which would 404 since the stash is already consumed)
    // or show a stale error toast.
    window.history.replaceState({}, "", window.location.pathname);

    if (oauthError) {
      setAutoClaimError(oauthError);
      return;
    }

    if (oauthStatus === "connected" && stash) {
      apiRequest("POST", "/api/integrations/gumroad/oauth/claim", { stashId: stash })
        .then(r => r.json() as Promise<{ accessToken: string; storeId: string }>)
        // Use the storeId returned from the stash (bound at /oauth/start time)
        // rather than activeStoreId — the user might have switched stores
        // while away on Gumroad's consent screen.
        .then(data => verify.mutate({ accessToken: data.accessToken, storeId: data.storeId }))
        .catch((err: Error) => setAutoClaimError(err.message));
    }
    // Empty deps — this should run once on mount only. The oauthHandledRef
    // guards against React StrictMode double-invocation in dev. We don't
    // want re-renders to retrigger the claim because the stash is one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startOAuth = async () => {
    if (!activeStoreId) return;
    setOauthStarting(true);
    setAutoClaimError(null);
    try {
      const res = await apiRequest(
        "GET",
        `/api/integrations/gumroad/oauth/start?storeId=${encodeURIComponent(activeStoreId)}`,
      );
      const data = await res.json() as { url: string };
      // Full-page navigation to Gumroad's authorize screen. After consent,
      // they redirect us back to /dashboard/import/gumroad with ?stash=...
      window.location.href = data.url;
    } catch (err: any) {
      setOauthStarting(false);
      toast({
        title: "Couldn't start the connection",
        description: err?.message ?? "Please try again or use the access token method below.",
        variant: "destructive",
      });
    }
  };

  // Auto-claim already in flight (returned from OAuth, talking to Gumroad).
  if (verify.isPending && !showManual) {
    return (
      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm">Finishing connection with Gumroad…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Connect your Gumroad account</h2>
        <p className="text-muted-foreground text-sm">
          Sign in to Gumroad once to import your products, sales, and customers — no token-copying required.
        </p>
      </div>

      {autoClaimError && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Couldn't connect to Gumroad</p>
            <p className="text-xs text-muted-foreground">{autoClaimError}</p>
          </div>
        </div>
      )}

      <Button
        onClick={startOAuth}
        disabled={!activeStoreId || oauthStarting}
        className="w-full gap-2"
        size="lg"
      >
        {oauthStarting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Gumroad…</>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            Connect Gumroad Account
          </>
        )}
      </Button>

      {!activeStoreId && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> No store selected. Please select a store first.
        </p>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowManual(s => !s)}
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          {showManual ? "Hide manual token option" : "Use a personal access token instead"}
        </button>
      </div>

      {showManual && (
        <div className="space-y-2 pt-2 border-t border-border">
          <Label htmlFor="token">Gumroad Access Token</Label>
          <Input
            id="token"
            type="password"
            placeholder="Paste your access token here"
            value={token}
            onChange={e => setToken(e.target.value)}
            onKeyDown={e => e.key === "Enter" && token.trim() && activeStoreId && verify.mutate({ accessToken: token.trim(), storeId: activeStoreId })}
          />
          <p className="text-xs text-muted-foreground">
            Find it under <span className="font-medium">Gumroad Settings → Advanced → Applications</span>.
            Token is encrypted on our side and deleted after the import completes.
          </p>
          <Button
            onClick={() => activeStoreId && verify.mutate({ accessToken: token.trim(), storeId: activeStoreId })}
            disabled={!token.trim() || !activeStoreId || verify.isPending}
            variant="outline"
            className="w-full"
          >
            {verify.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>
            ) : (
              <><ArrowRight className="w-4 h-4 mr-2" /> Verify token</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Step 2: Select Products ───────────────────────────────────────────────────

function StepSelectProducts({
  preview,
  onStart,
  onBack,
  isStarting,
}: {
  preview: VerifyResponse;
  onStart: (selectedIds: string[], options: ImportOptions) => void;
  onBack: () => void;
  isStarting: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(preview.products.map(p => p.gumroadProductId))
  );
  const [options, setOptions] = useState({
    importCustomers: true,
    importSales: true,
    rewriteDescriptionsWithAI: false,
  });

  const toggleProduct = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(prev =>
      prev.size === preview.products.length
        ? new Set()
        : new Set(preview.products.map(p => p.gumroadProductId))
    );

  return (
    <div className="space-y-6">
      {/* Account summary */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              {preview.gumroadAccount.name?.charAt(0) ?? "G"}
            </div>
            <div>
              <p className="font-medium">{preview.gumroadAccount.name}</p>
              <p className="text-sm text-muted-foreground">{preview.gumroadAccount.email}</p>
            </div>
            <div className="ml-auto flex gap-4 text-center">
              <div>
                <p className="text-lg font-bold">{preview.productCount}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              {preview.estimatedSalesCount > 0 && (
                <div>
                  <p className="text-lg font-bold">~{preview.estimatedSalesCount}</p>
                  <p className="text-xs text-muted-foreground">Sales</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Select products to import ({selected.size}/{preview.products.length})</h3>
          <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
            {selected.size === preview.products.length ? "Deselect all" : "Select all"}
          </Button>
        </div>

        <div className="border rounded-lg divide-y max-h-72 overflow-y-auto">
          {preview.products.map(product => (
            <label
              key={product.gumroadProductId}
              className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
            >
              <Checkbox
                checked={selected.has(product.gumroadProductId)}
                onCheckedChange={() => toggleProduct(product.gumroadProductId)}
              />
              {product.thumbnailUrl ? (
                <img src={product.thumbnailUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  ${(product.price / 100).toFixed(2)} {product.currency.toUpperCase()}
                  {product.isSubscription && <span className="ml-1 text-orange-500">(subscription)</span>}
                  {!product.isPublished && <span className="ml-1 text-muted-foreground">(unpublished)</span>}
                </p>
              </div>
              {product.hasCustomFields && (
                <Badge variant="outline" className="text-xs">Custom fields</Badge>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Import options */}
      <div className="space-y-3">
        <h3 className="font-medium">Import options</h3>
        <OptionRow
          id="importSales"
          icon={<ShoppingCart className="w-4 h-4" />}
          label="Import sales history"
          description="Create order records for all past Gumroad sales"
          checked={options.importSales}
          onChange={v => setOptions(o => ({ ...o, importSales: v }))}
        />
        <OptionRow
          id="importCustomers"
          icon={<Users className="w-4 h-4" />}
          label="Import customers"
          description="Create customer records from buyer emails"
          checked={options.importCustomers}
          onChange={v => setOptions(o => ({ ...o, importCustomers: v }))}
        />
        <OptionRow
          id="rewriteAI"
          icon={<Sparkles className="w-4 h-4" />}
          label="Rewrite descriptions with AI"
          description="Use Claude to improve product descriptions (adds a few seconds per product)"
          checked={options.rewriteDescriptionsWithAI}
          onChange={v => setOptions(o => ({ ...o, rewriteDescriptionsWithAI: v }))}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          className="flex-1 gap-2"
          disabled={selected.size === 0 || isStarting}
          onClick={() => onStart(Array.from(selected), options)}
        >
          {isStarting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</>
          ) : (
            <>Start Import ({selected.size} product{selected.size !== 1 ? "s" : ""}) <ArrowRight className="w-4 h-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}

interface ImportOptions {
  importCustomers: boolean;
  importSales: boolean;
  rewriteDescriptionsWithAI: boolean;
}

function OptionRow({
  id, icon, label, description, checked, onChange,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 cursor-pointer">
      <Checkbox id={id} checked={checked} onCheckedChange={v => onChange(!!v)} className="mt-0.5" />
      <div className="flex items-center gap-2 text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}

// ── Step 3: Progress ──────────────────────────────────────────────────────────

function StepProgress({
  importId,
  onDone,
}: {
  importId: string;
  onDone: (finalStatus: string) => void;
}) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const { data: status } = useQuery<ImportStatus>({
    queryKey: ["/api/integrations/gumroad/status", importId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/integrations/gumroad/status/${importId}`);
      return res.json();
    },
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (s === "awaiting_files" || s === "completed" || s === "failed") return false;
      return 2000;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (!status) return;
    if (status.status === "awaiting_files" || status.status === "completed" || status.status === "failed") {
      onDoneRef.current(status.status);
    }
  }, [status?.status]);

  const pct = status && status.productsTotal > 0
    ? Math.round((status.productsImported / status.productsTotal) * 100)
    : 0;

  if (status?.status === "failed") {
    return (
      <div className="max-w-lg space-y-4">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Import failed</h2>
        </div>
        <p className="text-muted-foreground text-sm">{status.errorMessage ?? "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Importing from Gumroad…</h2>
        <p className="text-muted-foreground text-sm">This usually takes under a minute. Don't close this tab.</p>
      </div>

      <div className="space-y-4">
        <ProgressRow
          icon={<Package className="w-4 h-4" />}
          label="Products"
          imported={status?.productsImported ?? 0}
          total={status?.productsTotal ?? 0}
          pct={pct}
        />
        {(status?.salesTotal ?? 0) > 0 || (status?.salesImported ?? 0) > 0 ? (
          <ProgressRow
            icon={<ShoppingCart className="w-4 h-4" />}
            label="Sales"
            imported={status?.salesImported ?? 0}
            total={status?.salesTotal ?? 0}
          />
        ) : null}
        {(status?.customersTotal ?? 0) > 0 || (status?.customersImported ?? 0) > 0 ? (
          <ProgressRow
            icon={<Users className="w-4 h-4" />}
            label="Customers"
            imported={status?.customersImported ?? 0}
            total={status?.customersTotal ?? 0}
          />
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Status: {status?.status ?? "starting…"}</span>
      </div>
    </div>
  );
}

function ProgressRow({
  icon, label, imported, total, pct,
}: {
  icon: React.ReactNode;
  label: string;
  imported: number;
  total: number;
  pct?: number;
}) {
  const p = pct ?? (total > 0 ? Math.round((imported / total) * 100) : 0);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{icon}</span>
        <span className="font-medium">{label}</span>
        <span className="ml-auto text-muted-foreground text-xs">
          {imported}{total > 0 ? `/${total}` : ""}
        </span>
      </div>
      <Progress value={p} className="h-1.5" />
    </div>
  );
}

// ── Fuzzy matching ────────────────────────────────────────────────────────────

function normalizeForMatch(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/\.[^.]+$/, '')       // strip file extension
    .replace(/[^a-z0-9]+/g, ' ')  // non-alnum → space
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function fuzzyScore(fileName: string, productName: string): number {
  const a = normalizeForMatch(fileName);
  const b = normalizeForMatch(productName);
  if (a.length === 0 || b.length === 0) return 0;

  const aStr = a.join(' ');
  const bStr = b.join(' ');
  if (aStr === bStr) return 1;
  if (aStr.includes(bStr) || bStr.includes(aStr)) return 0.88;

  const aSet = new Set(a);
  const bSet = new Set(b);
  const aArr = Array.from(aSet);
  const bArr = Array.from(bSet);
  const intersection = aArr.filter(t => bSet.has(t)).length;
  const union = new Set([...aArr, ...bArr]).size;
  const jaccard = intersection / union;

  const prefixBonus = bArr.some(bt => aArr.some(at => at.startsWith(bt) || bt.startsWith(at))) ? 0.1 : 0;

  return Math.min(1, jaccard + prefixBonus);
}

const MATCH_THRESHOLD = 0.3;
const AUTO_ACCEPT_THRESHOLD = 0.6;

interface FileMatch {
  shellId: string;
  file: File;
  score: number;
  accepted: boolean;
}

function computeMatches(files: File[], shells: Shell[]): {
  matches: Map<string, FileMatch>;
  unmatched: File[];
} {
  const matches = new Map<string, FileMatch>();
  const usedFiles = new Set<number>();

  // For each shell, find the best-scoring available file
  for (const shell of shells) {
    let best: { file: File; score: number; idx: number } | null = null;
    for (let idx = 0; idx < files.length; idx++) {
      if (usedFiles.has(idx)) continue;
      const score = fuzzyScore(files[idx].name, shell.fileMatchHint ?? shell.productName);
      if (score >= MATCH_THRESHOLD && (!best || score > best.score)) {
        best = { file: files[idx], score, idx };
      }
    }
    if (best) {
      usedFiles.add(best.idx);
      matches.set(shell.shellId, {
        shellId: shell.shellId,
        file: best.file,
        score: best.score,
        accepted: best.score >= AUTO_ACCEPT_THRESHOLD,
      });
    }
  }

  const unmatched = files.filter((_, idx) => !usedFiles.has(idx));
  return { matches, unmatched };
}

function confidenceLabel(score: number): { label: string; className: string } {
  if (score >= 0.75) return { label: 'High', className: 'text-green-600 border-green-300 bg-green-50' };
  if (score >= 0.5)  return { label: 'Medium', className: 'text-yellow-600 border-yellow-300 bg-yellow-50' };
  return { label: 'Low', className: 'text-orange-600 border-orange-300 bg-orange-50' };
}

// ── Drop zone ─────────────────────────────────────────────────────────────────

function FileDropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (files: FileList | null) => {
    if (files && files.length > 0) onFiles(Array.from(files));
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
    >
      <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handle(e.target.files)} />
      <Folder className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
      <p className="font-medium text-sm">Drop all your product files here</p>
      <p className="text-xs text-muted-foreground mt-1">
        We'll auto-match files to products by name. Or browse to select files.
      </p>
    </div>
  );
}

// ── Step 4: Upload Files ──────────────────────────────────────────────────────

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

function StepFiles({
  importId,
  onFinished,
}: {
  importId: string;
  onFinished: () => void;
}) {
  const { toast } = useToast();
  const [localStatuses, setLocalStatuses] = useState<Record<string, 'uploaded' | 'skipped'>>({});
  const [finishing, setFinishing] = useState(false);

  // Fuzzy match state
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [fileMatches, setFileMatches] = useState<Map<string, FileMatch>>(new Map());
  const [unmatchedFiles, setUnmatchedFiles] = useState<File[]>([]);
  const [batchUploadStates, setBatchUploadStates] = useState<Record<string, UploadState>>({});

  const { data: shells } = useQuery<Shell[]>({
    queryKey: ['/api/integrations/gumroad/shells', importId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/integrations/gumroad/shells/${importId}`);
      return res.json();
    },
  });

  const pendingShells = (shells ?? []).filter(
    s => !localStatuses[s.shellId] && s.fileStatus === 'missing'
  );
  const readyToUploadCount = pendingShells.filter(s => fileMatches.get(s.shellId)?.accepted).length;
  const trulyUnhandledCount = pendingShells.length - readyToUploadCount;
  const allHandled = shells != null && pendingShells.length === 0;

  // Merge new files into the existing pool (deduplicate by name) then recompute
  const handleDroppedFiles = useCallback((newFiles: File[]) => {
    const existingNames = new Set(droppedFiles.map(f => f.name));
    const merged = [...droppedFiles, ...newFiles.filter(f => !existingNames.has(f.name))];
    setDroppedFiles(merged);
    if (!shells) return;
    const onlyPending = shells.filter(s => !localStatuses[s.shellId] && s.fileStatus === 'missing');
    const { matches, unmatched } = computeMatches(merged, onlyPending);
    setFileMatches(matches);
    setUnmatchedFiles(unmatched);
    setBatchUploadStates({});
  }, [shells, localStatuses, droppedFiles]);

  const toggleAccept = (shellId: string) => {
    setFileMatches(prev => {
      const next = new Map(prev);
      const m = next.get(shellId);
      if (m) next.set(shellId, { ...m, accepted: !m.accepted });
      return next;
    });
  };

  const clearMatch = (shellId: string) => {
    setFileMatches(prev => {
      const next = new Map(prev);
      next.delete(shellId);
      return next;
    });
  };

  // Assign an unmatched file to a specific shell
  const assignFile = (shellId: string, file: File) => {
    setFileMatches(prev => {
      const next = new Map(prev);
      next.set(shellId, { shellId, file, score: 1, accepted: true });
      return next;
    });
    setUnmatchedFiles(prev => prev.filter(f => f !== file));
  };

  // Upload a single file and attach it to a shell
  const uploadAndAttach = async (shellId: string, file: File): Promise<boolean> => {
    setBatchUploadStates(s => ({ ...s, [shellId]: 'uploading' }));
    try {
      // Step 1: get presigned URL
      const urlRes = await fetch('/api/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        credentials: 'include',
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || 'application/octet-stream' }),
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { uploadURL, objectPath } = await urlRes.json() as { uploadURL: string; objectPath: string };

      // Step 2: PUT to presigned URL
      const putRes = await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!putRes.ok) throw new Error('Failed to upload file');

      // Step 3: attach
      await apiRequest('POST', '/api/integrations/gumroad/files/attach', {
        shellId,
        r2Key: objectPath,
        fileName: file.name,
        fileSize: file.size,
      });

      setBatchUploadStates(s => ({ ...s, [shellId]: 'done' }));
      setLocalStatuses(s => ({ ...s, [shellId]: 'uploaded' }));
      return true;
    } catch (err: any) {
      setBatchUploadStates(s => ({ ...s, [shellId]: 'error' }));
      return false;
    }
  };

  const uploadAllAccepted = async () => {
    const toUpload = Array.from(fileMatches.entries()).filter(([, m]) => m.accepted);
    const results = await Promise.allSettled(
      toUpload.map(([shellId, m]) => uploadAndAttach(shellId, m.file))
    );
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value)).length;
    if (failed > 0) {
      toast({ title: `${failed} upload${failed > 1 ? 's' : ''} failed`, description: 'Check the highlighted rows and try again.', variant: 'destructive' });
    }
  };

  const acceptedCount = Array.from(fileMatches.values()).filter(m => m.accepted).length;
  const batchInProgress = Object.values(batchUploadStates).some(s => s === 'uploading');

  const finish = async () => {
    setFinishing(true);
    try {
      // Raw fetch (not apiRequest) because we need to read the body on
      // non-2xx responses (specifically missingShellIds from a 400).
      // Manually attach the Clerk JWT — apiRequest does this for us.
      const res = await fetch(`/api/integrations/gumroad/finish/${importId}`, {
        method: 'POST',
        headers: await authHeaders(),
        credentials: 'include',
      });
      const body = await res.json() as any;
      if (!res.ok) {
        if (Array.isArray(body.missingShellIds) && body.missingShellIds.length > 0) {
          setLocalStatuses(prev => {
            const next = { ...prev };
            for (const id of body.missingShellIds) delete next[id];
            return next;
          });
        }
        toast({ title: 'Could not finish import', description: body.error ?? 'Unexpected error', variant: 'destructive' });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['/api/store-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      onFinished();
    } catch {
      toast({ title: 'Could not finish import', description: 'Network error', variant: 'destructive' });
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Upload product files</h2>
        <p className="text-muted-foreground text-sm">
          Gumroad doesn't expose files via API. Drop all your files below — we'll match them
          to the right products automatically, or upload individually.
        </p>
      </div>

      {/* Drop zone */}
      <FileDropZone onFiles={handleDroppedFiles} />

      {/* Batch match summary */}
      {droppedFiles.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            {droppedFiles.length} file{droppedFiles.length !== 1 ? 's' : ''} dropped
            {unmatchedFiles.length > 0 && ` · ${unmatchedFiles.length} unmatched`}
          </span>
          {acceptedCount > 0 && (
            <Button size="sm" disabled={batchInProgress} onClick={uploadAllAccepted} className="gap-1.5">
              {batchInProgress
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</>
                : <><FileUp className="w-3 h-3" /> Upload {acceptedCount} matched file{acceptedCount !== 1 ? 's' : ''}</>
              }
            </Button>
          )}
        </div>
      )}

      {/* Product list */}
      <div className="border rounded-lg divide-y">
        {(shells ?? []).map(shell => {
          const match = fileMatches.get(shell.shellId) ?? null;
          const localStatus = localStatuses[shell.shellId] ?? null;
          const effectiveStatus = localStatus ?? (shell.fileStatus !== 'missing' ? shell.fileStatus : null);
          const batchState = batchUploadStates[shell.shellId] ?? null;

          return (
            <ShellRow
              key={shell.shellId}
              shell={shell}
              effectiveStatus={effectiveStatus}
              match={match}
              batchState={batchState}
              unmatchedFiles={unmatchedFiles}
              onToggleAccept={() => toggleAccept(shell.shellId)}
              onClearMatch={() => clearMatch(shell.shellId)}
              onAssignFile={file => assignFile(shell.shellId, file)}
              onManualUploaded={(r2Key, fileName, fileSize) => {
                apiRequest('POST', '/api/integrations/gumroad/files/attach', {
                  shellId: shell.shellId, r2Key, fileName, fileSize,
                }).then(() => setLocalStatuses(s => ({ ...s, [shell.shellId]: 'uploaded' })))
                  .catch((err: Error) => toast({ title: 'Failed to attach file', description: err.message, variant: 'destructive' }));
              }}
              onSkipped={() => {
                apiRequest('POST', '/api/integrations/gumroad/files/skip', { shellId: shell.shellId })
                  .then(() => setLocalStatuses(s => ({ ...s, [shell.shellId]: 'skipped' })))
                  .catch((err: Error) => toast({ title: 'Failed to skip', description: err.message, variant: 'destructive' }));
              }}
            />
          );
        })}
      </div>

      {shells && shells.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No new files to upload — all selected products were already in your store.
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pendingShells.length === 0
            ? 'All products handled'
            : readyToUploadCount > 0 && trulyUnhandledCount === 0
            ? `${readyToUploadCount} match${readyToUploadCount !== 1 ? 'es' : ''} ready — click "Upload matched files"`
            : readyToUploadCount > 0
            ? `${readyToUploadCount} ready to upload · ${trulyUnhandledCount} still need a file or skip`
            : `${trulyUnhandledCount} product${trulyUnhandledCount !== 1 ? 's' : ''} still need${trulyUnhandledCount === 1 ? 's' : ''} a file or skip`}
        </p>
        <Button onClick={finish} disabled={!allHandled || finishing} className="gap-2">
          {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Finish Import
        </Button>
      </div>
    </div>
  );
}

function ShellRow({
  shell,
  effectiveStatus,
  match,
  batchState,
  unmatchedFiles,
  onToggleAccept,
  onClearMatch,
  onAssignFile,
  onManualUploaded,
  onSkipped,
}: {
  shell: Shell;
  effectiveStatus: string | null;
  match: FileMatch | null;
  batchState: UploadState | null;
  unmatchedFiles: File[];
  onToggleAccept: () => void;
  onClearMatch: () => void;
  onAssignFile: (file: File) => void;
  onManualUploaded: (r2Key: string, fileName: string, fileSize: number) => void;
  onSkipped: () => void;
}) {
  const { toast } = useToast();
  const { uploadFile, isUploading, progress } = useUpload({
    onError: err => toast({ title: 'Upload failed', description: err.message, variant: 'destructive' }),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualFile = async (file: File) => {
    const result = await uploadFile(file);
    if (result) onManualUploaded(result.objectPath, file.name, file.size);
  };

  const [showAllFiles, setShowAllFiles] = useState(false);
  const conf = match ? confidenceLabel(match.score) : null;
  const isUploaded = effectiveStatus === 'uploaded' || batchState === 'done';
  const isSkipped = effectiveStatus === 'skipped';
  const isBatchUploading = batchState === 'uploading';
  const isBatchError = batchState === 'error';

  return (
    <div className={`flex items-start gap-3 p-3 ${isBatchError ? 'bg-destructive/5' : ''}`}>
      {/* Thumbnail */}
      {shell.thumbnailUrl ? (
        <img src={shell.thumbnailUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0 mt-0.5" />
      ) : (
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
          <Package className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      {/* Product info + match details */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-medium text-sm truncate">{shell.productName}</p>

        {/* Match suggestion */}
        {match && !isUploaded && !isSkipped && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate max-w-[180px]">{match.file.name}</span>
            <Badge variant="outline" className={`text-xs px-1.5 py-0 ${conf?.className}`}>
              {Math.round(match.score * 100)}% {conf?.label}
            </Badge>
          </div>
        )}

        {/* Upload / batch progress */}
        {(isUploading || isBatchUploading) && (
          <Progress value={isUploading ? progress : undefined} className="h-1 w-32" />
        )}
        {isBatchError && (
          <p className="text-xs text-destructive">Batch upload failed — upload manually or skip.</p>
        )}

        {/* Unmatched file quick-assign (dropdown style) */}
        {!match && !isUploaded && !isSkipped && unmatchedFiles.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-1">
            <span className="text-xs text-muted-foreground">Assign:</span>
            {(showAllFiles ? unmatchedFiles : unmatchedFiles.slice(0, 3)).map(f => (
              <button
                key={f.name}
                onClick={() => onAssignFile(f)}
                className="text-xs px-1.5 py-0.5 rounded border border-dashed hover:bg-muted truncate max-w-[120px]"
              >
                {f.name}
              </button>
            ))}
            {!showAllFiles && unmatchedFiles.length > 3 && (
              <button
                onClick={() => setShowAllFiles(true)}
                className="text-xs text-primary underline"
              >
                +{unmatchedFiles.length - 3} more
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isUploaded ? (
          <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
            <Check className="w-3 h-3" /> Uploaded
          </Badge>
        ) : isSkipped ? (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <SkipForward className="w-3 h-3" /> Skipped
          </Badge>
        ) : isBatchUploading ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
          </div>
        ) : isBatchError || !match ? (
          /* Batch error OR no match — show manual upload/skip */
          <div className="flex gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleManualFile(f);
                e.target.value = '';
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-7 px-2 gap-1 text-xs"
            >
              {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Upload
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isUploading}
              onClick={onSkipped}
              className="h-7 px-2 gap-1 text-xs text-muted-foreground"
            >
              <SkipForward className="w-3 h-3" /> Skip
            </Button>
          </div>
        ) : (
          /* Matched and no error — accept/reject controls */
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={match.accepted ? 'default' : 'outline'}
              onClick={onToggleAccept}
              className="h-7 px-2 text-xs gap-1"
            >
              <Check className="w-3 h-3" />
              {match.accepted ? 'Accepted' : 'Accept'}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClearMatch} className="h-7 w-7 p-0 text-muted-foreground">
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 5: Complete ──────────────────────────────────────────────────────────

function StepComplete({
  importId,
  onGoToProducts,
}: {
  importId: string;
  onGoToProducts: () => void;
}) {
  const { toast } = useToast();
  const [emailsSent, setEmailsSent] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);

  const { data: status } = useQuery<ImportStatus>({
    queryKey: ["/api/integrations/gumroad/status", importId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/integrations/gumroad/status/${importId}`);
      return res.json();
    },
    staleTime: 0,
  });

  const sendWelcomeEmails = async () => {
    setSendingEmails(true);
    try {
      await apiRequest("POST", `/api/integrations/gumroad/send-welcome-emails/${importId}`);
      setEmailsSent(true);
      toast({ title: "Welcome emails queued", description: "Your customers will receive a welcome email shortly." });
    } catch (err: any) {
      toast({ title: "Could not send emails", description: err.message, variant: "destructive" });
    } finally {
      setSendingEmails(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Import complete!</h2>
          <p className="text-muted-foreground text-sm">Your products are now in your store as drafts.</p>
        </div>
      </div>

      {status && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Products" value={status.productsImported} icon={<Package className="w-5 h-5" />} />
          <StatCard label="Sales" value={status.salesImported} icon={<ShoppingCart className="w-5 h-5" />} />
          <StatCard label="Customers" value={status.customersImported} icon={<Users className="w-5 h-5" />} />
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Send welcome emails</CardTitle>
          <CardDescription className="text-sm">
            Let your existing customers know their purchases are now available on your new store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            disabled={emailsSent || sendingEmails || !status?.customersImported}
            onClick={sendWelcomeEmails}
            className="gap-2"
          >
            {sendingEmails ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {emailsSent ? "Emails queued ✓" : "Send welcome emails"}
          </Button>
          {!status?.customersImported && (
            <p className="text-xs text-muted-foreground mt-2">No customers were imported.</p>
          )}
        </CardContent>
      </Card>

      <Button onClick={onGoToProducts} className="w-full gap-2">
        <ExternalLink className="w-4 h-4" /> Go to My Products
      </Button>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-3 text-center space-y-1">
      <div className="flex justify-center text-muted-foreground">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Root wizard page ──────────────────────────────────────────────────────────

export default function GumroadImporterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { activeStoreId } = useActiveStore();

  const [step, setStep] = useState<WizardStep>("connect");
  const [accessToken, setAccessToken] = useState("");
  const [verifyData, setVerifyData] = useState<VerifyResponse | null>(null);
  const [importId, setImportId] = useState<string | null>(null);

  const startImport = useMutation({
    mutationFn: async ({
      selectedProductIds,
      options,
    }: {
      selectedProductIds: string[];
      options: ImportOptions;
    }) => {
      // Raw fetch (not apiRequest) because we need to read the body on
      // non-2xx responses (specifically the importId from a 409 conflict).
      // Manually attach the Clerk JWT — apiRequest does this for us.
      const res = await fetch("/api/integrations/gumroad/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        credentials: "include",
        body: JSON.stringify({ accessToken, storeId: activeStoreId, selectedProductIds, options }),
      });
      const body = await res.json() as any;
      if (!res.ok) throw Object.assign(new Error(body.error ?? "Failed to start import"), { importId: body.importId ?? null });
      return { importId: body.importId as string };
    },
    onSuccess: ({ importId: id }) => {
      setImportId(id);
      setStep("progress");
    },
    onError: (err: any) => {
      if (err.importId) {
        // An import is already running — jump straight to its progress
        setImportId(err.importId);
        setStep("progress");
        toast({ title: "Import already in progress", description: "Showing the status of your existing import." });
        return;
      }
      toast({ title: "Failed to start import", description: err.message, variant: "destructive" });
    },
  });

  const handleVerified = (token: string, data: VerifyResponse) => {
    setAccessToken(token);
    setVerifyData(data);
    setStep("select");
  };

  const handleProgressDone = (finalStatus: string) => {
    if (finalStatus === "awaiting_files") setStep("files");
    else if (finalStatus === "completed") setStep("complete");
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard/my-products")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>
        <h1 className="text-2xl font-bold">Import from Gumroad</h1>
        <p className="text-muted-foreground text-sm mt-1">
          One-click migration of your products, sales, and customers.
        </p>
      </div>

      <StepIndicator current={step} />

      {step === "connect" && (
        <StepConnect onVerified={handleVerified} />
      )}

      {step === "select" && verifyData && (
        <StepSelectProducts
          preview={verifyData}
          onBack={() => setStep("connect")}
          onStart={(ids, opts) => startImport.mutate({ selectedProductIds: ids, options: opts })}
          isStarting={startImport.isPending}
        />
      )}

      {step === "progress" && importId && (
        <StepProgress importId={importId} onDone={handleProgressDone} />
      )}

      {step === "files" && importId && (
        <StepFiles importId={importId} onFinished={() => setStep("complete")} />
      )}

      {step === "complete" && importId && (
        <StepComplete
          importId={importId}
          onGoToProducts={() => navigate("/dashboard/my-products")}
        />
      )}
    </div>
  );
}
