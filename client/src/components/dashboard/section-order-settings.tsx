import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LayoutList, ArrowUp, ArrowDown } from "lucide-react";

export const DEFAULT_SECTION_ORDER = [
  "hero",
  "about",
  "products",
  "testimonials",
  "reviews",
  "bundles",
  "faq",
  "newsletter",
  "blog",
];

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Banner",
  about: "About / Story",
  products: "Products Grid",
  testimonials: "Testimonials",
  reviews: "Customer Reviews",
  bundles: "Bundles",
  faq: "FAQ",
  newsletter: "Newsletter Signup",
  blog: "Blog Posts",
};

export function SectionOrderSettingsCard() {
  const { activeStore, activeStoreId } = useActiveStore();
  const { toast } = useToast();

  const [order, setOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);

  useEffect(() => {
    if (activeStore && (activeStore as any).sectionOrder) {
      try {
        const savedOrder = JSON.parse((activeStore as any).sectionOrder);
        if (Array.isArray(savedOrder) && savedOrder.length > 0) {
          // Merge in case we added new sections that aren't in their saved order
          const missing = DEFAULT_SECTION_ORDER.filter(s => !savedOrder.includes(s));
          setOrder([...savedOrder, ...missing]);
        }
      } catch (e) {
        setOrder(DEFAULT_SECTION_ORDER);
      }
    }
  }, [activeStore]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeStoreId) return;
      await apiRequest("PATCH", `/api/stores/${activeStoreId}`, {
        sectionOrder: JSON.stringify(order),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Section layout saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save layout", description: err.message, variant: "destructive" });
    },
  });

  let currentSavedOrder: string[] = DEFAULT_SECTION_ORDER;
  try {
    if ((activeStore as any)?.sectionOrder) {
      currentSavedOrder = JSON.parse((activeStore as any).sectionOrder);
    }
  } catch {
    // ignore malformed JSON
  }
  const hasChanges = JSON.stringify(order) !== JSON.stringify(currentSavedOrder);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setOrder(newOrder);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <LayoutList className="h-4 w-4" /> Storefront Layout
        </CardTitle>
        <CardDescription>
          Use the arrows to reorder how sections appear on your storefront.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 border rounded-md p-2 bg-muted/20">
          {order.map((sectionKey, index) => (
            <div 
              key={sectionKey} 
              className="flex items-center justify-between p-3 bg-background border rounded-md shadow-sm"
            >
              <div className="font-medium text-sm">
                {SECTION_LABELS[sectionKey] || sectionKey}
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  disabled={index === 0}
                  onClick={() => moveUp(index)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  disabled={index === order.length - 1}
                  onClick={() => moveDown(index)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          disabled={!hasChanges || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Layout Order
        </Button>
      </CardContent>
    </Card>
  );
}
