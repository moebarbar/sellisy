import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquareQuote, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { ImageUploadField } from "./image-upload-field";
import type { StoreTestimonial } from "@shared/schema";

export function TestimonialsSettingsCard() {
  const { activeStore, activeStoreId } = useActiveStore();
  const { toast } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (activeStore) {
      setEnabled((activeStore as any).testimonialsEnabled || false);
    }
  }, [activeStore]);

  const { data: testimonials = [], isLoading } = useQuery<StoreTestimonial[]>({
    queryKey: ["/api/stores", activeStoreId, "testimonials"],
    enabled: !!activeStoreId && enabled,
  });

  const toggleMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      if (!activeStoreId) return;
      await apiRequest("PATCH", `/api/stores/${activeStoreId}`, { testimonialsEnabled: newValue });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: variables ? "Testimonials enabled" : "Testimonials disabled" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeStoreId) return;
      await apiRequest("POST", `/api/stores/${activeStoreId}/testimonials`, {
        name, role: role || null, quote, avatarUrl: avatarUrl || null, sortOrder: testimonials.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", activeStoreId, "testimonials"] });
      toast({ title: "Testimonial added" });
      resetForm();
    },
    onError: (err: any) => toast({ title: "Failed to add", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!activeStoreId) return;
      await apiRequest("PATCH", `/api/stores/${activeStoreId}/testimonials/${id}`, {
        name, role: role || null, quote, avatarUrl: avatarUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", activeStoreId, "testimonials"] });
      toast({ title: "Testimonial updated" });
      resetForm();
    },
    onError: (err: any) => toast({ title: "Failed to update", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!activeStoreId) return;
      await apiRequest("DELETE", `/api/stores/${activeStoreId}/testimonials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", activeStoreId, "testimonials"] });
      toast({ title: "Testimonial deleted" });
    },
  });

  const resetForm = () => {
    setName("");
    setRole("");
    setQuote("");
    setAvatarUrl("");
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (t: StoreTestimonial) => {
    setName(t.name);
    setRole(t.role || "");
    setQuote(t.quote);
    setAvatarUrl(t.avatarUrl || "");
    setEditingId(t.id);
    setIsAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4" /> Testimonials
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
          Show customer reviews to build trust and increase sales.
        </p>

        {enabled && (
          <div className="space-y-4">
            {!isAdding && !editingId && (
              <Button variant="outline" className="w-full border-dashed" onClick={() => setIsAdding(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Testimonial
              </Button>
            )}

            {(isAdding || editingId) && (
              <div className="rounded-md border border-border p-4 space-y-4 bg-muted/20 relative">
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
                <h4 className="font-medium text-sm">{editingId ? "Edit Testimonial" : "New Testimonial"}</h4>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role / Title (Optional)</Label>
                    <Input placeholder="e.g. Creator, Developer" value={role} onChange={(e) => setRole(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quote *</Label>
                  <Textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={3} />
                </div>

                <div className="space-y-2">
                  <Label>Avatar Image (Optional)</Label>
                  <ImageUploadField
                    label=""
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    aspectHint="Square photo recommended."
                    previewClass="w-16 h-16 rounded-full"
                    testIdPrefix="testimonial-avatar"
                  />
                </div>

                <Button 
                  disabled={!name || !quote || createMutation.isPending || updateMutation.isPending} 
                  onClick={() => editingId ? updateMutation.mutate(editingId) : createMutation.mutate()}
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Save Changes" : "Add Testimonial"}
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : testimonials.length > 0 ? (
              <div className="space-y-3">
                {testimonials.map((t) => (
                  <div key={t.id} className="flex items-start justify-between p-3 border rounded-md group hover:border-primary/50 transition-colors">
                    <div className="flex items-start gap-3">
                      {t.avatarUrl ? (
                        <img src={t.avatarUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{t.name} <span className="text-muted-foreground font-normal text-xs">{t.role}</span></p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 italic">"{t.quote}"</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.mutate(t.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
