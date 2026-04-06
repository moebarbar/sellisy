import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Loader2 } from "lucide-react";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function ConversionSettingsCard() {
  const { activeStore, activeStoreId } = useActiveStore();
  const { toast } = useToast();

  const [showRatingsOnCards, setShowRatingsOnCards] = useState(true);
  const [showDiscountBadges, setShowDiscountBadges] = useState(true);
  const [showSubscriberCount, setShowSubscriberCount] = useState(false);

  useEffect(() => {
    if (activeStore) {
      const s = activeStore as any;
      setShowRatingsOnCards(s.showRatingsOnCards ?? true);
      setShowDiscountBadges(s.showDiscountBadges ?? true);
      setShowSubscriberCount(s.showSubscriberCount ?? false);
    }
  }, [activeStore]);

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, boolean>) => {
      await apiRequest("PATCH", `/api/stores/${activeStoreId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", activeStoreId] });
      toast({ title: "Saved", description: "Conversion settings updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  const handleSave = () => {
    saveMutation.mutate({ showRatingsOnCards, showDiscountBadges, showSubscriberCount });
  };

  if (!activeStoreId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Conversion Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-xs text-muted-foreground">
          Control which social-proof and trust signals appear on your storefront to help convert visitors into buyers.
        </p>

        <div className="space-y-4">
          <ToggleRow
            label="Star ratings on product cards"
            description="Show average star rating and review count on each product card. Requires Reviews to be enabled."
            checked={showRatingsOnCards}
            onChange={setShowRatingsOnCards}
          />
          <ToggleRow
            label="Discount badges"
            description="Show sale / discount percentage badges on products that have an original price set."
            checked={showDiscountBadges}
            onChange={setShowDiscountBadges}
          />
          <ToggleRow
            label="Subscriber count in newsletter section"
            description='Show "Join X+ subscribers" in your newsletter sign-up section to add social proof.'
            checked={showSubscriberCount}
            onChange={setShowSubscriberCount}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          size="sm"
          className="w-full"
        >
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Conversion Settings
        </Button>
      </CardContent>
    </Card>
  );
}
