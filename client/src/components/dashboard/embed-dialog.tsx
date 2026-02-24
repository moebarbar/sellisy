import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Code } from "lucide-react";

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeSlug: string;
  itemType: "product" | "bundle";
  itemId: string;
  itemName: string;
}

export function EmbedDialog({ open, onOpenChange, storeSlug, itemType, itemId, itemName }: EmbedDialogProps) {
  const [darkTheme, setDarkTheme] = useState(false);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const themeParam = darkTheme ? "?theme=dark" : "";
  const embedPath = `/embed/${storeSlug}/${itemType}/${itemId}${themeParam}`;
  const embedUrl = `${origin}${embedPath}`;

  const iframeCode = `<iframe src="${embedUrl}" width="500" height="200" style="border:none;overflow:hidden;border-radius:12px;" loading="lazy" title="${itemName}"></iframe>`;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Embed {itemType === "product" ? "Product" : "Bundle"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium mb-2 block">Preview</Label>
            <div className="rounded-lg border bg-muted/30 p-3 overflow-hidden">
              <iframe
                key={darkTheme ? "dark" : "light"}
                src={embedPath}
                width="100%"
                height="200"
                style={{ border: "none", overflow: "hidden", borderRadius: 12 }}
                title={`${itemName} embed preview`}
                data-testid="embed-preview-iframe"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="embed-theme-toggle" className="text-sm font-medium">Dark theme</Label>
            <Switch
              id="embed-theme-toggle"
              checked={darkTheme}
              onCheckedChange={setDarkTheme}
              data-testid="switch-embed-theme"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Embed Code</Label>
            <div className="relative">
              <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all select-all" data-testid="embed-code-snippet">
                {iframeCode}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={copyCode}
                data-testid="button-copy-embed-code"
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Paste this code into any HTML page to embed this {itemType}. The widget links back to your storefront.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
