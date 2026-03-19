import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useActiveStore } from "@/lib/store-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, HelpCircle, Plus, Trash2, Pencil, X } from "lucide-react";
import type { StoreFaq } from "@shared/schema";

export function FaqSettingsCard() {
  const { activeStore, activeStoreId } = useActiveStore();
  const { toast } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (activeStore) {
      setEnabled((activeStore as any).faqEnabled || false);
    }
  }, [activeStore]);

  const { data: faqs = [], isLoading } = useQuery<StoreFaq[]>({
    queryKey: ["/api/stores", activeStoreId, "faqs"],
    enabled: !!activeStoreId && enabled,
  });

  const toggleMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      if (!activeStoreId) return;
      await apiRequest("PATCH", `/api/stores/${activeStoreId}`, { faqEnabled: newValue });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: variables ? "FAQ enabled" : "FAQ disabled" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeStoreId) return;
      await apiRequest("POST", `/api/stores/${activeStoreId}/faqs`, {
        question, answer, sortOrder: faqs.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", activeStoreId, "faqs"] });
      toast({ title: "FAQ added" });
      resetForm();
    },
    onError: (err: any) => toast({ title: "Failed to add", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!activeStoreId) return;
      await apiRequest("PATCH", `/api/stores/${activeStoreId}/faqs/${id}`, {
        question, answer,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", activeStoreId, "faqs"] });
      toast({ title: "FAQ updated" });
      resetForm();
    },
    onError: (err: any) => toast({ title: "Failed to update", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!activeStoreId) return;
      await apiRequest("DELETE", `/api/stores/${activeStoreId}/faqs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", activeStoreId, "faqs"] });
      toast({ title: "FAQ deleted" });
    },
  });

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (f: StoreFaq) => {
    setQuestion(f.question);
    setAnswer(f.answer);
    setEditingId(f.id);
    setIsAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> Frequently Asked Questions
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
          Reduce support inquiries by answering common customer questions right on your storefront.
        </p>

        {enabled && (
          <div className="space-y-4">
            {!isAdding && !editingId && (
              <Button variant="outline" className="w-full border-dashed" onClick={() => setIsAdding(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add FAQ
              </Button>
            )}

            {(isAdding || editingId) && (
              <div className="rounded-md border border-border p-4 space-y-4 bg-muted/20 relative">
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
                <h4 className="font-medium text-sm">{editingId ? "Edit FAQ" : "New FAQ"}</h4>
                
                <div className="space-y-2">
                  <Label>Question *</Label>
                  <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Do I get lifetime access?" />
                </div>

                <div className="space-y-2">
                  <Label>Answer *</Label>
                  <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} placeholder="Provide a helpful, concise answer." />
                </div>

                <Button 
                  disabled={!question || !answer || createMutation.isPending || updateMutation.isPending} 
                  onClick={() => editingId ? updateMutation.mutate(editingId) : createMutation.mutate()}
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Save Changes" : "Add FAQ"}
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : faqs.length > 0 ? (
              <div className="space-y-3">
                {faqs.map((f) => (
                  <div key={f.id} className="flex items-start justify-between p-3 border rounded-md group hover:border-primary/50 transition-colors">
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-medium">{f.question}</p>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{f.answer}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(f)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.mutate(f.id)} disabled={deleteMutation.isPending}>
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
