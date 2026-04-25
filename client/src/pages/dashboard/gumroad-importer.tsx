import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const { activeStoreId } = useActiveStore();
  const { toast } = useToast();

  const verify = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/integrations/gumroad/verify", {
        accessToken: token.trim(),
        storeId: activeStoreId,
      });
      return res.json() as Promise<VerifyResponse>;
    },
    onSuccess: (data) => onVerified(token.trim(), data),
    onError: (err: Error) => toast({ title: "Verification failed", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Connect your Gumroad account</h2>
        <p className="text-muted-foreground text-sm">
          Enter your Gumroad API access token. You can find it under{" "}
          <span className="font-medium">Gumroad Settings → Advanced → Applications</span>.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="token">Gumroad Access Token</Label>
        <Input
          id="token"
          type="password"
          placeholder="Paste your access token here"
          value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => e.key === "Enter" && token.trim() && verify.mutate()}
        />
        <p className="text-xs text-muted-foreground">
          Your token is encrypted before being stored and is deleted after the import completes.
        </p>
      </div>

      <Button
        onClick={() => verify.mutate()}
        disabled={!token.trim() || !activeStoreId || verify.isPending}
        className="w-full"
      >
        {verify.isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting…</>
        ) : (
          <><ArrowRight className="w-4 h-4 mr-2" /> Verify & Continue</>
        )}
      </Button>

      {!activeStoreId && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> No store selected. Please select a store first.
        </p>
      )}
    </div>
  );
}

// ── Step 2: Select Products ───────────────────────────────────────────────────

function StepSelectProducts({
  preview,
  onStart,
  onBack,
}: {
  preview: VerifyResponse;
  onStart: (selectedIds: string[], options: ImportOptions) => void;
  onBack: () => void;
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
          disabled={selected.size === 0}
          onClick={() => onStart(Array.from(selected), options)}
        >
          Start Import ({selected.size} product{selected.size !== 1 ? "s" : ""})
          <ArrowRight className="w-4 h-4" />
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

// ── Step 4: Upload Files ──────────────────────────────────────────────────────

function StepFiles({
  importId,
  onFinished,
}: {
  importId: string;
  onFinished: () => void;
}) {
  const { toast } = useToast();
  const [localStatuses, setLocalStatuses] = useState<Record<string, "uploaded" | "skipped">>({});
  const [finishing, setFinishing] = useState(false);

  const { data: shells, refetch } = useQuery<Shell[]>({
    queryKey: ["/api/integrations/gumroad/shells", importId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/integrations/gumroad/shells/${importId}`);
      return res.json();
    },
  });

  const pending = (shells ?? []).filter(
    s => !localStatuses[s.shellId] && s.fileStatus === "missing"
  );
  const allHandled = shells && shells.length > 0 && pending.length === 0;

  const finish = async () => {
    setFinishing(true);
    try {
      await apiRequest("POST", `/api/integrations/gumroad/finish/${importId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/store-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onFinished();
    } catch (err: any) {
      toast({ title: "Could not finish import", description: err.message, variant: "destructive" });
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Upload product files</h2>
        <p className="text-muted-foreground text-sm">
          Gumroad doesn't expose downloadable files via API. Upload each product's file below,
          or skip products you'll add later.
        </p>
      </div>

      <div className="border rounded-lg divide-y">
        {(shells ?? []).map(shell => (
          <ShellRow
            key={shell.shellId}
            shell={shell}
            localStatus={localStatuses[shell.shellId] ?? null}
            onUploaded={(r2Key, fileName, fileSize) => {
              apiRequest("POST", "/api/integrations/gumroad/files/attach", {
                shellId: shell.shellId,
                r2Key,
                fileName,
                fileSize,
              }).then(() => {
                setLocalStatuses(s => ({ ...s, [shell.shellId]: "uploaded" }));
              }).catch((err: Error) => {
                toast({ title: "Failed to attach file", description: err.message, variant: "destructive" });
              });
            }}
            onSkipped={() => {
              apiRequest("POST", "/api/integrations/gumroad/files/skip", { shellId: shell.shellId })
                .then(() => setLocalStatuses(s => ({ ...s, [shell.shellId]: "skipped" })))
                .catch((err: Error) => {
                  toast({ title: "Failed to skip", description: err.message, variant: "destructive" });
                });
            }}
          />
        ))}
      </div>

      {shells && shells.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No products were imported.</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pending.length > 0
            ? `${pending.length} product${pending.length !== 1 ? "s" : ""} still need${pending.length === 1 ? "s" : ""} a file or skip`
            : "All products handled"}
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
  shell, localStatus, onUploaded, onSkipped,
}: {
  shell: Shell;
  localStatus: "uploaded" | "skipped" | null;
  onUploaded: (r2Key: string, fileName: string, fileSize: number) => void;
  onSkipped: () => void;
}) {
  const { toast } = useToast();
  const { uploadFile, isUploading, progress } = useUpload({
    onError: (err) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const effectiveStatus = localStatus ?? (shell.fileStatus !== "missing" ? shell.fileStatus : null);

  const handleFile = async (file: File) => {
    const result = await uploadFile(file);
    if (result) {
      onUploaded(result.objectPath, file.name, file.size);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3">
      {shell.thumbnailUrl ? (
        <img src={shell.thumbnailUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{shell.productName}</p>
        {shell.fileMatchHint && (
          <p className="text-xs text-muted-foreground truncate">Hint: {shell.fileMatchHint}</p>
        )}
        {isUploading && <Progress value={progress} className="h-1 mt-1 w-32" />}
      </div>

      {effectiveStatus === "uploaded" ? (
        <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
          <Check className="w-3 h-3" /> Uploaded
        </Badge>
      ) : effectiveStatus === "skipped" ? (
        <Badge variant="outline" className="text-muted-foreground gap-1">
          <SkipForward className="w-3 h-3" /> Skipped
        </Badge>
      ) : (
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1 text-xs"
          >
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isUploading}
            onClick={onSkipped}
            className="gap-1 text-xs text-muted-foreground"
          >
            <SkipForward className="w-3 h-3" /> Skip
          </Button>
        </div>
      )}
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
      const res = await apiRequest("POST", "/api/integrations/gumroad/start", {
        accessToken,
        storeId: activeStoreId,
        selectedProductIds,
        options,
      });
      return res.json() as Promise<{ importId: string }>;
    },
    onSuccess: ({ importId: id }) => {
      setImportId(id);
      setStep("progress");
    },
    onError: (err: Error) => toast({ title: "Failed to start import", description: err.message, variant: "destructive" }),
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
        />
      )}

      {step === "select" && startImport.isPending && (
        <div className="flex items-center gap-2 text-muted-foreground mt-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Starting import…
        </div>
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
