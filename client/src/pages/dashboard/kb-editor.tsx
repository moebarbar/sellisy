import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FileText,
  ChevronRight,
  ChevronDown,
  Trash2,
  Loader2,
  GripVertical,
  Type,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Video,
  Link as LinkIcon,
  ArrowLeft,
  MoreHorizontal,
  Edit3,
  Settings,
  Eye,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import type { KnowledgeBase, KbPage, KbBlock } from "@shared/schema";

type BlockType = "text" | "heading1" | "heading2" | "heading3" | "image" | "video" | "link";

const BLOCK_TYPES: { type: BlockType; label: string; icon: any; description: string }[] = [
  { type: "text", label: "Text", icon: Type, description: "Plain text paragraph" },
  { type: "heading1", label: "Heading 1", icon: Heading1, description: "Large title" },
  { type: "heading2", label: "Heading 2", icon: Heading2, description: "Medium header" },
  { type: "heading3", label: "Heading 3", icon: Heading3, description: "Small header" },
  { type: "image", label: "Image", icon: ImageIcon, description: "Embed an image URL" },
  { type: "video", label: "Video", icon: Video, description: "Embed a video URL" },
  { type: "link", label: "External Link", icon: LinkIcon, description: "Add a clickable link" },
];

function useDebouncedCallback(callback: (value: string) => void, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  return useCallback((value: string) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callback(value), delay);
  }, [callback, delay]);
}

function DebouncedInput({
  value: externalValue,
  onChange,
  delay = 600,
  ...props
}: { value: string; onChange: (val: string) => void; delay?: number } & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const [localValue, setLocalValue] = useState(externalValue);
  const debouncedSave = useDebouncedCallback(onChange, delay);

  useEffect(() => { setLocalValue(externalValue); }, [externalValue]);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        debouncedSave(e.target.value);
      }}
    />
  );
}

function PageTree({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onRenamePage,
}: {
  pages: KbPage[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: (parentId?: string | null) => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, title: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const rootPages = pages.filter((p) => !p.parentPageId);
  const getChildren = (parentId: string) => pages.filter((p) => p.parentPageId === parentId);

  const startRename = (page: KbPage) => {
    setEditingId(page.id);
    setEditTitle(page.title);
  };

  const finishRename = () => {
    if (editingId && editTitle.trim()) {
      onRenamePage(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const renderPage = (page: KbPage, depth: number) => {
    const children = getChildren(page.id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded[page.id] ?? true;
    const isActive = page.id === activePageId;
    const isEditing = editingId === page.id;

    return (
      <div key={page.id}>
        <div
          className={`group flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer text-sm transition-colors ${
            isActive ? "bg-accent text-accent-foreground" : "hover-elevate"
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onSelectPage(page.id)}
          data-testid={`page-tree-item-${page.id}`}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [page.id]: !prev[page.id] })); }}
              className="p-0.5 flex-shrink-0"
              data-testid={`button-toggle-${page.id}`}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : (
            <FileText className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          )}

          {isEditing ? (
            <Input
              className="h-6 text-sm px-1"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={finishRename}
              onKeyDown={(e) => { if (e.key === "Enter") finishRename(); if (e.key === "Escape") setEditingId(null); }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              data-testid={`input-rename-page-${page.id}`}
            />
          ) : (
            <span className="truncate flex-1">{page.title}</span>
          )}

          <div className="flex items-center gap-0.5 invisible group-hover:visible flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-0.5 rounded hover-elevate"
                  onClick={(e) => { e.stopPropagation(); onCreatePage(page.id); setExpanded((prev) => ({ ...prev, [page.id]: true })); }}
                  data-testid={`button-add-subpage-${page.id}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Add sub-page</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-0.5 rounded hover-elevate"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`button-page-menu-${page.id}`}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => startRename(page)} data-testid={`button-rename-page-${page.id}`}>
                  <Edit3 className="mr-2 h-3 w-3" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDeletePage(page.id)} data-testid={`button-delete-page-${page.id}`}>
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {hasChildren && isExpanded && children.map((child) => renderPage(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      {rootPages.map((page) => renderPage(page, 0))}
      {pages.length === 0 && (
        <p className="text-xs text-muted-foreground px-3 py-4 text-center">No pages yet</p>
      )}
    </div>
  );
}

function BlockEditor({
  pageId,
  blocks,
  onRefresh,
}: {
  pageId: string;
  blocks: KbBlock[];
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const createBlockMutation = useMutation({
    mutationFn: async (data: { type: BlockType; sortOrder: number }) => {
      const res = await apiRequest("POST", `/api/kb-pages/${pageId}/blocks`, data);
      return res.json();
    },
    onSuccess: () => onRefresh(),
    onError: () => toast({ title: "Error", description: "Failed to add block.", variant: "destructive" }),
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<KbBlock> }) => {
      await apiRequest("PATCH", `/api/kb-blocks/${id}`, data);
    },
    onError: () => toast({ title: "Error", description: "Failed to save block.", variant: "destructive" }),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/kb-blocks/${id}`);
    },
    onSuccess: () => onRefresh(),
    onError: () => toast({ title: "Error", description: "Failed to delete block.", variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (blockIds: string[]) => {
      await apiRequest("PUT", `/api/kb-pages/${pageId}/blocks/reorder`, { blockIds });
    },
    onSuccess: () => onRefresh(),
    onError: () => toast({ title: "Error", description: "Failed to reorder blocks.", variant: "destructive" }),
  });

  const addBlock = (type: BlockType, afterIndex?: number) => {
    const sortOrder = afterIndex != null ? afterIndex + 1 : blocks.length;
    createBlockMutation.mutate({ type, sortOrder });
  };

  const handleContentChange = useCallback((blockId: string, content: string) => {
    updateBlockMutation.mutate({ id: blockId, data: { content } });
  }, []);

  const handleTypeChange = useCallback((blockId: string, type: BlockType) => {
    updateBlockMutation.mutate({ id: blockId, data: { type, content: "" } });
  }, []);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx == null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const newOrder = [...blocks];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    reorderMutation.mutate(newOrder.map((b) => b.id));
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-0.5">
      {blocks.map((block, idx) => (
        <div key={block.id}>
          <InlineAddButton onClick={(type) => addBlock(type, idx - 1)} show={idx === 0} />
          <div
            className={`group relative flex items-start gap-1 rounded-md transition-colors ${
              dragOverIdx === idx ? "bg-primary/5 border-l-2 border-primary" : ""
            } ${dragIdx === idx ? "opacity-40" : ""}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
            data-testid={`block-${block.id}`}
          >
            <div className="flex flex-col items-center gap-0.5 pt-1 invisible group-hover:visible flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="cursor-grab active:cursor-grabbing p-0.5 rounded text-muted-foreground" data-testid={`grip-${block.id}`}>
                    <GripVertical className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">Drag to reorder</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-0.5 rounded text-muted-foreground"
                    onClick={() => deleteBlockMutation.mutate(block.id)}
                    data-testid={`button-delete-block-${block.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">Delete block</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex-1 min-w-0 relative">
              <BlockContent
                block={block}
                onContentChange={handleContentChange}
                onTypeChange={handleTypeChange}
              />
            </div>
          </div>
          <InlineAddButton onClick={(type) => addBlock(type, idx)} />
        </div>
      ))}

      <div className="pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-muted-foreground" data-testid="button-add-block">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add a block
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {BLOCK_TYPES.map((bt) => (
              <DropdownMenuItem key={bt.type} onClick={() => addBlock(bt.type)} data-testid={`menu-block-${bt.type}`}>
                <bt.icon className="mr-2 h-4 w-4" />
                <div>
                  <div className="text-sm">{bt.label}</div>
                  <div className="text-xs text-muted-foreground">{bt.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function InlineAddButton({ onClick, show }: { onClick: (type: BlockType) => void; show?: boolean }) {
  return (
    <div className={`group/add flex items-center h-2 ${show ? "" : ""}`}>
      <div className="invisible group-hover/add:visible flex items-center w-full">
        <div className="flex-1 h-px bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex-shrink-0 mx-1 p-0 rounded-full bg-muted border w-5 h-5 flex items-center justify-center text-muted-foreground"
              data-testid="button-inline-add-block"
            >
              <Plus className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {BLOCK_TYPES.map((bt) => (
              <DropdownMenuItem key={bt.type} onClick={() => onClick(bt.type)}>
                <bt.icon className="mr-2 h-4 w-4" />
                <div>
                  <div className="text-sm">{bt.label}</div>
                  <div className="text-xs text-muted-foreground">{bt.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
}

function BlockContent({
  block,
  onContentChange,
  onTypeChange,
}: {
  block: KbBlock;
  onContentChange: (id: string, content: string) => void;
  onTypeChange: (id: string, type: BlockType) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");

  const saveContent = useCallback((text: string) => {
    onContentChange(block.id, text);
  }, [block.id, onContentChange]);

  const handleInput = () => {
    if (!ref.current) return;
    const text = ref.current.innerText;
    clearTimeout(debounceRef.current);

    if (text.startsWith("/")) {
      setShowSlashMenu(true);
      setSlashFilter(text.slice(1).toLowerCase());
      return;
    }

    setShowSlashMenu(false);
    setSlashFilter("");
    debounceRef.current = setTimeout(() => saveContent(text), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu && e.key === "Escape") {
      e.preventDefault();
      setShowSlashMenu(false);
      setSlashFilter("");
    }
    if (e.key === "Enter" && !e.shiftKey && showSlashMenu) {
      e.preventDefault();
      const filtered = BLOCK_TYPES.filter(
        (bt) => bt.label.toLowerCase().includes(slashFilter) || bt.type.includes(slashFilter)
      );
      if (filtered.length > 0) {
        selectSlashType(filtered[0].type);
      }
    }
  };

  const handleBlur = () => {
    if (!ref.current) return;
    clearTimeout(debounceRef.current);
    const text = ref.current.innerText;
    if (showSlashMenu) {
      setShowSlashMenu(false);
      setSlashFilter("");
    }
    saveContent(text);
  };

  const selectSlashType = (type: BlockType) => {
    setShowSlashMenu(false);
    setSlashFilter("");
    onTypeChange(block.id, type);
    if (ref.current) ref.current.innerText = "";
  };

  useEffect(() => {
    if (ref.current && ref.current.innerText !== block.content) {
      ref.current.innerText = block.content;
    }
  }, [block.id, block.content]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const baseClass = "outline-none w-full min-h-[1.5em] whitespace-pre-wrap break-words";

  const filteredTypes = BLOCK_TYPES.filter(
    (bt) => bt.label.toLowerCase().includes(slashFilter) || bt.type.includes(slashFilter)
  );

  const renderEditable = (className: string, placeholder: string) => (
    <div className="relative">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={`${baseClass} ${className} empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none`}
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        data-testid={`editor-block-${block.id}`}
      />
      {showSlashMenu && filteredTypes.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 bg-popover border rounded-md shadow-md py-1 w-56" data-testid="slash-menu">
          {filteredTypes.map((bt) => (
            <button
              key={bt.type}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover-elevate"
              onMouseDown={(e) => { e.preventDefault(); selectSlashType(bt.type); }}
              data-testid={`slash-${bt.type}`}
            >
              <bt.icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div>{bt.label}</div>
                <div className="text-xs text-muted-foreground">{bt.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  switch (block.type) {
    case "heading1":
      return renderEditable("text-3xl font-bold py-1", "Heading 1");
    case "heading2":
      return renderEditable("text-2xl font-semibold py-1", "Heading 2");
    case "heading3":
      return renderEditable("text-xl font-medium py-0.5", "Heading 3");
    case "image":
      return (
        <div className="space-y-2 py-1">
          {block.content ? (
            <div className="rounded-md overflow-hidden bg-muted">
              <img src={block.content} alt="Block image" className="max-w-full h-auto" data-testid={`img-block-${block.id}`} />
            </div>
          ) : null}
          <Input
            placeholder="Paste image URL..."
            defaultValue={block.content}
            onBlur={(e) => onContentChange(block.id, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onContentChange(block.id, (e.target as HTMLInputElement).value); }}
            data-testid={`input-block-${block.id}`}
          />
        </div>
      );
    case "video":
      return (
        <div className="space-y-2 py-1">
          {block.content ? (
            <div className="rounded-md overflow-hidden bg-muted aspect-video">
              <iframe
                src={block.content.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                className="w-full h-full"
                allowFullScreen
                data-testid={`video-block-${block.id}`}
              />
            </div>
          ) : null}
          <Input
            placeholder="Paste video URL (YouTube, Vimeo, etc.)..."
            defaultValue={block.content}
            onBlur={(e) => onContentChange(block.id, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onContentChange(block.id, (e.target as HTMLInputElement).value); }}
            data-testid={`input-block-${block.id}`}
          />
        </div>
      );
    case "link":
      return (
        <div className="space-y-2 py-1">
          {block.content ? (
            <a
              href={block.content}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2"
              data-testid={`link-block-${block.id}`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              {block.content}
            </a>
          ) : null}
          <Input
            placeholder="Paste link URL..."
            defaultValue={block.content}
            onBlur={(e) => onContentChange(block.id, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onContentChange(block.id, (e.target as HTMLInputElement).value); }}
            data-testid={`input-block-${block.id}`}
          />
        </div>
      );
    default:
      return renderEditable("text-base py-0.5", "Type '/' for commands or start writing...");
  }
}

function KbSettingsPanel({
  kb,
  kbId,
  pageCount,
}: {
  kb: KnowledgeBase;
  kbId: string;
  pageCount: number;
}) {
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [description, setDescription] = useState(kb.description || "");
  const [coverImageUrl, setCoverImageUrl] = useState(kb.coverImageUrl || "");
  const [priceCents, setPriceCents] = useState(kb.priceCents || 0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDescription(kb.description || "");
    setCoverImageUrl(kb.coverImageUrl || "");
    setPriceCents(kb.priceCents || 0);
  }, [kb]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<KnowledgeBase>) => {
      const res = await apiRequest("PATCH", `/api/knowledge-bases/${kbId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-bases/${kbId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-bases"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" }),
  });

  const togglePublish = () => {
    if (!kb.isPublished && pageCount === 0) {
      toast({ title: "Cannot publish", description: "Add at least one page before publishing.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ isPublished: !kb.isPublished });
    if (!kb.isPublished) {
      toast({ title: "Published!", description: "Your knowledge base is now publicly accessible." });
    } else {
      toast({ title: "Unpublished", description: "Your knowledge base is no longer publicly visible." });
    }
  };

  const createProductMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/knowledge-bases/${kbId}/create-product`);
      return res.json();
    },
    onSuccess: (product: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-bases/${kbId}`] });
      toast({ title: "Product created!", description: `"${product.title}" is now available in your Products page for import into any store.` });
    },
    onError: () => toast({ title: "Error", description: "Failed to create product.", variant: "destructive" }),
  });

  const saveSettings = () => {
    updateMutation.mutate({ description, coverImageUrl: coverImageUrl || null, priceCents });
    toast({ title: "Saved", description: "Settings updated." });
    setShowSettings(false);
  };

  const viewerUrl = `${window.location.origin}/kb/${kbId}`;
  const copyLink = () => {
    navigator.clipboard.writeText(viewerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {kb.isPublished && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(viewerUrl, "_blank")}
                data-testid="button-preview-kb"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview live page</TooltipContent>
          </Tooltip>
        )}
        {kb.isPublished && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={copyLink} data-testid="button-copy-kb-link">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copied!" : "Copy link"}</TooltipContent>
          </Tooltip>
        )}
        <Button
          variant={kb.isPublished ? "secondary" : "default"}
          size="sm"
          onClick={togglePublish}
          disabled={updateMutation.isPending}
          data-testid="button-toggle-publish"
        >
          {updateMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {kb.isPublished ? "Unpublish" : "Publish"}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} data-testid="button-kb-settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Knowledge Base Settings</DialogTitle>
            <DialogDescription>Configure how your content appears to readers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="A brief description of this knowledge base..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                data-testid="input-kb-description"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cover Image URL</Label>
              <Input
                placeholder="https://example.com/cover.jpg"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                data-testid="input-kb-cover-image"
              />
              {coverImageUrl && (
                <div className="rounded-md overflow-hidden bg-muted aspect-video mt-2">
                  <img src={coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Price (USD)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={(priceCents / 100).toFixed(2)}
                  onChange={(e) => setPriceCents(Math.round(parseFloat(e.target.value || "0") * 100))}
                  data-testid="input-kb-price"
                />
              </div>
              <p className="text-xs text-muted-foreground">Set to 0 for free access. Paid content requires purchase verification.</p>
            </div>
            {kb.isPublished && (
              <div className="space-y-1.5">
                <Label>Public Link</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={viewerUrl} className="text-xs" data-testid="input-kb-public-link" />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Sell as Product</Label>
              <p className="text-xs text-muted-foreground">
                {kb.productId
                  ? "This knowledge base is linked to a product. Click below to sync changes."
                  : "Create a course product from this knowledge base so you can import it into your stores and sell it."}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => createProductMutation.mutate()}
                disabled={createProductMutation.isPending || pageCount === 0}
                data-testid="button-create-product-from-kb"
              >
                {createProductMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {kb.productId ? "Sync Product" : "Create Product"}
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button onClick={saveSettings} disabled={updateMutation.isPending} data-testid="button-save-kb-settings">
                {updateMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function KbEditorPage() {
  const [, params] = useRoute("/dashboard/kb/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const kbId = params?.id || "";
  const [activePageId, setActivePageId] = useState<string | null>(null);

  const { data: kb, isLoading: kbLoading } = useQuery<KnowledgeBase>({
    queryKey: [`/api/knowledge-bases/${kbId}`],
    enabled: !!kbId,
  });

  const { data: pages = [], isLoading: pagesLoading } = useQuery<KbPage[]>({
    queryKey: [`/api/knowledge-bases/${kbId}/pages`],
    enabled: !!kbId,
  });

  const { data: blocks = [], refetch: refetchBlocks } = useQuery<KbBlock[]>({
    queryKey: [`/api/kb-pages/${activePageId}/blocks`],
    enabled: !!activePageId,
  });

  const activePage = pages.find((p) => p.id === activePageId);

  useEffect(() => {
    if (pages.length > 0 && !activePageId) {
      setActivePageId(pages[0].id);
    }
  }, [pages, activePageId]);

  const createPageMutation = useMutation({
    mutationFn: async (parentPageId?: string | null) => {
      const res = await apiRequest("POST", `/api/knowledge-bases/${kbId}/pages`, { parentPageId });
      return res.json();
    },
    onSuccess: (page: KbPage) => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-bases/${kbId}/pages`] });
      setActivePageId(page.id);
    },
    onError: () => toast({ title: "Error", description: "Failed to create page.", variant: "destructive" }),
  });

  const renamePageMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await apiRequest("PATCH", `/api/kb-pages/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-bases/${kbId}/pages`] });
    },
    onError: () => toast({ title: "Error", description: "Failed to rename page.", variant: "destructive" }),
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/kb-pages/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-bases/${kbId}/pages`] });
      if (activePageId === deletedId) {
        const remaining = pages.filter((p) => p.id !== deletedId);
        setActivePageId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    onError: () => toast({ title: "Error", description: "Failed to delete page.", variant: "destructive" }),
  });

  const updateKbTitleMutation = useMutation({
    mutationFn: async (title: string) => {
      await apiRequest("PATCH", `/api/knowledge-bases/${kbId}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-bases/${kbId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-bases"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to rename.", variant: "destructive" }),
  });

  const debouncedRenameKb = useDebouncedCallback((title: string) => {
    if (title.trim()) updateKbTitleMutation.mutate(title.trim());
  }, 600);

  const debouncedRenamePage = useDebouncedCallback((title: string) => {
    if (activePage && title.trim()) renamePageMutation.mutate({ id: activePage.id, title: title.trim() });
  }, 600);

  if (kbLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!kb) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Knowledge base not found</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/content-creator")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full" data-testid="kb-editor">
      <div className="w-64 flex-shrink-0 border-r flex flex-col bg-muted/30">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/content-creator")} data-testid="button-back-to-kbs">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <DebouncedInput
                className="h-7 text-sm font-semibold border-none bg-transparent px-1"
                value={kb.title}
                onChange={debouncedRenameKb}
                data-testid="input-kb-title"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5">
              {kb.isPublished ? (
                <Badge variant="secondary">Published</Badge>
              ) : (
                <Badge variant="outline">Draft</Badge>
              )}
              <span className="text-xs text-muted-foreground">{pages.length} pages</span>
            </div>
            <KbSettingsPanel kb={kb} kbId={kbId} pageCount={pages.length} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => createPageMutation.mutate(null)} data-testid="button-add-page">
                  <Plus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add page</TooltipContent>
            </Tooltip>
          </div>
          {pagesLoading ? (
            <div className="space-y-2 px-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-6" />)}
            </div>
          ) : (
            <PageTree
              pages={pages}
              activePageId={activePageId}
              onSelectPage={setActivePageId}
              onCreatePage={(parentId) => createPageMutation.mutate(parentId)}
              onDeletePage={(id) => deletePageMutation.mutate(id)}
              onRenamePage={(id, title) => renamePageMutation.mutate({ id, title })}
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activePageId && activePage ? (
          <div className="max-w-3xl mx-auto p-8">
            <div className="mb-6">
              <DebouncedInput
                className="text-3xl font-bold border-none bg-transparent px-0 h-auto focus-visible:ring-0"
                value={activePage.title}
                onChange={debouncedRenamePage}
                placeholder="Untitled Page"
                data-testid="input-page-title"
              />
            </div>
            <BlockEditor
              pageId={activePageId}
              blocks={blocks}
              onRefresh={() => refetchBlocks()}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold mb-1">No page selected</h3>
              <p className="text-sm text-muted-foreground">Create a page from the sidebar to start adding content.</p>
            </div>
            <Button onClick={() => createPageMutation.mutate(null)} data-testid="button-create-first-page">
              <Plus className="mr-2 h-4 w-4" />
              Create First Page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
