import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Plus, Trash2, Percent, DollarSign, Store } from "lucide-react";
import type { Coupon } from "@shared/schema";

export default function CouponsPage() {
  const { activeStore, activeStoreId, storesLoading } = useActiveStore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/coupons", activeStoreId],
    enabled: !!activeStoreId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons", activeStoreId] });
      toast({ title: "Coupon deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete coupon", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/coupons/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons", activeStoreId] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update coupon", description: err.message, variant: "destructive" });
    },
  });

  if (!storesLoading && !activeStoreId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
              <Store className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No store selected</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Use the store switcher at the top to select or create a store.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-coupons-title">Coupons</h1>
          <p className="text-muted-foreground mt-1">Discount codes for {activeStore?.name}.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-coupon">
              <Plus className="mr-2 h-4 w-4" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Coupon</DialogTitle>
              <DialogDescription>Create a discount code for your customers.</DialogDescription>
            </DialogHeader>
            <CreateCouponForm storeId={activeStoreId} onSuccess={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-10" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : coupons && coupons.length > 0 ? (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <Card key={coupon.id} data-testid={`card-coupon-${coupon.id}`}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-mono font-bold" data-testid={`text-coupon-code-${coupon.id}`}>{coupon.code}</h3>
                    <Badge variant="secondary">
                      {coupon.discountType === "PERCENT" ? (
                        <><Percent className="h-3 w-3 mr-1" />{coupon.discountValue}% off</>
                      ) : (
                        <><DollarSign className="h-3 w-3 mr-1" />${(coupon.discountValue / 100).toFixed(2)} off</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {coupon.currentUses}{coupon.maxUses ? `/${coupon.maxUses}` : ""} uses
                    {coupon.expiresAt && ` · Expires ${new Date(coupon.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={coupon.isActive ? "default" : "secondary"}>
                    {coupon.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Switch
                    checked={coupon.isActive}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: coupon.id, isActive: checked })
                    }
                    disabled={toggleMutation.isPending}
                    data-testid={`switch-coupon-active-${coupon.id}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(coupon.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-coupon-${coupon.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-3">
              <Ticket className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No coupons yet</h3>
            <p className="text-sm text-muted-foreground">
              Create discount codes to attract more customers.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CreateCouponForm({ storeId, onSuccess }: { storeId: string; onSuccess: () => void }) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/coupons", {
        storeId,
        code: code.toUpperCase(),
        discountType,
        discountValue: discountType === "PERCENT" ? parseInt(discountValue) : Math.round(parseFloat(discountValue) * 100),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons", storeId] });
      toast({ title: "Coupon created" });
      onSuccess();
    },
    onError: (err: any) => {
      toast({ title: "Failed to create coupon", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="coupon-code">Coupon Code</Label>
        <Input
          id="coupon-code"
          placeholder="e.g. SAVE20"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          data-testid="input-coupon-code"
        />
      </div>
      <div className="space-y-2">
        <Label>Discount Type</Label>
        <Select value={discountType} onValueChange={(v) => setDiscountType(v as "PERCENT" | "FIXED")}>
          <SelectTrigger data-testid="select-coupon-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PERCENT">Percentage (%)</SelectItem>
            <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="coupon-value">
          {discountType === "PERCENT" ? "Discount (%)" : "Discount Amount ($)"}
        </Label>
        <Input
          id="coupon-value"
          type="number"
          min="1"
          max={discountType === "PERCENT" ? "100" : undefined}
          step={discountType === "PERCENT" ? "1" : "0.01"}
          placeholder={discountType === "PERCENT" ? "20" : "5.00"}
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          data-testid="input-coupon-value"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coupon-max-uses">Max Uses (optional)</Label>
        <Input
          id="coupon-max-uses"
          type="number"
          min="1"
          placeholder="Unlimited"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          data-testid="input-coupon-max-uses"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coupon-expires">Expiration Date (optional)</Label>
        <Input
          id="coupon-expires"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          data-testid="input-coupon-expires"
        />
      </div>
      <Button
        className="w-full"
        disabled={!code.trim() || !discountValue || parseFloat(discountValue) <= 0 || createMutation.isPending}
        onClick={() => createMutation.mutate()}
        data-testid="button-submit-coupon"
      >
        {createMutation.isPending ? "Creating..." : "Create Coupon"}
      </Button>
    </div>
  );
}
