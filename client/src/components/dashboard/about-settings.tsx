import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserSquare2 } from "lucide-react";
import { ImageUploadField } from "./image-upload-field";

export function AboutSettingsCard() {
  const { activeStore, activeStoreId } = useActiveStore();
  const { toast } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [headline, setHeadline] = useState("");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  useEffect(() => {
    if (activeStore) {
      setEnabled((activeStore as any).aboutEnabled || false);
      setHeadline((activeStore as any).aboutHeadline || "");
      setText((activeStore as any).aboutText || "");
      setImageUrl((activeStore as any).aboutImageUrl || "");
      setCtaText((activeStore as any).aboutCtaText || "");
      setCtaUrl((activeStore as any).aboutCtaUrl || "");
    }
  }, [activeStore]);

  const toggleMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      if (!activeStoreId) return;
      await apiRequest("PATCH", `/api/stores/${activeStoreId}`, { aboutEnabled: newValue });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: variables ? "About section enabled" : "About section disabled" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeStoreId) return;
      const body = {
        aboutEnabled: enabled,
        aboutHeadline: headline || null,
        aboutText: text || null,
        aboutImageUrl: imageUrl || null,
        aboutCtaText: ctaText || null,
        aboutCtaUrl: ctaUrl || null,
      };
      await apiRequest("PATCH", `/api/stores/${activeStoreId}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "About section settings saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save settings", description: err.message, variant: "destructive" });
    },
  });

  const hasChanges = activeStore && (
    enabled !== ((activeStore as any).aboutEnabled || false) ||
    headline !== ((activeStore as any).aboutHeadline || "") ||
    text !== ((activeStore as any).aboutText || "") ||
    imageUrl !== ((activeStore as any).aboutImageUrl || "") ||
    ctaText !== ((activeStore as any).aboutCtaText || "") ||
    ctaUrl !== ((activeStore as any).aboutCtaUrl || "")
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserSquare2 className="h-4 w-4" /> About / Story Section
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
          Turn your storefront into a personal website by adding an "About" or "My Story" section to build trust with your audience.
        </p>

        {enabled && (
          <div className="rounded-md border border-border p-4 space-y-4 bg-muted/20">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                placeholder="e.g. Hi, I'm Sarah"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Bio / Story</Label>
              <Textarea
                placeholder="Share your background, what you do, and why you created these products..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Profile Image</Label>
              <ImageUploadField
                label="Profile Image"
                value={imageUrl}
                onChange={setImageUrl}
                aspectHint="A square or portrait photo. Used alongside your bio."
                previewClass="w-32 h-32 rounded-full"
                testIdPrefix="about-image"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-2">
                <Label>Call to Action Text (Optional)</Label>
                <Input
                  placeholder="e.g. Learn More"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Call to Action Link (Optional)</Label>
                <Input
                  placeholder="https://..."
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <Button
          disabled={!hasChanges || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save About Settings
        </Button>
      </CardContent>
    </Card>
  );
}
