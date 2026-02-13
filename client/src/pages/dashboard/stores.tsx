import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Store as StoreIcon, ExternalLink, Loader2 } from "lucide-react";
import type { Store } from "@shared/schema";

export default function StoresPage() {
  const { data: stores, isLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-stores-title">Stores</h1>
          <p className="text-muted-foreground mt-1">Manage your digital product storefronts.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-store">
              <Plus className="mr-2 h-4 w-4" />
              Create Store
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Store</DialogTitle>
              <DialogDescription>Set up your storefront in seconds.</DialogDescription>
            </DialogHeader>
            <CreateStoreForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stores && stores.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id} className="hover-elevate">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 text-primary">
                      <StoreIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight" data-testid={`text-store-name-${store.id}`}>
                        {store.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">/s/{store.slug}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {store.templateKey}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Link href={`/dashboard/stores/${store.id}`}>
                    <Button variant="outline" size="sm" data-testid={`button-manage-store-${store.id}`}>
                      Manage
                    </Button>
                  </Link>
                  <Link href={`/s/${store.slug}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-store-${store.id}`}>
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
              <StoreIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No stores yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Create your first store to start selling digital products.
            </p>
            <Button onClick={() => setOpen(true)} data-testid="button-empty-create-store">
              <Plus className="mr-2 h-4 w-4" />
              Create Store
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CreateStoreForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [template, setTemplate] = useState("neon");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/stores", { name, slug, templateKey: template });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Store created", description: `"${name}" is ready to go.` });
      onSuccess();
    },
    onError: (err: any) => {
      toast({ title: "Failed to create store", description: err.message, variant: "destructive" });
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="store-name">Store Name</Label>
        <Input
          id="store-name"
          data-testid="input-store-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="My Digital Store"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="store-slug">URL Slug</Label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground whitespace-nowrap">/s/</span>
          <Input
            id="store-slug"
            data-testid="input-store-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="my-store"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Template</Label>
        <Select value={template} onValueChange={setTemplate}>
          <SelectTrigger data-testid="select-template">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="neon">Neon — Bold & Modern</SelectItem>
            <SelectItem value="silk">Silk — Elegant & Minimal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending || !name || !slug}
        data-testid="button-submit-store"
      >
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Store
      </Button>
    </form>
  );
}
