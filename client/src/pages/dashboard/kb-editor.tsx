import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  List,
  ListOrdered,
  CheckSquare,
  ChevronRightIcon,
  Code2,
  Quote,
  Minus,
  AlertCircle,
  Pencil,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Code as CodeIcon,
  Link2,
  ArrowUp,
  ArrowDown,
  CopyPlus,
} from "lucide-react";
import type { KnowledgeBase, KbPage, KbBlock } from "@shared/schema";

type BlockType = "text" | "heading1" | "heading2" | "heading3" | "image" | "video" | "link" | "bullet_list" | "numbered_list" | "todo" | "toggle" | "code" | "quote" | "divider" | "callout";

const BLOCK_TYPES: { type: BlockType; label: string; icon: any; description: string; category: string }[] = [
  { type: "text", label: "Text", icon: Type, description: "Plain text paragraph", category: "Basic" },
  { type: "heading1", label: "Heading 1", icon: Heading1, description: "Large section heading", category: "Basic" },
  { type: "heading2", label: "Heading 2", icon: Heading2, description: "Medium section heading", category: "Basic" },
  { type: "heading3", label: "Heading 3", icon: Heading3, description: "Small section heading", category: "Basic" },
  { type: "bullet_list", label: "Bullet List", icon: List, description: "Unordered bullet list", category: "Lists" },
  { type: "numbered_list", label: "Numbered List", icon: ListOrdered, description: "Ordered numbered list", category: "Lists" },
  { type: "todo", label: "To-do List", icon: CheckSquare, description: "Checklist with checkboxes", category: "Lists" },
  { type: "toggle", label: "Toggle", icon: ChevronRightIcon, description: "Collapsible content section", category: "Advanced" },
  { type: "code", label: "Code", icon: Code2, description: "Code block with syntax", category: "Advanced" },
  { type: "quote", label: "Quote", icon: Quote, description: "Blockquote callout", category: "Advanced" },
  { type: "callout", label: "Callout", icon: AlertCircle, description: "Highlighted info box", category: "Advanced" },
  { type: "divider", label: "Divider", icon: Minus, description: "Horizontal line separator", category: "Advanced" },
  { type: "image", label: "Image", icon: ImageIcon, description: "Embed an image URL", category: "Media" },
  { type: "video", label: "Video", icon: Video, description: "Embed a video URL", category: "Media" },
  { type: "link", label: "Link", icon: LinkIcon, description: "Add a clickable link", category: "Media" },
];

const CATEGORIES = ["Basic", "Lists", "Advanced", "Media"];

const FORMAT_TYPES = ["text", "heading1", "heading2", "heading3", "bullet_list", "numbered_list", "todo", "quote", "callout"];

function getSelectionRect(): DOMRect | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return rect;
}

function InlineFormatToolbar({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const toolbarRef = useRef<HTMLDivElement>(null);

  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setPos(null);
      return;
    }

    const range = sel.getRangeAt(0);
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      setPos(null);
      return;
    }

    const editable = range.commonAncestorContainer instanceof Element
      ? range.commonAncestorContainer.closest("[contenteditable]")
      : range.commonAncestorContainer.parentElement?.closest("[contenteditable]");
    if (!editable) {
      setPos(null);
      return;
    }

    const rect = getSelectionRect();
    if (!rect) { setPos(null); return; }

    const containerRect = containerRef.current.getBoundingClientRect();
    const toolbarWidth = 280;
    let left = rect.left + rect.width / 2 - containerRect.left - toolbarWidth / 2;
    left = Math.max(0, Math.min(left, containerRect.width - toolbarWidth));

    setPos({
      top: rect.top - containerRect.top - 44,
      left,
    });

    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("strikeThrough")) formats.add("strikethrough");

    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== editable) {
      if (node instanceof HTMLElement) {
        if (node.tagName === "CODE") formats.add("code");
        if (node.tagName === "MARK") formats.add("highlight");
        if (node.tagName === "A") formats.add("link");
      }
      node = node.parentNode;
    }
    setActiveFormats(formats);
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", checkSelection);
    return () => document.removeEventListener("selectionchange", checkSelection);
  }, [checkSelection]);

  const execFormat = (cmd: string) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    if (cmd === "code") {
      const range = sel.getRangeAt(0);
      const parent = range.commonAncestorContainer.parentElement;
      if (parent?.tagName === "CODE") {
        const text = parent.textContent || "";
        parent.replaceWith(document.createTextNode(text));
      } else {
        try {
          const code = document.createElement("code");
          code.className = "px-1.5 py-0.5 rounded bg-muted font-mono text-sm";
          range.surroundContents(code);
        } catch {
          const code = document.createElement("code");
          code.className = "px-1.5 py-0.5 rounded bg-muted font-mono text-sm";
          code.textContent = range.toString();
          range.deleteContents();
          range.insertNode(code);
        }
      }
      triggerInputEvent();
      return;
    }

    if (cmd === "highlight") {
      const range = sel.getRangeAt(0);
      const parent = range.commonAncestorContainer.parentElement;
      if (parent?.tagName === "MARK") {
        const text = parent.textContent || "";
        parent.replaceWith(document.createTextNode(text));
      } else {
        try {
          const mark = document.createElement("mark");
          mark.className = "bg-yellow-200/60 dark:bg-yellow-500/30 px-0.5 rounded-sm";
          range.surroundContents(mark);
        } catch {
          const mark = document.createElement("mark");
          mark.className = "bg-yellow-200/60 dark:bg-yellow-500/30 px-0.5 rounded-sm";
          mark.textContent = range.toString();
          range.deleteContents();
          range.insertNode(mark);
        }
      }
      triggerInputEvent();
      return;
    }

    if (cmd === "createLink") {
      const url = prompt("Enter URL:");
      if (url) {
        document.execCommand("createLink", false, url);
        triggerInputEvent();
      }
      return;
    }

    document.execCommand(cmd, false);
    triggerInputEvent();
  };

  const triggerInputEvent = () => {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const ancestor = sel.getRangeAt(0).commonAncestorContainer;
    const editable = ancestor instanceof Element
      ? ancestor.closest("[contenteditable]")
      : (ancestor as Node).parentElement?.closest("[contenteditable]");
    if (editable) editable.dispatchEvent(new Event("input", { bubbles: true }));
    setTimeout(checkSelection, 10);
  };

  if (!pos) return null;

  const buttons = [
    { cmd: "bold", icon: Bold, label: "Bold", shortcut: "Ctrl+B" },
    { cmd: "italic", icon: Italic, label: "Italic", shortcut: "Ctrl+I" },
    { cmd: "underline", icon: Underline, label: "Underline", shortcut: "Ctrl+U" },
    { cmd: "strikeThrough", icon: Strikethrough, label: "Strikethrough", shortcut: "Ctrl+Shift+S" },
    { cmd: "highlight", icon: Highlighter, label: "Highlight", shortcut: "Ctrl+Shift+H" },
    { cmd: "code", icon: CodeIcon, label: "Inline Code", shortcut: "Ctrl+E" },
    { cmd: "createLink", icon: Link2, label: "Link", shortcut: "Ctrl+K" },
  ];

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 flex items-center gap-0.5 bg-popover border rounded-lg shadow-lg px-1 py-0.5 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
      data-testid="inline-format-toolbar"
    >
      {buttons.map(({ cmd, icon: Icon, label, shortcut }) => (
        <Tooltip key={cmd}>
          <TooltipTrigger asChild>
            <button
              className={`p-1.5 rounded-md transition-colors ${
                activeFormats.has(cmd === "strikeThrough" ? "strikethrough" : cmd === "createLink" ? "link" : cmd)
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => execFormat(cmd)}
              data-testid={`button-format-${cmd}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {label} <span className="text-muted-foreground ml-1">{shortcut}</span>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

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
  onReorderPages,
  kbId,
}: {
  pages: KbPage[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: (parentId?: string | null) => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, title: string) => void;
  onReorderPages: (pageIds: string[]) => void;
  kbId: string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const rootPages = pages
    .filter((p) => !p.parentPageId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const getChildren = (parentId: string) =>
    pages.filter((p) => p.parentPageId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

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

  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    e.dataTransfer.effectAllowed = "move";
    setDragId(pageId);
  };

  const handleDragOver = (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (pageId !== dragId) setDragOverId(pageId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const currentOrder = rootPages.map(p => p.id);
    const dragIdx = currentOrder.indexOf(dragId);
    const targetIdx = currentOrder.indexOf(targetId);
    if (dragIdx === -1 || targetIdx === -1) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    currentOrder.splice(dragIdx, 1);
    currentOrder.splice(targetIdx, 0, dragId);
    onReorderPages(currentOrder);
    setDragId(null);
    setDragOverId(null);
  };

  const renderPage = (page: KbPage, depth: number) => {
    const children = getChildren(page.id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded[page.id] ?? true;
    const isActive = page.id === activePageId;
    const isEditing = editingId === page.id;
    const isDragging = dragId === page.id;
    const isDragOver = dragOverId === page.id;

    return (
      <div key={page.id}>
        <div
          className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-all ${
            isActive ? "bg-accent text-accent-foreground" : "hover-elevate"
          } ${isDragging ? "opacity-30" : ""} ${isDragOver ? "ring-1 ring-primary bg-primary/5" : ""}`}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
          onClick={() => onSelectPage(page.id)}
          draggable={!isEditing && depth === 0}
          onDragStart={(e) => handleDragStart(e, page.id)}
          onDragOver={(e) => handleDragOver(e, page.id)}
          onDrop={(e) => handleDrop(e, page.id)}
          onDragEnd={() => { setDragId(null); setDragOverId(null); }}
          data-testid={`page-tree-item-${page.id}`}
        >
          {depth === 0 && (
            <GripVertical className="h-3 w-3 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity" />
          )}
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

function SlashCommandMenu({
  filter,
  onSelect,
  onClose,
  selectedIndex,
}: {
  filter: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  selectedIndex: number;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredTypes = useMemo(() =>
    BLOCK_TYPES.filter(
      (bt) => bt.label.toLowerCase().includes(filter.toLowerCase()) || bt.type.includes(filter.toLowerCase()) || bt.description.toLowerCase().includes(filter.toLowerCase())
    ), [filter]);

  useEffect(() => {
    const item = menuRef.current?.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (filteredTypes.length === 0) {
    return (
      <div className="absolute left-0 top-full z-50 mt-1 bg-popover border rounded-md shadow-lg py-2 px-3 w-64" data-testid="slash-menu">
        <p className="text-sm text-muted-foreground">No results</p>
      </div>
    );
  }

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: filteredTypes.filter(bt => bt.category === cat),
  })).filter(g => g.items.length > 0);

  let globalIdx = 0;

  return (
    <div ref={menuRef} className="absolute left-0 top-full z-50 mt-1 bg-popover border rounded-md shadow-lg py-1.5 w-72 max-h-80 overflow-y-auto" data-testid="slash-menu">
      {grouped.map((group) => (
        <div key={group.category}>
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{group.category}</div>
          {group.items.map((bt) => {
            const idx = globalIdx++;
            return (
              <button
                key={bt.type}
                data-index={idx}
                className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-left transition-colors ${
                  idx === selectedIndex ? "bg-accent text-accent-foreground" : "hover-elevate"
                }`}
                onMouseDown={(e) => { e.preventDefault(); onSelect(bt.type); }}
                data-testid={`slash-${bt.type}`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted flex-shrink-0">
                  <bt.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{bt.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{bt.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function BlockEditor({
  pageId,
  blocks,
  onRefresh,
  pageTitle,
  onPageTitleChange,
}: {
  pageId: string;
  blocks: KbBlock[];
  onRefresh: () => void;
  pageTitle: string;
  onPageTitleChange: (title: string) => void;
}) {
  const { toast } = useToast();
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const titleRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const createBlockMutation = useMutation({
    mutationFn: async (data: { type: BlockType; sortOrder: number }) => {
      const res = await apiRequest("POST", `/api/kb-pages/${pageId}/blocks`, data);
      return res.json();
    },
    onSuccess: (newBlock: KbBlock) => {
      onRefresh();
      setFocusBlockId(newBlock.id);
    },
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

  useEffect(() => {
    if (focusBlockId) {
      const timer = setTimeout(() => {
        const el = blockRefs.current[focusBlockId];
        if (el) {
          el.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(el);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
        setFocusBlockId(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [focusBlockId, blocks]);

  const addBlock = useCallback((type: BlockType, afterIndex?: number) => {
    const sortOrder = afterIndex != null ? afterIndex + 1 : blocks.length;
    createBlockMutation.mutate({ type, sortOrder });
  }, [blocks.length]);

  const handleContentChange = useCallback((blockId: string, content: string) => {
    queryClient.setQueryData<KbBlock[]>(
      [`/api/kb-pages/${pageId}/blocks`],
      (old) => old?.map((b) => b.id === blockId ? { ...b, content } : b)
    );
    updateBlockMutation.mutate({ id: blockId, data: { content } });
  }, [pageId]);

  const handleTypeChange = useCallback((blockId: string, type: BlockType) => {
    queryClient.setQueryData<KbBlock[]>(
      [`/api/kb-pages/${pageId}/blocks`],
      (old) => old?.map((b) => b.id === blockId ? { ...b, type, content: "" } : b)
    );
    updateBlockMutation.mutate({ id: blockId, data: { type, content: "" } });
    setFocusBlockId(blockId);
  }, [pageId]);

  const continuationTypes: BlockType[] = ["bullet_list", "numbered_list", "todo", "quote", "callout"];

  const handleEnterOnBlock = useCallback((blockIndex: number, currentType?: BlockType) => {
    const nextType = currentType && continuationTypes.includes(currentType) ? currentType : "text";
    addBlock(nextType, blockIndex);
  }, [addBlock]);

  const handleBackspaceOnEmpty = useCallback((blockId: string, blockIndex: number) => {
    deleteBlockMutation.mutate(blockId);
    if (blockIndex > 0) {
      setFocusBlockId(blocks[blockIndex - 1]?.id || null);
    }
  }, [blocks]);

  const handleArrowNav = useCallback((blockIndex: number, direction: "up" | "down") => {
    if (direction === "up" && blockIndex > 0) {
      setFocusBlockId(blocks[blockIndex - 1].id);
    } else if (direction === "down" && blockIndex < blocks.length - 1) {
      setFocusBlockId(blocks[blockIndex + 1].id);
    }
  }, [blocks]);

  const handleDuplicateBlock = useCallback((blockIndex: number) => {
    const block = blocks[blockIndex];
    if (!block) return;
    createBlockMutation.mutate({ type: block.type as BlockType, sortOrder: blockIndex + 1 }, {
      onSuccess: (newBlock: KbBlock) => {
        updateBlockMutation.mutate({ id: newBlock.id, data: { content: block.content } });
      },
    });
  }, [blocks]);

  const handleMoveBlock = useCallback((blockIndex: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const newOrder = [...blocks];
    const [moved] = newOrder.splice(blockIndex, 1);
    newOrder.splice(targetIdx, 0, moved);
    reorderMutation.mutate(newOrder.map((b) => b.id));
  }, [blocks]);

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

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

  useEffect(() => {
    if (titleRef.current && titleRef.current.innerText !== pageTitle) {
      titleRef.current.innerText = pageTitle;
    }
  }, [pageId, pageTitle]);

  const titleDebounce = useRef<ReturnType<typeof setTimeout>>();
  const handleTitleInput = () => {
    if (!titleRef.current) return;
    clearTimeout(titleDebounce.current);
    const text = titleRef.current.innerText;
    titleDebounce.current = setTimeout(() => {
      if (text.trim()) onPageTitleChange(text.trim());
    }, 600);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (blocks.length > 0) {
        setFocusBlockId(blocks[0].id);
      } else {
        addBlock("text", -1);
      }
    }
  };

  return (
    <div className="space-y-0 relative" ref={editorContainerRef}>
      <InlineFormatToolbar containerRef={editorContainerRef} />
      <div
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        className="text-2xl font-bold outline-none mb-6 py-1 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 empty:before:pointer-events-none"
        data-placeholder="Untitled"
        onInput={handleTitleInput}
        onKeyDown={handleTitleKeyDown}
        data-testid="input-page-title"
      />

      {blocks.map((block, idx) => (
        <div
          key={block.id}
          className={`group relative flex items-start gap-0.5 rounded-md transition-all dv-block-enter ${
            dragOverIdx === idx ? "bg-primary/5 ring-1 ring-primary/20" : ""
          } ${dragIdx === idx ? "opacity-30" : ""}`}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={() => handleDrop(idx)}
          onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
          data-testid={`block-${block.id}`}
        >
          <div className="flex items-center gap-0 pt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-0.5 rounded text-muted-foreground hover-elevate"
                  onClick={() => addBlock("text", idx - 1)}
                  data-testid={`button-add-above-${block.id}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">Add block</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="cursor-grab active:cursor-grabbing p-0.5 rounded text-muted-foreground hover-elevate" data-testid={`grip-${block.id}`}>
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="left" align="start" className="w-44">
                <DropdownMenuItem
                  onClick={() => handleMoveBlock(idx, "up")}
                  disabled={idx === 0}
                  data-testid={`action-move-up-${block.id}`}
                >
                  <ArrowUp className="h-3.5 w-3.5 mr-2" /> Move up
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleMoveBlock(idx, "down")}
                  disabled={idx === blocks.length - 1}
                  data-testid={`action-move-down-${block.id}`}
                >
                  <ArrowDown className="h-3.5 w-3.5 mr-2" /> Move down
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDuplicateBlock(idx)}
                  data-testid={`action-duplicate-${block.id}`}
                >
                  <CopyPlus className="h-3.5 w-3.5 mr-2" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => deleteBlockMutation.mutate(block.id)}
                  className="text-destructive focus:text-destructive"
                  data-testid={`action-delete-${block.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 min-w-0 relative">
            <BlockContent
              block={block}
              blockIndex={idx}
              onContentChange={handleContentChange}
              onTypeChange={handleTypeChange}
              onEnter={handleEnterOnBlock}
              onBackspaceEmpty={handleBackspaceOnEmpty}
              onArrowNav={handleArrowNav}
              onDelete={(id) => deleteBlockMutation.mutate(id)}
              registerRef={(id, el) => { blockRefs.current[id] = el; }}
            />
          </div>
        </div>
      ))}

      {blocks.length === 0 && (
        <div
          className="text-muted-foreground/40 text-base py-2 cursor-text"
          onClick={() => addBlock("text", -1)}
          data-testid="empty-editor-placeholder"
        >
          Type '/' for commands, or click to start writing...
        </div>
      )}
    </div>
  );
}

function BlockContent({
  block,
  blockIndex,
  onContentChange,
  onTypeChange,
  onEnter,
  onBackspaceEmpty,
  onArrowNav,
  onDelete,
  registerRef,
}: {
  block: KbBlock;
  blockIndex: number;
  onContentChange: (id: string, content: string) => void;
  onTypeChange: (id: string, type: BlockType) => void;
  onEnter: (blockIndex: number, currentType?: BlockType) => void;
  onBackspaceEmpty: (blockId: string, blockIndex: number) => void;
  onArrowNav: (blockIndex: number, direction: "up" | "down") => void;
  onDelete: (id: string) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  const filteredTypes = useMemo(() =>
    BLOCK_TYPES.filter(
      (bt) => bt.label.toLowerCase().includes(slashFilter.toLowerCase()) || bt.type.includes(slashFilter.toLowerCase()) || bt.description.toLowerCase().includes(slashFilter.toLowerCase())
    ), [slashFilter]);

  useEffect(() => {
    registerRef(block.id, ref.current);
    return () => registerRef(block.id, null);
  }, [block.id]);

  const saveContent = useCallback((text: string) => {
    onContentChange(block.id, text);
  }, [block.id, onContentChange]);

  const getContent = () => {
    if (!ref.current) return "";
    const hasFormatting = ref.current.querySelector("b, i, u, s, strong, em, code, mark, a, strike");
    return hasFormatting ? ref.current.innerHTML : ref.current.innerText;
  };

  const handleInput = () => {
    if (!ref.current) return;
    const plainText = ref.current.innerText;
    clearTimeout(debounceRef.current);

    if (plainText === "/") {
      setShowSlashMenu(true);
      setSlashFilter("");
      setSlashSelectedIndex(0);
      return;
    }

    if (plainText.startsWith("/") && showSlashMenu) {
      setSlashFilter(plainText.slice(1));
      setSlashSelectedIndex(0);
      return;
    }

    if (showSlashMenu && !plainText.startsWith("/")) {
      setShowSlashMenu(false);
      setSlashFilter("");
    }

    const content = getContent();
    debounceRef.current = setTimeout(() => saveContent(content), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu) {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashMenu(false);
        setSlashFilter("");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashSelectedIndex((prev) => Math.min(prev + 1, filteredTypes.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredTypes.length > 0) {
          selectSlashType(filteredTypes[slashSelectedIndex]?.type || filteredTypes[0].type);
        }
        return;
      }
    }

    const isListType = ["bullet_list", "numbered_list", "todo"].includes(block.type);
    if (e.key === "Tab" && isListType) {
      e.preventDefault();
      if (!ref.current) return;
      const text = ref.current.innerText;
      if (e.shiftKey) {
        if (text.startsWith("  ")) {
          ref.current.innerText = text.slice(2);
          saveContent(text.slice(2));
        }
      } else {
        ref.current.innerText = "  " + text;
        saveContent("  " + text);
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      if (e.key === "b") { e.preventDefault(); document.execCommand("bold"); handleInput(); return; }
      if (e.key === "i") { e.preventDefault(); document.execCommand("italic"); handleInput(); return; }
      if (e.key === "u") { e.preventDefault(); document.execCommand("underline"); handleInput(); return; }
      if (e.key === "e") {
        e.preventDefault();
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
          const range = sel.getRangeAt(0);
          const parent = range.commonAncestorContainer.parentElement;
          if (parent?.tagName === "CODE") {
            const text = parent.textContent || "";
            parent.replaceWith(document.createTextNode(text));
          } else {
            try {
              const code = document.createElement("code");
              code.className = "px-1.5 py-0.5 rounded bg-muted font-mono text-sm";
              range.surroundContents(code);
            } catch {
              const code = document.createElement("code");
              code.className = "px-1.5 py-0.5 rounded bg-muted font-mono text-sm";
              code.textContent = range.toString();
              range.deleteContents();
              range.insertNode(code);
            }
          }
          handleInput();
        }
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
          const url = prompt("Enter URL:");
          if (url) { document.execCommand("createLink", false, url); handleInput(); }
        }
        return;
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      if (e.key === "S" || e.key === "s") { e.preventDefault(); document.execCommand("strikeThrough"); handleInput(); return; }
      if (e.key === "H" || e.key === "h") {
        e.preventDefault();
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
          const range = sel.getRangeAt(0);
          const parent = range.commonAncestorContainer.parentElement;
          if (parent?.tagName === "MARK") {
            const text = parent.textContent || "";
            parent.replaceWith(document.createTextNode(text));
          } else {
            try {
              const mark = document.createElement("mark");
              mark.className = "bg-yellow-200/60 dark:bg-yellow-500/30 px-0.5 rounded-sm";
              range.surroundContents(mark);
            } catch {
              const mark = document.createElement("mark");
              mark.className = "bg-yellow-200/60 dark:bg-yellow-500/30 px-0.5 rounded-sm";
              mark.textContent = range.toString();
              range.deleteContents();
              range.insertNode(mark);
            }
          }
          handleInput();
        }
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !showSlashMenu) {
      e.preventDefault();
      clearTimeout(debounceRef.current);
      if (ref.current) saveContent(getContent());
      onEnter(blockIndex, block.type as BlockType);
    }

    if (e.key === "Backspace" && ref.current) {
      const text = ref.current.innerText;
      if (text === "" || text === "\n") {
        e.preventDefault();
        onBackspaceEmpty(block.id, blockIndex);
      }
    }

    if (e.key === "ArrowUp" && !showSlashMenu) {
      const sel = window.getSelection();
      if (sel && ref.current) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = ref.current.getBoundingClientRect();
        if (Math.abs(rect.top - containerRect.top) < 2) {
          e.preventDefault();
          onArrowNav(blockIndex, "up");
        }
      }
    }

    if (e.key === "ArrowDown" && !showSlashMenu) {
      const sel = window.getSelection();
      if (sel && ref.current) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = ref.current.getBoundingClientRect();
        if (Math.abs(rect.bottom - containerRect.bottom) < 2) {
          e.preventDefault();
          onArrowNav(blockIndex, "down");
        }
      }
    }
  };

  const handleBlur = () => {
    if (!ref.current) return;
    clearTimeout(debounceRef.current);
    if (showSlashMenu) {
      setShowSlashMenu(false);
      setSlashFilter("");
    }
    saveContent(getContent());
  };

  const selectSlashType = (type: BlockType) => {
    setShowSlashMenu(false);
    setSlashFilter("");
    onTypeChange(block.id, type);
    if (ref.current) ref.current.innerText = "";
  };

  useEffect(() => {
    if (!ref.current) return;
    const hasHtml = block.content.includes("<");
    if (hasHtml) {
      if (ref.current.innerHTML !== block.content) {
        ref.current.innerHTML = block.content;
      }
    } else {
      if (ref.current.innerText !== block.content) {
        ref.current.innerText = block.content;
      }
    }
  }, [block.id, block.content]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const placeholders: Record<string, string> = {
    text: "Type '/' for commands, or start writing...",
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    bullet_list: "List item",
    numbered_list: "List item",
    todo: "To-do item",
    toggle: "Toggle title",
    code: "Write code...",
    quote: "Write a quote...",
    callout: "Type a callout...",
  };

  const baseClass = "outline-none w-full min-h-[1.5em] whitespace-pre-wrap break-words";

  const renderEditable = (className: string, placeholder: string) => (
    <div className="relative">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={`${baseClass} ${className} empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 empty:before:pointer-events-none`}
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        data-testid={`editor-block-${block.id}`}
      />
      {showSlashMenu && (
        <SlashCommandMenu
          filter={slashFilter}
          onSelect={selectSlashType}
          onClose={() => { setShowSlashMenu(false); setSlashFilter(""); }}
          selectedIndex={slashSelectedIndex}
        />
      )}
    </div>
  );

  switch (block.type) {
    case "heading1":
      return renderEditable("text-3xl font-bold py-1", placeholders.heading1);
    case "heading2":
      return renderEditable("text-2xl font-semibold py-1", placeholders.heading2);
    case "heading3":
      return renderEditable("text-xl font-medium py-0.5", placeholders.heading3);

    case "bullet_list":
      return (
        <div className="flex items-start gap-2 py-0.5">
          <span className="text-muted-foreground mt-[3px] flex-shrink-0 select-none">&#8226;</span>
          {renderEditable("text-base", placeholders.bullet_list)}
        </div>
      );

    case "numbered_list":
      return (
        <div className="flex items-start gap-2 py-0.5">
          <span className="text-muted-foreground mt-[1px] flex-shrink-0 select-none text-sm font-medium min-w-[1.25rem] text-right">{blockIndex + 1}.</span>
          {renderEditable("text-base", placeholders.numbered_list)}
        </div>
      );

    case "todo":
      return <TodoBlock block={block} onContentChange={onContentChange} renderEditable={renderEditable} placeholder={placeholders.todo} />;

    case "toggle":
      return <ToggleBlock block={block} onContentChange={onContentChange} renderEditable={renderEditable} placeholder={placeholders.toggle} />;

    case "code":
      return (
        <div className="rounded-md bg-muted/60 border overflow-visible">
          <div
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            className={`${baseClass} font-mono text-sm p-3 text-foreground`}
            data-placeholder={placeholders.code}
            style={{ tabSize: 2 }}
            onInput={handleInput}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                document.execCommand("insertText", false, "  ");
              }
              handleKeyDown(e);
            }}
            onBlur={handleBlur}
            data-testid={`editor-block-${block.id}`}
          />
          {showSlashMenu && (
            <SlashCommandMenu
              filter={slashFilter}
              onSelect={selectSlashType}
              onClose={() => { setShowSlashMenu(false); setSlashFilter(""); }}
              selectedIndex={slashSelectedIndex}
            />
          )}
        </div>
      );

    case "quote":
      return (
        <div className="border-l-[3px] border-muted-foreground/30 pl-4 py-0.5">
          {renderEditable("text-base italic text-muted-foreground", placeholders.quote)}
        </div>
      );

    case "callout":
      return (
        <div className="rounded-md bg-muted/50 border px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          {renderEditable("text-sm", placeholders.callout)}
        </div>
      );

    case "divider":
      return (
        <div className="py-3 group/divider">
          <hr className="border-border" />
        </div>
      );

    case "image":
      return <MediaUrlBlock block={block} onContentChange={onContentChange} type="image" />;

    case "video":
      return <MediaUrlBlock block={block} onContentChange={onContentChange} type="video" />;

    case "link":
      return <MediaUrlBlock block={block} onContentChange={onContentChange} type="link" />;

    default:
      return renderEditable("text-base py-0.5", placeholders.text);
  }
}

function TodoBlock({
  block,
  onContentChange,
  renderEditable,
  placeholder,
}: {
  block: KbBlock;
  onContentChange: (id: string, content: string) => void;
  renderEditable: (className: string, placeholder: string) => JSX.Element;
  placeholder: string;
}) {
  const parsed = parseTodoContent(block.content);

  const toggleCheck = () => {
    const newContent = `[${parsed.checked ? " " : "x"}] ${parsed.text}`;
    onContentChange(block.id, newContent);
  };

  return (
    <div className="flex items-start gap-2 py-0.5">
      <button
        className={`mt-[3px] flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          parsed.checked ? "bg-primary border-primary" : "border-muted-foreground/40"
        }`}
        onClick={toggleCheck}
        data-testid={`todo-check-${block.id}`}
      >
        {parsed.checked && <Check className="h-3 w-3 text-primary-foreground" />}
      </button>
      <div className={`flex-1 ${parsed.checked ? "line-through text-muted-foreground" : ""}`}>
        {renderEditable("text-base", placeholder)}
      </div>
    </div>
  );
}

function parseTodoContent(content: string): { checked: boolean; text: string } {
  const match = content.match(/^\[([ x])\]\s*([\s\S]*)/);
  if (match) {
    return { checked: match[1] === "x", text: match[2] };
  }
  return { checked: false, text: content };
}

function MediaUrlBlock({
  block,
  onContentChange,
  type,
}: {
  block: KbBlock;
  onContentChange: (id: string, content: string) => void;
  type: "image" | "video" | "link";
}) {
  const [inputVal, setInputVal] = useState(block.content || "");
  const [editing, setEditing] = useState(!block.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputVal(block.content || "");
    if (block.content) setEditing(false);
  }, [block.content]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const commit = () => {
    if (inputVal.trim() && inputVal !== block.content) {
      onContentChange(block.id, inputVal.trim());
      setEditing(false);
    } else if (!inputVal.trim() && block.content) {
      setInputVal(block.content);
      setEditing(false);
    }
  };

  const placeholder = type === "image" ? "Paste image URL..." : type === "video" ? "Paste video URL (YouTube, Vimeo, etc.)..." : "Paste link URL...";
  const hasContent = !!block.content;

  const preview = hasContent ? (
    type === "image" ? (
      <div className="rounded-md overflow-hidden bg-muted">
        <img src={block.content} alt="Block image" className="max-w-full h-auto" data-testid={`img-block-${block.id}`} />
      </div>
    ) : type === "video" ? (
      <div className="rounded-md overflow-hidden bg-muted aspect-video">
        <iframe
          src={block.content.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
          className="w-full h-full"
          allowFullScreen
          data-testid={`video-block-${block.id}`}
        />
      </div>
    ) : (
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
    )
  ) : null;

  return (
    <div className="space-y-2 py-1">
      {preview}
      {editing ? (
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") { setInputVal(block.content || ""); setEditing(false); }
          }}
          data-testid={`input-block-${block.id}`}
        />
      ) : hasContent ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground gap-1"
          onClick={() => setEditing(true)}
          data-testid={`button-edit-url-${block.id}`}
        >
          <Pencil className="h-3 w-3" />
          Change URL
        </Button>
      ) : (
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
          }}
          data-testid={`input-block-${block.id}`}
        />
      )}
    </div>
  );
}

function ToggleBlock({
  block,
  onContentChange,
  renderEditable,
  placeholder,
}: {
  block: KbBlock;
  onContentChange: (id: string, content: string) => void;
  renderEditable: (className: string, placeholder: string) => JSX.Element;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const parts = block.content.split("\n---\n");
  const title = parts[0] || "";
  const body = parts.slice(1).join("\n---\n") || "";

  return (
    <div className="rounded-md border bg-muted/20 overflow-visible">
      <div className="flex items-start gap-1 px-3 py-2">
        <button
          className="p-0.5 mt-0.5 flex-shrink-0 text-muted-foreground"
          onClick={() => setIsOpen(!isOpen)}
          data-testid={`toggle-btn-${block.id}`}
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          {renderEditable("text-base font-medium", placeholder)}
        </div>
      </div>
      {isOpen && (
        <div className="px-3 pb-3 pl-9 text-sm text-muted-foreground">
          <textarea
            className="w-full bg-transparent border-none outline-none resize-none min-h-[2em] text-foreground"
            placeholder="Toggle content..."
            value={body}
            onChange={(e) => onContentChange(block.id, `${title}\n---\n${e.target.value}`)}
            data-testid={`toggle-body-${block.id}`}
          />
        </div>
      )}
    </div>
  );
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
      const sorted = [...pages].filter(p => !p.parentPageId).sort((a, b) => a.sortOrder - b.sortOrder);
      setActivePageId(sorted[0]?.id || pages[0].id);
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

  const reorderPagesMutation = useMutation({
    mutationFn: async (pageIds: string[]) => {
      await apiRequest("PUT", `/api/knowledge-bases/${kbId}/pages/reorder`, { pageIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-bases/${kbId}/pages`] });
    },
    onError: () => toast({ title: "Error", description: "Failed to reorder pages.", variant: "destructive" }),
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

  const handlePageTitleChange = useCallback((title: string) => {
    if (activePage) {
      renamePageMutation.mutate({ id: activePage.id, title });
    }
  }, [activePage]);

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
                onChange={(val) => { if (val.trim()) updateKbTitleMutation.mutate(val.trim()); }}
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
              onReorderPages={(pageIds) => reorderPagesMutation.mutate(pageIds)}
              kbId={kbId}
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activePageId && activePage ? (
          <div className="max-w-3xl mx-auto p-8">
            <BlockEditor
              pageId={activePageId}
              blocks={blocks}
              onRefresh={() => refetchBlocks()}
              pageTitle={activePage.title}
              onPageTitleChange={handlePageTitleChange}
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
