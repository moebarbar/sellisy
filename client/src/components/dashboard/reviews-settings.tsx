import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, Trash2 } from "lucide-react";
import type { StoreReview } from "@shared/schema";

type ReviewWithMeta = StoreReview & { productTitle?: string | null };

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-500">
      {Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join("")}
    </span>
  );
}

export function ReviewsSettingsCard() {
  const { activeStore, activeStoreId } = useActiveStore();
  const { toast } = useToast();

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (activeStore) {
      setEnabled((activeStore as any).reviewsEnabled || false);
    }
  }, [activeStore]);

  const { data: reviews = [], isLoading } = useQuery<ReviewWithMeta[]>({
    queryKey: ["/api/stores", activeStoreId, "reviews"],
    enabled: !!activeStoreId && enabled,
  });

  const toggleMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      if (!activeStoreId) return;
      await apiRequest("PATCH", `/api/stores/${activeStoreId}`, { reviewsEnabled: newValue });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: variables ? "Reviews enabled" : "Reviews disabled" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!activeStoreId) return;
      await apiRequest("DELETE", `/api/stores/${activeStoreId}/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", activeStoreId, "reviews"] });
      toast({ title: "Review deleted" });
    },
    onError: (err: any) => toast({ title: "Failed to delete", description: err.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" /> Customer Reviews
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(val) => {
              setEnabled(val);
              toggleMutation.mutate(val);
            }}
            disabled={toggleMutation.isPending}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Let verified buyers leave star ratings and reviews for products they've purchased.
        </p>

        {enabled && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                No reviews yet — they'll appear here once buyers submit them.
              </p>
            ) : (
              reviews.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between p-3 border rounded-md group hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarDisplay rating={r.rating} />
                      {r.productTitle && (
                        <span className="text-xs text-muted-foreground truncate">· {r.productTitle}</span>
                      )}
                    </div>
                    {r.title && <p className="text-sm font-medium">{r.title}</p>}
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => deleteMutation.mutate(r.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
