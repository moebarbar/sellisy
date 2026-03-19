import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

export function NewsletterSettingsCard() {
  const { activeStore, activeStoreId } = useActiveStore();
  const { toast } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");

  useEffect(() => {
    if (activeStore) {
      setEnabled((activeStore as any).newsletterEnabled || false);
      setHeadline((activeStore as any).newsletterHeadline || "");
      setSubtext((activeStore as any).newsletterSubtext || "");
    }
  }, [activeStore]);

  const toggleMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      if (!activeStoreId) return;
      await apiRequest("PATCH", `/api/stores/${activeStoreId}`, { newsletterEnabled: newValue });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: variables ? "Newsletter enabled" : "Newsletter disabled" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeStoreId) return;
      const body = {
        newsletterEnabled: enabled,
        newsletterHeadline: headline || null,
        newsletterSubtext: subtext || null,
      };
      await apiRequest("PATCH", `/api/stores/${activeStoreId}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Newsletter settings saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save settings", description: err.message, variant: "destructive" });
    },
  });

  const hasChanges = activeStore && (
    enabled !== ((activeStore as any).newsletterEnabled || false) ||
    headline !== ((activeStore as any).newsletterHeadline || "") ||
    subtext !== ((activeStore as any).newsletterSubtext || "")
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Newsletter Section
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(val) => { setEnabled(val); toggleMutation.mutate(val); }}
            disabled={toggleMutation.isPending}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Show an email signup form on your storefront to build your audience. Emails are saved to your customer database.
        </p>

        {enabled && (
          <div className="rounded-md border border-border p-4 space-y-4 bg-muted/20">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                placeholder="e.g. Join the newsletter"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Subtext</Label>
              <Input
                placeholder="e.g. Get free tips and weekly resources delivered to your inbox."
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
              />
            </div>
          </div>
        )}

        <Button
          disabled={!hasChanges || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Newsletter Settings
        </Button>
      </CardContent>
    </Card>
  );
}
