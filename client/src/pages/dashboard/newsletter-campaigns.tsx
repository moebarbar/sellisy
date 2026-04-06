import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useActiveStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Mail, Trash2, Loader2, Pencil, Send, Calendar, Users } from "lucide-react";
import type { NewsletterCampaign } from "@shared/schema";

export default function NewsletterCampaignsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { activeStore } = useActiveStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NewsletterCampaign | null>(null);

  const { data: campaigns, isLoading } = useQuery<NewsletterCampaign[]>({
    queryKey: ["/api/newsletter-campaigns", activeStore?.id],
    queryFn: async () => {
      if (!activeStore) return [];
      const res = await fetch(`/api/stores/${activeStore.id}/newsletter-campaigns`, { credentials: "include" });
      return res.json();
    },
    enabled: !!activeStore,
  });

  const createMutation = useMutation({
    mutationFn: async (subject: string) => {
      const res = await apiRequest("POST", `/api/stores/${activeStore!.id}/newsletter-campaigns`, { subject: subject || "Untitled Campaign" });
      return res.json();
    },
    onSuccess: (campaign: NewsletterCampaign) => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-campaigns", activeStore?.id] });
      toast({ title: "Created", description: `Campaign created. Open it to add content.` });
      setShowCreate(false);
      setNewSubject("");
      navigate(`/dashboard/newsletter/${campaign.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/stores/${activeStore!.id}/newsletter-campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-campaigns", activeStore?.id] });
      toast({ title: "Deleted", description: "Campaign deleted." });
      setDeleteTarget(null);
    },
  });

  if (!activeStore) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Create a store first to use newsletter campaigns.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Newsletter Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and send email campaigns to your subscribers</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : !campaigns?.length ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first email campaign to reach your subscribers.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {campaign.status === "sent" ? (
                    <Send className="h-5 w-5 text-primary" />
                  ) : (
                    <Mail className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => campaign.status !== "sent" && navigate(`/dashboard/newsletter/${campaign.id}`)}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold truncate">{campaign.subject}</h3>
                    <Badge variant={campaign.status === "sent" ? "default" : "secondary"} className="text-xs flex-shrink-0 capitalize">
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                    {campaign.status === "sent" && campaign.recipientCount != null && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {campaign.recipientCount} recipients
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {campaign.status !== "sent" && (
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/newsletter/${campaign.id}`)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(campaign)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
            <DialogDescription>Enter the email subject line for your campaign.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Your newsletter subject..."
                onKeyDown={(e) => e.key === "Enter" && createMutation.mutate(newSubject)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(newSubject)} disabled={createMutation.isPending || !newSubject.trim()}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.subject}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
