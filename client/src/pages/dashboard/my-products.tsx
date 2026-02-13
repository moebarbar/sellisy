import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { Plus, Package, Trash2, Pencil, Upload, Link as LinkIcon, Loader2, FileIcon, Image as ImageIcon, Download, Star, X } from "lucide-react";
import type { Product, Store, ProductImage, Category } from "@shared/schema";

export default function MyProductsPage() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: userCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [importProduct, setImportProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/mine"],
  });

  const { data: stores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/mine"] });
      toast({ title: "Product deleted" });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-my-products-title">My Products</h1>
          <p className="text-muted-foreground mt-1">Create and manage your own digital products.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="button-create-product">
          <Plus className="mr-2 h-4 w-4" />
          Create Product
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={activeCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory("all")}
          data-testid="button-my-category-all"
        >
          All
        </Button>
        {(userCategories || []).map((cat) => (
          <Button
            key={cat.slug}
            variant={activeCategory === cat.slug ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat.slug)}
            data-testid={`button-my-category-${cat.slug}`}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="aspect-square w-full rounded-t-md" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} data-testid={`card-product-${product.id}`}>
              <CardContent className="p-0">
                <ProductCardImage product={product} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold leading-tight" data-testid={`text-my-product-title-${product.id}`}>
                      {product.title}
                    </h3>
                    <Badge variant="secondary" className="shrink-0">
                      ${(product.priceCents / 100).toFixed(2)}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs mb-2 capitalize">{product.category}</Badge>
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                  )}
                  {product.fileUrl && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <FileIcon className="h-3 w-3" />
                      <span>File attached</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditProduct(product)}
                      data-testid={`button-edit-${product.id}`}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImportProduct(product)}
                      data-testid={`button-import-to-store-${product.id}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(product)}
                      data-testid={`button-delete-${product.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No products yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first digital product to sell in your stores.
            </p>
            <Button onClick={() => setCreateOpen(true)} data-testid="button-create-product-empty">
              <Plus className="mr-2 h-4 w-4" />
              Create Product
            </Button>
          </CardContent>
        </Card>
      )}

      <ProductFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="create"
        categories={userCategories || []}
      />

      <ProductFormDialog
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        mode="edit"
        product={editProduct || undefined}
        categories={userCategories || []}
      />

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This will also remove it from any stores that imported it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ImportToStoreDialog
        product={importProduct}
        stores={stores || []}
        onClose={() => setImportProduct(null)}
      />
    </div>
  );
}

function ImportToStoreDialog({
  product,
  stores,
  onClose,
}: {
  product: Product | null;
  stores: Store[];
  onClose: () => void;
}) {
  const [storeId, setStoreId] = useState("");
  const { toast } = useToast();

  const effectiveStoreId = storeId || (stores.length === 1 ? stores[0].id : "");

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/store-products", {
        storeId: effectiveStoreId,
        productId: product!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", effectiveStoreId] });
      toast({
        title: "Product imported to store",
        description: `"${product?.title}" has been added to your store.`,
      });
      onClose();
      setStoreId("");
    },
    onError: (err: any) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import to Store</DialogTitle>
          <DialogDescription>
            Choose which store to add "{product?.title}" to.
          </DialogDescription>
        </DialogHeader>
        {stores.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You need to create a store first before importing products.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-4"
          >
            <Select value={effectiveStoreId} onValueChange={setStoreId}>
              <SelectTrigger data-testid="select-import-store">
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || !effectiveStoreId}
              data-testid="button-confirm-import-to-store"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Product
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductCardImage({ product }: { product: Product }) {
  const { data: productImages } = useQuery<ProductImage[]>({
    queryKey: ["/api/products", product.id, "images"],
  });

  const imageCount = productImages?.length || 0;
  const displayUrl = product.thumbnailUrl;

  return (
    <div className="relative aspect-square bg-muted overflow-hidden rounded-t-md">
      {displayUrl ? (
        <img
          src={displayUrl}
          alt={product.title}
          className="w-full h-full object-cover"
          data-testid={`img-my-product-${product.id}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Package className="h-12 w-12 text-muted-foreground/40" />
        </div>
      )}
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        {imageCount > 1 && (
          <Badge variant="secondary" className="text-[10px]" data-testid={`badge-image-count-${product.id}`}>
            <ImageIcon className="h-3 w-3 mr-1" />
            {imageCount}
          </Badge>
        )}
        <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"} data-testid={`badge-status-${product.id}`}>
          {product.status}
        </Badge>
      </div>
    </div>
  );
}

function CategorySelector({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (v: string) => void;
  categories: Category[];
}) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/categories", { name });
      return res.json();
    },
    onSuccess: (cat: Category) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      onChange(cat.slug);
      setAdding(false);
      setNewName("");
      toast({ title: "Category created" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create category", description: err.message, variant: "destructive" });
    },
  });

  if (adding) {
    return (
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Category name"
          className="flex-1"
          autoFocus
          data-testid="input-new-category"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              e.preventDefault();
              addMutation.mutate(newName.trim());
            }
            if (e.key === "Escape") setAdding(false);
          }}
        />
        <Button
          size="sm"
          onClick={() => newName.trim() && addMutation.mutate(newName.trim())}
          disabled={!newName.trim() || addMutation.isPending}
          data-testid="button-save-category"
        >
          {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewName(""); }}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1" data-testid="select-product-category">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.slug} value={cat.slug} data-testid={`option-category-${cat.slug}`}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="icon" variant="outline" onClick={() => setAdding(true)} data-testid="button-add-category">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface ImageEntry {
  url: string;
  isPrimary: boolean;
}

function ProductFormDialog({
  open,
  onClose,
  mode,
  product,
  categories: userCategories,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  product?: Product;
  categories: Category[];
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("templates");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [fileUrl, setFileUrl] = useState("");
  const [fileDelivery, setFileDelivery] = useState<"upload" | "url">("upload");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE">("ACTIVE");
  const [imageUploading, setImageUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile } = useUpload();

  const { data: existingImages } = useQuery<ProductImage[]>({
    queryKey: ["/api/products", product?.id, "images"],
    enabled: mode === "edit" && !!product?.id && open,
  });

  const resetForm = () => {
    if (mode === "edit" && product) {
      setTitle(product.title);
      setDescription(product.description || "");
      setCategory(product.category);
      setPrice((product.priceCents / 100).toFixed(2));
      setOriginalPrice(product.originalPriceCents ? (product.originalPriceCents / 100).toFixed(2) : "");
      setFileUrl(product.fileUrl || "");
      setFileDelivery(product.fileUrl?.startsWith("/objects/") ? "upload" : product.fileUrl ? "url" : "upload");
      setStatus(product.status);
    } else {
      setTitle("");
      setDescription("");
      setCategory(userCategories[0]?.slug || "templates");
      setPrice("");
      setOriginalPrice("");
      setImages([]);
      setFileUrl("");
      setFileDelivery("upload");
      setStatus("ACTIVE");
    }
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, product]);

  useEffect(() => {
    if (mode === "edit" && existingImages && existingImages.length > 0) {
      setImages(existingImages.map((img) => ({ url: img.url, isPrimary: img.isPrimary })));
    } else if (mode === "edit" && product && existingImages && existingImages.length === 0 && product.thumbnailUrl) {
      setImages([{ url: product.thumbnailUrl, isPrimary: true }]);
    }
  }, [existingImages, mode, product]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      resetForm();
    } else {
      onClose();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImageUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const result = await uploadFile(files[i]);
        if (result) {
          setImages((prev) => {
            const isFirst = prev.length === 0;
            return [...prev, { url: result.objectPath, isPrimary: isFirst }];
          });
        }
      }
    } catch {
      toast({ title: "Image upload failed", variant: "destructive" });
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === index }))
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploading(true);
    try {
      const result = await uploadFile(file);
      if (result) {
        setFileUrl(result.objectPath);
      }
    } catch {
      toast({ title: "File upload failed", variant: "destructive" });
    } finally {
      setFileUploading(false);
    }
  };

  const buildImagesPayload = () => {
    return images.map((img, i) => ({
      url: img.url,
      sortOrder: i,
      isPrimary: img.isPrimary,
    }));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const priceCents = Math.round(parseFloat(price) * 100);
      const origPriceCents = originalPrice ? Math.round(parseFloat(originalPrice) * 100) : null;
      const body: any = {
        title,
        description: description || null,
        category,
        priceCents,
        originalPriceCents: origPriceCents,
        fileUrl: fileUrl || null,
        status,
        images: buildImagesPayload(),
      };
      await apiRequest("POST", "/api/products", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/mine"] });
      toast({ title: "Product created" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Failed to create product", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const priceCents = Math.round(parseFloat(price) * 100);
      const origPriceCents = originalPrice ? Math.round(parseFloat(originalPrice) * 100) : null;
      const body: any = {
        title,
        description: description || null,
        category,
        priceCents,
        originalPriceCents: origPriceCents,
        fileUrl: fileUrl || null,
        status,
        images: buildImagesPayload(),
      };
      await apiRequest("PATCH", `/api/products/${product!.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", product!.id, "images"] });
      toast({ title: "Product updated" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Failed to update product", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return;
    if (mode === "create") {
      createMutation.mutate();
    } else {
      updateMutation.mutate();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-product-form-title">
            {mode === "create" ? "Create Product" : "Edit Product"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Fill in the details for your new digital product."
              : "Update the details for your product."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="My Awesome Product"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-testid="input-product-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your product..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="input-product-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <CategorySelector
                value={category}
                onChange={setCategory}
                categories={userCategories}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "DRAFT" | "ACTIVE")}>
                <SelectTrigger data-testid="select-product-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="9.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                data-testid="input-product-price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price ($)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="19.99"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                data-testid="input-product-original-price"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Images <span className="text-xs text-muted-foreground">(Square, 512px or 1024px recommended)</span></Label>
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2" data-testid="grid-product-images">
                {images.map((img, index) => (
                  <div
                    key={`${img.url}-${index}`}
                    className={`relative aspect-square rounded-md overflow-hidden bg-muted border-2 group ${img.isPrimary ? "border-primary" : "border-transparent"}`}
                    data-testid={`image-preview-${index}`}
                  >
                    <img src={img.url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-white"
                        onClick={() => setPrimaryImage(index)}
                        data-testid={`button-set-primary-${index}`}
                      >
                        <Star className={`h-4 w-4 ${img.isPrimary ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-white"
                        onClick={() => removeImage(index)}
                        data-testid={`button-remove-image-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {img.isPrimary && (
                      <div className="absolute top-1 left-1">
                        <Badge variant="default" className="text-[10px] px-1 py-0">Cover</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUploading}
                data-testid="button-add-images"
              >
                {imageUploading ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-3.5 w-3.5" />
                )}
                {imageUploading ? "Uploading..." : "Add Images"}
              </Button>
              <span className="text-xs text-muted-foreground">
                {images.length} image{images.length !== 1 ? "s" : ""} added
              </span>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              data-testid="input-image-upload"
            />
          </div>

          <div className="space-y-3">
            <Label>Product File</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={fileDelivery === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => { setFileDelivery("upload"); setFileUrl(""); }}
                data-testid="button-file-upload-mode"
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                Upload File
              </Button>
              <Button
                type="button"
                variant={fileDelivery === "url" ? "default" : "outline"}
                size="sm"
                onClick={() => { setFileDelivery("url"); setFileUrl(""); }}
                data-testid="button-file-url-mode"
              >
                <LinkIcon className="mr-2 h-3.5 w-3.5" />
                External URL
              </Button>
            </div>

            {fileDelivery === "upload" ? (
              <div className="space-y-1">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={fileUploading}
                  data-testid="input-file-upload"
                />
                {fileUploading && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}
                {fileUrl && fileDelivery === "upload" && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <FileIcon className="h-3 w-3" />
                    <span>File uploaded successfully</span>
                  </div>
                )}
              </div>
            ) : (
              <Input
                type="url"
                placeholder="https://example.com/my-file.zip"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                data-testid="input-file-url"
              />
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending || !title.trim() || !price} data-testid="button-submit-product">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Product" : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
