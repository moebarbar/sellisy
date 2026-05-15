import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { useActiveStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Send,
  Users,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  ImageIcon,
  Link as LinkIcon,
  Quote,
  AlertCircle,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { NewsletterCampaign, NewsletterCampaignBlock, NewsletterSubscriber } from "@shared/schema";

type BlockType = "text" | "heading1" | "heading2" | "heading3" | "image" | "link" | "quote" | "callout" | "divider";

const BLOCK_TYPES: { type: BlockType; label: string; icon: any; hint?: string }[] = [
  { type: "text", label: "Paragraph", icon: Type },
  { type: "heading1", label: "Heading 1", icon: Heading1 },
  { type: "heading2", label: "Heading 2", icon: Heading2 },
  { type: "heading3", label: "Heading 3", icon: Heading3 },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "image", label: "Image URL", icon: ImageIcon, hint: "Paste an image URL" },
  { type: "link", label: "Button/Link", icon: LinkIcon, hint: "Format: Label|https://url.com" },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "callout", label: "Callout Box", icon: AlertCircle },
];

function blockPlaceholder(type: BlockType): string {
  switch (type) {
    case "heading1": return "Heading 1...";
    case "heading2": return "Heading 2...";
    case "heading3": label: return "Heading 3...";
    case "image": return "https://example.com/image.jpg";
    case "link": return "Button label|https://link-url.com";
    case "quote": return "Quoted text...";
    case "callout": return "Important note or callout text...";
    case "divider": return "(divider — no text needed)";
    default: return "Write something...";
  }
}

export default function NewsletterCampaignEditorPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/dashboard/newsletter/:id");
  const campaignId = params?.id;
  const { toast } = useToast();
  const { activeStore } = useActiveStore();

  const [subject, setSubject] = useState("");
  const [subjectSaved, setSubjectSaved] = useState(true);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  const { data: campaign, isLoading: loadingCampaign } = useQuery<NewsletterCampaign>({
    queryKey: ["/api/newsletter-campaigns", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/stores/${activeStore!.id}/newsletter-campaigns`, { credentials: "include" });
      const campaigns: NewsletterCampaign[] = await res.json();
      return campaigns.find(c => c.id === campaignId)!;
    },
    enabled: !!activeStore && !!campaignId,
  });

  const { data: blocks, isLoading: loadingBlocks } = useQuery<NewsletterCampaignBlock[]>({
    queryKey: ["/api/newsletter-campaign-blocks", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/stores/${activeStore!.id}/newsletter-campaigns/${campaignId}/blocks`, { credentials: "include" });
      return res.json();
    },
    enabled: !!activeStore && !!campaignId,
  });

  const { data: subscribers } = useQuery<NewsletterSubscriber[]>({
    queryKey: ["/api/newsletter-subscribers-count", activeStore?.id],
    queryFn: async () => {
      // We don't have a list endpoint — use the subscriber count from store or approximate
      return [];
    },
    enabled: false, // subscribers count will come from send response
  });

  useEffect(() => {
    if (campaign) {
      setSubject(campaign.subject);
      setSubjectSaved(true);
    }
  }, [campaign]);

  const updateSubjectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/stores/${activeStore!.id}/newsletter-campaigns/${campaignId}`, { subject });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-campaigns", campaignId] });
      setSubjectSaved(true);
      toast({ title: "Subject saved" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addBlockMutation = useMutation({
    mutationFn: async (type: BlockType) => {
      const existingBlocks = blocks || [];
      const maxOrder = existingBlocks.length > 0 ? Math.max(...existingBlocks.map(b => b.sortOrder)) : -1;
      const res = await apiRequest("POST", `/api/stores/${activeStore!.id}/newsletter-campaigns/${campaignId}/blocks`, {
        type,
        content: "",
        sortOrder: maxOrder + 1,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-campaign-blocks", campaignId] });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await apiRequest("PATCH", `/api/stores/${activeStore!.id}/newsletter-campaigns/${campaignId}/blocks/${id}`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-campaign-blocks", campaignId] });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/stores/${activeStore!.id}/newsletter-campaigns/${campaignId}/blocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-campaign-blocks", campaignId] });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const moveBlockMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const sorted = [...(blocks || [])].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = sorted.findIndex(b => b.id === id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      const aOrder = sorted[idx].sortOrder;
      const bOrder = sorted[swapIdx].sortOrder;
      await Promise.all([
        apiRequest("PATCH", `/api/stores/${activeStore!.id}/newsletter-campaigns/${campaignId}/blocks/${sorted[idx].id}`, { sortOrder: bOrder }),
        apiRequest("PATCH", `/api/stores/${activeStore!.id}/newsletter-campaigns/${campaignId}/blocks/${sorted[swapIdx].id}`, { sortOrder: aOrder }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-campaign-blocks", campaignId] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/stores/${activeStore!.id}/newsletter-campaigns/${campaignId}/send`, {});
      return res.json();
    },
    onSuccess: (data: { sent: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-campaigns", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-campaigns", activeStore?.id] });
      toast({ title: "Campaign sent!", description: `Delivered to ${data.sent} subscribers.` });
      setShowSendConfirm(false);
      navigate("/dashboard/newsletter");
    },
    onError: (err: Error) => {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
      setShowSendConfirm(false);
    },
  });

  const isSent = campaign?.status === "sent";
  const sortedBlocks = [...(blocks || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  if (!activeStore || loadingCampaign) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Campaign not found.</p>
        <Button variant="ghost" onClick={() => navigate("/dashboard/newsletter")}>Back to Campaigns</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/newsletter")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold truncate">{campaign.subject}</h1>
            <Badge variant={isSent ? "default" : "secondary"} className="capitalize">{campaign.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {isSent ? `Sent to ${campaign.recipientCount} subscribers on ${new Date(campaign.sentAt!).toLocaleDateString()}` : "Draft — edit below and send when ready"}
          </p>
        </div>
        {!isSent && (
          <Button onClick={() => setShowSendConfirm(true)}>
            <Send className="h-4 w-4 mr-2" /> Send Campaign
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Subject */}
          {!isSent && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <label className="text-sm font-medium">Subject Line</label>
                <div className="flex gap-2">
                  <Input
                    value={subject}
                    onChange={(e) => { setSubject(e.target.value); setSubjectSaved(false); }}
                    placeholder="Email subject..."
                    disabled={isSent}
                  />
                  <Button
                    variant="outline"
                    onClick={() => updateSubjectMutation.mutate()}
                    disabled={subjectSaved || updateSubjectMutation.isPending || !subject.trim()}
                  >
                    {updateSubjectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blocks */}
          <div className="space-y-3">
            {loadingBlocks ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : sortedBlocks.length === 0 && !isSent ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">No content yet. Add a block below to get started.</p>
                </CardContent>
              </Card>
            ) : (
              sortedBlocks.map((block, idx) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  isFirst={idx === 0}
                  isLast={idx === sortedBlocks.length - 1}
                  readOnly={isSent}
                  onContentChange={(content) => updateBlockMutation.mutate({ id: block.id, content })}
                  onDelete={() => deleteBlockMutation.mutate(block.id)}
                  onMoveUp={() => moveBlockMutation.mutate({ id: block.id, direction: "up" })}
                  onMoveDown={() => moveBlockMutation.mutate({ id: block.id, direction: "down" })}
                />
              ))
            )}
          </div>

          {/* Add block */}
          {!isSent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full" disabled={addBlockMutation.isPending}>
                  {addBlockMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Block
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {BLOCK_TYPES.map(bt => (
                  <DropdownMenuItem key={bt.type} onClick={() => addBlockMutation.mutate(bt.type)}>
                    <bt.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{bt.label}</div>
                      {bt.hint && <div className="text-xs text-muted-foreground">{bt.hint}</div>}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>This campaign will be sent to all newsletter subscribers of your store.</p>
              {isSent && campaign.recipientCount != null && (
                <p className="font-semibold text-foreground">{campaign.recipientCount} subscribers received this.</p>
              )}
              {!isSent && (
                <Button className="w-full mt-2" onClick={() => setShowSendConfirm(true)}>
                  <Send className="h-4 w-4 mr-2" /> Send Now
                </Button>
              )}
            </CardContent>
          </Card>

          {isSent && campaign.sentAt && (
            <Card>
              <CardContent className="p-4 text-sm space-y-1">
                <p className="font-medium">Sent</p>
                <p className="text-muted-foreground">{new Date(campaign.sentAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Send confirmation dialog */}
      <Dialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Campaign</DialogTitle>
            <DialogDescription>
              This will send "{campaign.subject}" to all your newsletter subscribers. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowSendConfirm(false)}>Cancel</Button>
            <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send to All Subscribers
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BlockEditor({
  block,
  isFirst,
  isLast,
  readOnly,
  onContentChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  block: NewsletterCampaignBlock;
  isFirst: boolean;
  isLast: boolean;
  readOnly: boolean;
  onContentChange: (content: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [localContent, setLocalContent] = useState(block.content);
  const [saved, setSaved] = useState(true);
  const blockType = block.type as BlockType;

  useEffect(() => {
    setLocalContent(block.content);
    setSaved(true);
  }, [block.content]);

  const handleBlur = () => {
    if (!saved) {
      onContentChange(localContent);
      setSaved(true);
    }
  };

  const blockLabel = BLOCK_TYPES.find(bt => bt.type === blockType)?.label ?? block.type;
  const BlockIcon = BLOCK_TYPES.find(bt => bt.type === blockType)?.icon ?? Type;

  return (
    <Card className="group">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BlockIcon className="h-3.5 w-3.5" />
            <span>{blockLabel}</span>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isFirst} onClick={onMoveUp}>
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isLast} onClick={onMoveDown}>
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        {blockType === "divider" ? (
          <hr className="border-border" />
        ) : (
          <Textarea
            value={localContent}
            onChange={(e) => { setLocalContent(e.target.value); setSaved(false); }}
            onBlur={handleBlur}
            placeholder={blockPlaceholder(blockType)}
            disabled={readOnly}
            rows={blockType === "text" || blockType === "quote" || blockType === "callout" ? 3 : 1}
            className={blockType === "heading1" ? "text-2xl font-bold" : blockType === "heading2" ? "text-xl font-semibold" : blockType === "heading3" ? "text-lg font-medium" : "text-sm"}
          />
        )}
      </CardContent>
    </Card>
  );
}
