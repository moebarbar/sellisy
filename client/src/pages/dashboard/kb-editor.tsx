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
  CopyPlus,
  Palette,
} from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { Upload, X } from "lucide-react";
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

const CONTINUATION_TYPES: BlockType[] = ["bullet_list", "numbered_list", "todo", "quote", "callout"];
const REVERT_TO_TEXT_TYPES: BlockType[] = ["bullet_list", "numbered_list", "todo", "quote", "callout", "heading1", "heading2", "heading3"];


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
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [existingLinkUrl, setExistingLinkUrl] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [activeFont, setActiveFont] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      const range = savedSelectionRef.current;
      const container = range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer.closest("[contenteditable]")
        : range.commonAncestorContainer.parentElement?.closest("[contenteditable]");
      if (container && containerRef.current?.contains(container)) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  const findParentAnchor = (): HTMLAnchorElement | null => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
    while (node) {
      if (node instanceof HTMLElement && node.tagName === "A") return node as HTMLAnchorElement;
      node = node.parentNode;
    }
    return null;
  };

  const lastPosRef = useRef<{ top: number; left: number } | null>(null);

  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      if (lastPosRef.current !== null) {
        lastPosRef.current = null;
        setPos(null);
      }
      setShowLinkInput(false);
      setShowColorPicker(false);
      setShowFontPicker(false);
      setLinkUrl("");
      return;
    }

    if (showLinkInput || showColorPicker || showFontPicker) return;

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
    const toolbarWidth = 320;
    const toolbarHeight = 44;
    let left = rect.left + rect.width / 2 - containerRect.left - toolbarWidth / 2;
    left = Math.max(0, Math.min(left, containerRect.width - toolbarWidth));

    const spaceAbove = rect.top - containerRect.top;
    const showBelow = spaceAbove < toolbarHeight + 8;

    const newTop = showBelow ? rect.bottom - containerRect.top + 8 : rect.top - containerRect.top - toolbarHeight;
    const newPos = { top: Math.round(newTop), left: Math.round(left) };
    if (!lastPosRef.current || lastPosRef.current.top !== newPos.top || lastPosRef.current.left !== newPos.left) {
      lastPosRef.current = newPos;
      setPos(newPos);
    }

    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("strikeThrough")) formats.add("strikethrough");

    let detectedColor: string | null = null;
    let detectedFont: string | null = null;
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== editable) {
      if (node instanceof HTMLElement) {
        if (node.tagName === "CODE") formats.add("code");
        if (node.tagName === "MARK") formats.add("highlight");
        if (node.tagName === "A") formats.add("link");
        if (node.tagName === "SPAN" && node.dataset.textColor) {
          detectedColor = node.dataset.textColor;
          formats.add("textColor");
        }
        if (node.tagName === "SPAN" && node.dataset.textFont) {
          detectedFont = node.dataset.textFont;
          formats.add("textFont");
        }
      }
      node = node.parentNode;
    }
    setActiveColor(detectedColor);
    setActiveFont(detectedFont);
    setActiveFormats(formats);
  }, [containerRef, showLinkInput, showColorPicker, showFontPicker]);

  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const onSelectionChange = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(checkSelection);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [checkSelection]);

  useEffect(() => {
    const handleCtrlK = () => openLinkInput();
    document.addEventListener("kb-open-link-input", handleCtrlK);
    return () => document.removeEventListener("kb-open-link-input", handleCtrlK);
  }, []);

  const openLinkInput = () => {
    saveSelection();
    setShowColorPicker(false);
    setShowFontPicker(false);
    const anchor = findParentAnchor();
    if (anchor) {
      setExistingLinkUrl(anchor.href);
      setLinkUrl(anchor.href);
    } else {
      setExistingLinkUrl(null);
      setLinkUrl("");
    }
    setShowLinkInput(true);
    setTimeout(() => linkInputRef.current?.focus(), 50);
  };

  const applyLink = (url: string) => {
    restoreSelection();
    const trimmed = url.trim();
    if (!trimmed) {
      setShowLinkInput(false);
      setLinkUrl("");
      return;
    }
    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith("mailto:")) {
      finalUrl = "https://" + finalUrl;
    }
    const existingAnchor = findParentAnchor();
    if (existingAnchor) {
      existingAnchor.href = finalUrl;
      existingAnchor.target = "_blank";
      existingAnchor.rel = "noreferrer";
    } else {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        try {
          const anchor = document.createElement("a");
          anchor.href = finalUrl;
          anchor.target = "_blank";
          anchor.rel = "noreferrer";
          anchor.className = "text-primary underline underline-offset-2";
          range.surroundContents(anchor);
        } catch {
          document.execCommand("createLink", false, finalUrl);
        }
      }
    }
    triggerInputEvent();
    setShowLinkInput(false);
    setLinkUrl("");
  };

  const removeLink = () => {
    restoreSelection();
    const anchor = findParentAnchor();
    if (anchor) {
      const parent = anchor.parentNode;
      while (anchor.firstChild) {
        parent?.insertBefore(anchor.firstChild, anchor);
      }
      parent?.removeChild(anchor);
      triggerInputEvent();
    } else {
      document.execCommand("unlink");
      triggerInputEvent();
    }
    setShowLinkInput(false);
    setLinkUrl("");
    setExistingLinkUrl(null);
  };

  const TEXT_COLORS = [
    { label: "Default", value: "", color: "currentColor" },
    { label: "Red", value: "#ef4444", color: "#ef4444" },
    { label: "Orange", value: "#f97316", color: "#f97316" },
    { label: "Amber", value: "#f59e0b", color: "#f59e0b" },
    { label: "Green", value: "#22c55e", color: "#22c55e" },
    { label: "Teal", value: "#14b8a6", color: "#14b8a6" },
    { label: "Blue", value: "#3b82f6", color: "#3b82f6" },
    { label: "Indigo", value: "#6366f1", color: "#6366f1" },
    { label: "Purple", value: "#a855f7", color: "#a855f7" },
    { label: "Pink", value: "#ec4899", color: "#ec4899" },
    { label: "Rose", value: "#f43f5e", color: "#f43f5e" },
    { label: "Gray", value: "#9ca3af", color: "#9ca3af" },
  ];

  const openColorPicker = () => {
    saveSelection();
    setShowFontPicker(false);
    setShowLinkInput(false);
    setShowColorPicker(true);
  };

  const applyTextColor = (colorValue: string) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setShowColorPicker(false);
      return;
    }
    const range = sel.getRangeAt(0);

    const parent = range.commonAncestorContainer.parentElement;
    if (parent?.tagName === "SPAN" && parent.dataset.textColor) {
      if (!colorValue) {
        const frag = document.createDocumentFragment();
        while (parent.firstChild) frag.appendChild(parent.firstChild);
        parent.parentNode?.replaceChild(frag, parent);
      } else {
        parent.style.color = colorValue;
        parent.dataset.textColor = colorValue;
      }
    } else if (colorValue) {
      try {
        const span = document.createElement("span");
        span.style.color = colorValue;
        span.dataset.textColor = colorValue;
        range.surroundContents(span);
      } catch {
        const span = document.createElement("span");
        span.style.color = colorValue;
        span.dataset.textColor = colorValue;
        span.textContent = range.toString();
        range.deleteContents();
        range.insertNode(span);
      }
    }

    triggerInputEvent();
    setShowColorPicker(false);
  };

  const TEXT_FONTS = [
    { label: "Default", value: "", family: "inherit" },
    { label: "Inter", value: "Inter", family: "'Inter', sans-serif" },
    { label: "Poppins", value: "Poppins", family: "'Poppins', sans-serif" },
    { label: "DM Sans", value: "DM Sans", family: "'DM Sans', sans-serif" },
    { label: "Nunito", value: "Nunito", family: "'Nunito', sans-serif" },
    { label: "Outfit", value: "Outfit", family: "'Outfit', sans-serif" },
    { label: "Raleway", value: "Raleway", family: "'Raleway', sans-serif" },
    { label: "Work Sans", value: "Work Sans", family: "'Work Sans', sans-serif" },
    { label: "Manrope", value: "Manrope", family: "'Manrope', sans-serif" },
    { label: "Sora", value: "Sora", family: "'Sora', sans-serif" },
    { label: "Montserrat", value: "Montserrat", family: "'Montserrat', sans-serif" },
    { label: "Space Grotesk", value: "Space Grotesk", family: "'Space Grotesk', sans-serif" },
    { label: "Roboto", value: "Roboto", family: "'Roboto', sans-serif" },
    { label: "Open Sans", value: "Open Sans", family: "'Open Sans', sans-serif" },
    { label: "Jakarta", value: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', sans-serif" },
    { label: "Playfair Display", value: "Playfair Display", family: "'Playfair Display', serif" },
    { label: "Merriweather", value: "Merriweather", family: "'Merriweather', serif" },
    { label: "Lora", value: "Lora", family: "'Lora', serif" },
    { label: "Crimson Text", value: "Crimson Text", family: "'Crimson Text', serif" },
    { label: "Source Serif 4", value: "Source Serif 4", family: "'Source Serif 4', serif" },
    { label: "Libre Baskerville", value: "Libre Baskerville", family: "'Libre Baskerville', serif" },
    { label: "Space Mono", value: "Space Mono", family: "'Space Mono', monospace" },
    { label: "Fira Code", value: "Fira Code", family: "'Fira Code', monospace" },
    { label: "JetBrains Mono", value: "JetBrains Mono", family: "'JetBrains Mono', monospace" },
    { label: "Dancing Script", value: "Dancing Script", family: "'Dancing Script', cursive" },
    { label: "Architects Daughter", value: "Architects Daughter", family: "'Architects Daughter', cursive" },
  ];

  const openFontPicker = () => {
    saveSelection();
    setShowColorPicker(false);
    setShowLinkInput(false);
    setShowFontPicker(true);
  };

  const applyTextFont = (fontValue: string, fontFamily: string) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setShowFontPicker(false);
      return;
    }
    const range = sel.getRangeAt(0);

    const parent = range.commonAncestorContainer.parentElement;
    if (parent?.tagName === "SPAN" && parent.dataset.textFont) {
      if (!fontValue) {
        const frag = document.createDocumentFragment();
        while (parent.firstChild) frag.appendChild(parent.firstChild);
        parent.parentNode?.replaceChild(frag, parent);
      } else {
        parent.style.fontFamily = fontFamily;
        parent.dataset.textFont = fontValue;
      }
    } else if (fontValue) {
      try {
        const span = document.createElement("span");
        span.style.fontFamily = fontFamily;
        span.dataset.textFont = fontValue;
        range.surroundContents(span);
      } catch {
        const span = document.createElement("span");
        span.style.fontFamily = fontFamily;
        span.dataset.textFont = fontValue;
        span.textContent = range.toString();
        range.deleteContents();
        range.insertNode(span);
      }
    }

    triggerInputEvent();
    setShowFontPicker(false);
  };

  const execFormat = (cmd: string) => {
    if (cmd === "createLink") {
      openLinkInput();
      return;
    }

    if (cmd === "textColor") {
      openColorPicker();
      return;
    }

    if (cmd === "textFont") {
      openFontPicker();
      return;
    }

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
    { cmd: "textColor", icon: Palette, label: "Text Color", shortcut: "" },
    { cmd: "textFont", icon: Type, label: "Font", shortcut: "" },
  ];

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 bg-popover border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
      data-testid="inline-format-toolbar"
    >
      <div className="flex items-center gap-0.5 px-1 py-0.5">
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
                {cmd === "textColor" && activeColor ? (
                  <div className="relative">
                    <Icon className="h-3.5 w-3.5" />
                    <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full" style={{ backgroundColor: activeColor }} />
                  </div>
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs px-2 py-1">
              <span>{label}</span>
              {shortcut && <kbd className="ml-1.5 text-[10px] font-mono text-muted-foreground bg-muted/50 px-1 py-0.5 rounded">{shortcut}</kbd>}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {showColorPicker && (
        <div className="border-t px-2 py-2" data-testid="color-picker-panel">
          <div className="grid grid-cols-6 gap-1">
            {TEXT_COLORS.map(({ label, value, color }) => (
              <Tooltip key={label}>
                <TooltipTrigger asChild>
                  <button
                    className={`w-6 h-6 rounded-md border transition-all flex items-center justify-center ${
                      (activeColor === value) || (!activeColor && !value)
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        : "border-border hover:scale-110"
                    }`}
                    style={{ backgroundColor: value || undefined }}
                    onClick={() => applyTextColor(value)}
                    data-testid={`button-color-${label.toLowerCase()}`}
                  >
                    {!value && (
                      <span className="text-[10px] font-medium text-foreground">A</span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
      {showFontPicker && (
        <div className="border-t px-2 py-2 max-h-[280px] overflow-y-auto" data-testid="font-picker-panel">
          <div className="space-y-0.5">
            {TEXT_FONTS.map(({ label, value, family }) => (
              <button
                key={label}
                className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between ${
                  (activeFont === value) || (!activeFont && !value)
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
                style={{ fontFamily: family }}
                onClick={() => applyTextFont(value, family)}
                data-testid={`button-font-${label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span>{label}</span>
                {((activeFont === value) || (!activeFont && !value)) && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
      {showLinkInput && (
        <div className="border-t px-2 py-1.5 flex items-center gap-1.5" data-testid="link-input-panel">
          <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); applyLink(linkUrl); }
              if (e.key === "Escape") { e.preventDefault(); setShowLinkInput(false); setLinkUrl(""); }
            }}
            placeholder="Paste or type a link..."
            className="flex-1 min-w-[180px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            data-testid="input-link-url"
          />
          {existingLinkUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={removeLink}
                  data-testid="button-remove-link"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Remove link</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                onClick={() => applyLink(linkUrl)}
                data-testid="button-apply-link"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Apply link</TooltipContent>
          </Tooltip>
        </div>
      )}
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

  const getPageNumber = (page: KbPage, depth: number): string => {
    if (depth === 0) {
      const idx = rootPages.findIndex(p => p.id === page.id);
      return String(idx + 1);
    }
    const parent = pages.find(p => p.id === page.parentPageId);
    if (!parent) return "?";
    const siblings = getChildren(parent.id);
    const idx = siblings.findIndex(p => p.id === page.id);
    const parentNum = getPageNumber(parent, depth - 1);
    return `${parentNum}.${idx + 1}`;
  };

  const renderPage = (page: KbPage, depth: number) => {
    const children = getChildren(page.id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded[page.id] ?? true;
    const isActive = page.id === activePageId;
    const isEditing = editingId === page.id;
    const isDragging = dragId === page.id;
    const isDragOver = dragOverId === page.id;
    const pageNum = getPageNumber(page, depth);

    return (
      <div key={page.id}>
        <div
          className={`group flex items-center gap-2 px-2.5 py-2.5 rounded-md cursor-pointer transition-all ${
            isActive
              ? "bg-primary/10 border border-primary/20"
              : "hover-elevate border border-transparent"
          } ${isDragging ? "opacity-30" : ""} ${isDragOver ? "ring-1 ring-primary bg-primary/5" : ""}`}
          style={{ marginLeft: `${depth * 14}px` }}
          onClick={() => onSelectPage(page.id)}
          draggable={!isEditing && depth === 0}
          onDragStart={(e) => handleDragStart(e, page.id)}
          onDragOver={(e) => handleDragOver(e, page.id)}
          onDrop={(e) => handleDrop(e, page.id)}
          onDragEnd={() => { setDragId(null); setDragOverId(null); }}
          data-testid={`page-tree-item-${page.id}`}
        >
          {depth === 0 && (
            <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity" />
          )}

          <span className={`flex-shrink-0 flex items-center justify-center rounded text-[10px] font-bold leading-none ${
            depth === 0 ? "w-6 h-6" : "w-5 h-5"
          } ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {pageNum}
          </span>

          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [page.id]: !prev[page.id] })); }}
              className="p-0.5 flex-shrink-0 text-muted-foreground"
              data-testid={`button-toggle-${page.id}`}
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          )}

          {isEditing ? (
            <Input
              className="h-7 text-sm px-1.5 flex-1"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={finishRename}
              onKeyDown={(e) => { if (e.key === "Enter") finishRename(); if (e.key === "Escape") setEditingId(null); }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              data-testid={`input-rename-page-${page.id}`}
            />
          ) : (
            <span className={`truncate flex-1 ${depth === 0 ? "text-sm font-medium" : "text-xs"}`}>{page.title}</span>
          )}

          <div className="flex items-center gap-0.5 invisible group-hover:visible flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-1 rounded hover-elevate"
                  onClick={(e) => { e.stopPropagation(); onCreatePage(page.id); setExpanded((prev) => ({ ...prev, [page.id]: true })); }}
                  data-testid={`button-add-subpage-${page.id}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Add sub-page</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 rounded hover-elevate"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`button-page-menu-${page.id}`}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => startRename(page)} data-testid={`button-rename-page-${page.id}`}>
                  <Edit3 className="mr-2 h-3.5 w-3.5" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDeletePage(page.id)} data-testid={`button-delete-page-${page.id}`}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className={depth === 0 ? "ml-2 mt-0.5 border-l border-border/50 pl-0.5" : "mt-0.5"}>
            {children.map((child) => renderPage(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {rootPages.map((page) => renderPage(page, 0))}
      {pages.length === 0 && (
        <p className="text-xs text-muted-foreground px-3 py-6 text-center">No pages yet</p>
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
      <div className="absolute left-0 top-full z-[100] mt-1 bg-popover border rounded-md shadow-xl py-2 px-3 w-64" style={{ backgroundColor: 'hsl(var(--popover))' }} data-testid="slash-menu">
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
    <div ref={menuRef} className="absolute left-0 top-full z-[100] mt-1 bg-popover border rounded-md shadow-xl py-1.5 w-72 max-h-80 overflow-y-auto" style={{ backgroundColor: 'hsl(var(--popover))' }} data-testid="slash-menu">
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
  kbFontFamily,
}: {
  pageId: string;
  blocks: KbBlock[];
  onRefresh: () => void;
  pageTitle: string;
  onPageTitleChange: (title: string) => void;
  kbFontFamily?: string;
}) {
  const { toast } = useToast();
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const titleRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const pendingSavesRef = useRef<Record<string, AbortController>>({});
  const localContentMapRef = useRef<Record<string, string>>({});
  const isSavingRef = useRef(false);
  const savingIndicatorRef = useRef<HTMLDivElement>(null);
  const savingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const createBlockMutation = useMutation({
    mutationFn: async (data: { type: BlockType; sortOrder: number }) => {
      const res = await apiRequest("POST", `/api/kb-pages/${pageId}/blocks`, data);
      return res.json();
    },
    onSuccess: (newBlock: KbBlock) => {
      queryClient.setQueryData<KbBlock[]>(
        [`/api/kb-pages/${pageId}/blocks`],
        (old) => {
          if (!old) return [newBlock];
          const result = [...old];
          const insertAt = newBlock.sortOrder;
          result.splice(insertAt, 0, newBlock);
          return result;
        }
      );
      setFocusBlockId(newBlock.id);
    },
    onError: () => toast({ title: "Error", description: "Failed to add block.", variant: "destructive" }),
  });

  const saveBlockToServer = useCallback(async (id: string, data: Partial<KbBlock>) => {
    if (pendingSavesRef.current[id]) {
      pendingSavesRef.current[id].abort();
    }
    const controller = new AbortController();
    pendingSavesRef.current[id] = controller;
    isSavingRef.current = true;
    if (savingIndicatorRef.current) savingIndicatorRef.current.style.display = "flex";
    clearTimeout(savingTimeoutRef.current);
    try {
      await apiRequest("PATCH", `/api/kb-blocks/${id}`, data, controller.signal);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      if (controller.signal.aborted) return;
      console.error("Save block error:", id, err?.message);
      toast({ title: "Error", description: "Failed to save block.", variant: "destructive" });
    } finally {
      if (pendingSavesRef.current[id] === controller) {
        delete pendingSavesRef.current[id];
      }
      if (Object.keys(pendingSavesRef.current).length === 0) {
        savingTimeoutRef.current = setTimeout(() => {
          isSavingRef.current = false;
          if (savingIndicatorRef.current) savingIndicatorRef.current.style.display = "none";
        }, 600);
      }
    }
  }, []);

  const deleteBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      if (pendingSavesRef.current[id]) {
        pendingSavesRef.current[id].abort();
        delete pendingSavesRef.current[id];
      }
      await apiRequest("DELETE", `/api/kb-blocks/${id}`);
    },
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<KbBlock[]>(
        [`/api/kb-pages/${pageId}/blocks`],
        (old) => old?.filter((b) => b.id !== deletedId)
      );
      delete localContentMapRef.current[deletedId];
    },
    onError: () => toast({ title: "Error", description: "Failed to delete block.", variant: "destructive" }),
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (data: { blocks: { type: string; content: string; sortOrder: number }[] }) => {
      const res = await apiRequest("POST", `/api/kb-pages/${pageId}/blocks/bulk`, data);
      return res.json();
    },
    onSuccess: () => onRefresh(),
    onError: () => toast({ title: "Error", description: "Failed to paste content.", variant: "destructive" }),
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
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [focusBlockId]);

  const addBlock = useCallback((type: BlockType, afterIndex?: number) => {
    const sortOrder = afterIndex != null ? afterIndex + 1 : blocks.length;
    createBlockMutation.mutate({ type, sortOrder });
  }, [blocks.length]);

  const handleContentChange = useCallback((blockId: string, content: string) => {
    localContentMapRef.current[blockId] = content;
    saveBlockToServer(blockId, { content });
  }, [saveBlockToServer]);

  const handleTypeChange = useCallback((blockId: string, type: BlockType, preserveContent?: boolean) => {
    if (preserveContent) {
      const currentBlock = queryClient.getQueryData<KbBlock[]>([`/api/kb-pages/${pageId}/blocks`])?.find((b) => b.id === blockId);
      let content = localContentMapRef.current[blockId] ?? currentBlock?.content ?? "";
      const PLAIN_TEXT_TYPES: BlockType[] = ["code"];
      if (PLAIN_TEXT_TYPES.includes(type) && content) {
        const tmp = document.createElement("div");
        tmp.innerHTML = content;
        content = tmp.textContent || "";
      }
      localContentMapRef.current[blockId] = content;
      queryClient.setQueryData<KbBlock[]>(
        [`/api/kb-pages/${pageId}/blocks`],
        (old) => old?.map((b) => b.id === blockId ? { ...b, type, content } : b)
      );
      saveBlockToServer(blockId, { type, content });
      setFocusBlockId(blockId);
    } else {
      localContentMapRef.current[blockId] = "";
      queryClient.setQueryData<KbBlock[]>(
        [`/api/kb-pages/${pageId}/blocks`],
        (old) => old?.map((b) => b.id === blockId ? { ...b, type, content: "" } : b)
      );
      saveBlockToServer(blockId, { type, content: "" });
      setFocusBlockId(blockId);
    }
  }, [pageId, saveBlockToServer]);

  const handleEnterOnBlock = useCallback((blockIndex: number, currentType?: BlockType) => {
    const nextType = currentType && CONTINUATION_TYPES.includes(currentType) ? currentType : "text";
    addBlock(nextType, blockIndex);
  }, [addBlock]);

  const handleBackspaceOnEmpty = useCallback((blockId: string, blockIndex: number) => {
    if (blockIndex > 0) {
      setFocusBlockId(blocks[blockIndex - 1]?.id || null);
    }
    deleteBlockMutation.mutate(blockId);
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
        saveBlockToServer(newBlock.id, { content: block.content });
        queryClient.setQueryData<KbBlock[]>(
          [`/api/kb-pages/${pageId}/blocks`],
          (old) => old?.map((b) => b.id === newBlock.id ? { ...b, content: block.content } : b)
        );
      },
    });
  }, [blocks, pageId, saveBlockToServer]);

  const parseLineType = useCallback((line: string): { type: BlockType; content: string } => {
    const trimmed = line.trimStart();
    if (/^#{4,}\s+/.test(trimmed)) return { type: "heading3", content: trimmed.replace(/^#+\s+/, "") };
    if (/^###\s+/.test(trimmed)) return { type: "heading3", content: trimmed.replace(/^###\s+/, "") };
    if (/^##\s+/.test(trimmed)) return { type: "heading2", content: trimmed.replace(/^##\s+/, "") };
    if (/^#\s+/.test(trimmed)) return { type: "heading1", content: trimmed.replace(/^#\s+/, "") };
    if (/^[-*]\s+\[[ x]\]\s+/i.test(trimmed)) return { type: "todo", content: trimmed.replace(/^[-*]\s+\[[ x]\]\s+/i, "") };
    if (/^\[[ x]\]\s+/i.test(trimmed)) return { type: "todo", content: trimmed.replace(/^\[[ x]\]\s+/i, "") };
    if (/^[-*\u2022\u25E6\u25AA]\s+/.test(trimmed)) return { type: "bullet_list", content: trimmed.replace(/^[-*\u2022\u25E6\u25AA]\s+/, "") };
    if (/^\d+[.)]\s+/.test(trimmed)) return { type: "numbered_list", content: trimmed.replace(/^\d+[.)]\s+/, "") };
    if (/^>\s+/.test(trimmed)) return { type: "quote", content: trimmed.replace(/^>\s+/, "") };
    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) return { type: "divider", content: "" };
    return { type: "text", content: trimmed };
  }, []);

  const handleSmartPaste = useCallback((e: React.ClipboardEvent) => {
    const target = e.target as HTMLElement;
    const blockEl = target.closest("[data-block-id]") as HTMLElement | null;
    if (!blockEl) return;

    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const lines = text.split(/\n/);
    if (lines.length <= 1) return;

    const parsed: { type: BlockType; content: string }[] = [];
    for (const line of lines) {
      if (line.trim() === "") continue;
      parsed.push(parseLineType(line));
    }

    if (parsed.length <= 1) return;

    e.preventDefault();
    e.stopPropagation();

    const currentBlockId = blockEl.getAttribute("data-block-id");
    const currentIdx = blocks.findIndex((b) => b.id === currentBlockId);
    const insertAfter = currentIdx >= 0 ? currentIdx : blocks.length - 1;

    bulkCreateMutation.mutate({
      blocks: parsed.map((b, i) => ({ type: b.type, content: b.content, sortOrder: insertAfter + 1 + i })),
    });
  }, [blocks, parseLineType]);

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

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

  const isTitleFocusedRef = useRef(false);

  useEffect(() => {
    if (titleRef.current && !isTitleFocusedRef.current) {
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
    <div className="space-y-0 relative" ref={editorContainerRef} onPaste={handleSmartPaste} style={kbFontFamily ? { fontFamily: `'${kbFontFamily}', sans-serif` } : undefined}>
      <InlineFormatToolbar containerRef={editorContainerRef} />
      <div ref={savingIndicatorRef} className="absolute top-0 right-0 items-center gap-1.5 text-muted-foreground/50 z-10" style={{ display: "none" }} data-testid="save-indicator">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 save-pulse" />
        <span className="text-[11px] font-medium">Saving...</span>
      </div>
      <div
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        className="text-2xl font-bold outline-none mb-6 py-1 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 empty:before:pointer-events-none"
        data-placeholder="Untitled"
        onInput={handleTitleInput}
        onKeyDown={handleTitleKeyDown}
        onFocus={() => { isTitleFocusedRef.current = true; }}
        onBlur={() => { isTitleFocusedRef.current = false; }}
        data-testid="input-page-title"
      />

      {blocks.map((block, idx) => (
        <div key={block.id} className="relative" data-block-id={block.id} data-testid={`block-wrapper-${block.id}`}>
          {dragOverIdx === idx && dragIdx !== null && dragIdx !== idx && (
            <div className="absolute left-8 right-0 top-0 h-0.5 bg-primary rounded-full z-10 pointer-events-none" data-testid={`drop-indicator-${block.id}`} />
          )}
          <div
            className={`group relative flex items-start rounded-md ${
              dragIdx === idx ? "opacity-30" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOverIdx(idx);
            }}
            onDragLeave={() => { if (dragOverIdx === idx) setDragOverIdx(null); }}
            onDrop={(e) => { e.preventDefault(); handleDrop(idx); }}
            data-testid={`block-${block.id}`}
          >
            <div className="flex items-center gap-0 pt-1 w-[44px] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none group-hover:pointer-events-auto">
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
                  <button
                    className="cursor-grab active:cursor-grabbing p-0.5 rounded text-muted-foreground hover-elevate"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(idx));
                      setDragIdx(idx);
                    }}
                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                    data-testid={`grip-${block.id}`}
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="left" align="start" className="w-48">
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Turn into</div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {BLOCK_TYPES.filter((bt) => FORMAT_TYPES.includes(bt.type) && bt.type !== block.type).map((bt) => {
                      const Icon = bt.icon;
                      return (
                        <DropdownMenuItem
                          key={bt.type}
                          onClick={() => handleTypeChange(block.id, bt.type, true)}
                          data-testid={`action-turn-${bt.type}-${block.id}`}
                        >
                          <Icon className="h-3.5 w-3.5 mr-2" /> {bt.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
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
              blocks={blocks}
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
        </div>
      ))}

      {blocks.length === 0 ? (
        <div
          className="py-8 cursor-text group/empty"
          onClick={() => addBlock("text", -1)}
          data-testid="empty-editor-placeholder"
        >
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted/80 flex items-center justify-center group-hover/empty:bg-primary/10 transition-colors">
              <Type className="h-5 w-5 text-muted-foreground group-hover/empty:text-primary transition-colors" />
            </div>
            <div>
              <p className="text-muted-foreground/60 text-sm font-medium">Start writing or press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">/</kbd> for commands</p>
              <p className="text-muted-foreground/40 text-xs mt-1">Click here to begin</p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="min-h-[4rem] py-2 cursor-text group/add-end"
          onClick={() => addBlock("text", blocks.length - 1)}
          data-testid="add-block-end"
        >
          <div className="flex items-center gap-2 text-muted-foreground/0 group-hover/add-end:text-muted-foreground/30 transition-colors duration-200">
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">Add a block</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BlockContent({
  block,
  blockIndex,
  blocks,
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
  blocks: KbBlock[];
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
  const isFocusedRef = useRef(false);
  const lastSavedContentRef = useRef<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [pastedUrl, setPastedUrl] = useState<string | null>(null);

  const filteredTypes = useMemo(() =>
    BLOCK_TYPES.filter(
      (bt) => bt.label.toLowerCase().includes(slashFilter.toLowerCase()) || bt.type.includes(slashFilter.toLowerCase()) || bt.description.toLowerCase().includes(slashFilter.toLowerCase())
    ), [slashFilter]);

  useEffect(() => {
    registerRef(block.id, ref.current);
    lastSavedContentRef.current = null;
    return () => registerRef(block.id, null);
  }, [block.id]);

  const saveContent = useCallback((text: string) => {
    lastSavedContentRef.current = text;
    onContentChange(block.id, text);
  }, [block.id, onContentChange]);

  const isCodeBlock = block.type === "code";

  const getContent = () => {
    if (!ref.current) return "";
    if (isCodeBlock) return ref.current.textContent || "";
    let html = ref.current.innerHTML;
    html = html.replace(/<div><br\s*\/?><\/div>/gi, "");
    html = html.replace(/<div>(.*?)<\/div>/gi, "$1");
    html = html.replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/gi, "");
    return html;
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
    if (content === lastSavedContentRef.current) return;
    debounceRef.current = setTimeout(() => saveContent(content), 500);
  };

  const isUrl = (text: string) => /^https?:\/\/\S+$/i.test(text.trim());

  const handlePaste = (e: React.ClipboardEvent) => {
    if (isCodeBlock) return;
    const text = e.clipboardData.getData("text/plain").trim();
    if (isUrl(text)) {
      e.preventDefault();
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      const content = getContent();
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveContent(content), 500);
      setPastedUrl(text);
    }
  };

  const convertPastedUrlToLink = () => {
    if (!pastedUrl || !ref.current) return;
    const url = pastedUrl;
    setPastedUrl(null);
    const sel = window.getSelection();
    if (!sel) return;
    const walker = document.createTreeWalker(ref.current, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const idx = node.textContent?.indexOf(url);
      if (idx != null && idx >= 0) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + url.length);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
        anchor.className = "text-primary underline underline-offset-2";
        range.surroundContents(anchor);
        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(anchor);
        newRange.setEndAfter(anchor);
        sel.addRange(newRange);
        const content = getContent();
        clearTimeout(debounceRef.current);
        saveContent(content);
        break;
      }
    }
  };

  const dismissPastedUrl = () => setPastedUrl(null);

  const clearSlashContent = () => {
    if (!ref.current) return;
    const text = ref.current.innerText.trim();
    if (text.startsWith("/") && showSlashMenu) {
      ref.current.innerText = "";
      saveContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu) {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashMenu(false);
        setSlashFilter("");
        clearSlashContent();
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

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !isCodeBlock) {
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
          document.dispatchEvent(new CustomEvent("kb-open-link-input"));
        }
        return;
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && !isCodeBlock) {
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

    if (e.key === "Enter" && !showSlashMenu) {
      if (block.type === "code" && !e.shiftKey) {
        e.preventDefault();
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const newline = document.createTextNode("\n");
          range.insertNode(newline);
          range.setStartAfter(newline);
          range.setEndAfter(newline);
          sel.removeAllRanges();
          sel.addRange(range);
          if (ref.current && ref.current.textContent?.endsWith("\n")) {
            const spacer = document.createTextNode("\n");
            ref.current.appendChild(spacer);
          }
        }
        handleInput();
        return;
      }
      if (block.type === "code" && e.shiftKey) {
        e.preventDefault();
        clearTimeout(debounceRef.current);
        if (ref.current) saveContent(getContent());
        onEnter(blockIndex, "text" as BlockType);
        return;
      }
      if (!e.shiftKey) {
        e.preventDefault();
        clearTimeout(debounceRef.current);
        const content = ref.current ? getContent() : "";
        const isEmpty = !content || content === "<br>" || content === "\n";
        const shouldRevert = REVERT_TO_TEXT_TYPES.includes(block.type as BlockType);
        if (shouldRevert && isEmpty) {
          onTypeChange(block.id, "text" as BlockType);
          if (ref.current) {
            ref.current.innerHTML = "";
            setTimeout(() => {
              if (ref.current) {
                ref.current.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(ref.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
              }
            }, 60);
          }
        } else {
          if (ref.current) saveContent(content);
          onEnter(blockIndex, block.type as BlockType);
        }
      }
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

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (!ref.current) return;
    clearTimeout(debounceRef.current);
    if (showSlashMenu) {
      setShowSlashMenu(false);
      setSlashFilter("");
      clearSlashContent();
      return;
    }
    const content = getContent();
    if (content !== lastSavedContentRef.current) {
      saveContent(content);
    }
  };

  const selectSlashType = (type: BlockType) => {
    setShowSlashMenu(false);
    setSlashFilter("");
    onTypeChange(block.id, type);
    if (ref.current) {
      ref.current.innerText = "";
      setTimeout(() => {
        if (ref.current) {
          ref.current.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(ref.current);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 60);
    }
  };

  useEffect(() => {
    if (!ref.current) return;
    if (isFocusedRef.current) return;
    if (block.content === lastSavedContentRef.current) return;
    const currentContent = isCodeBlock ? ref.current.textContent : ref.current.innerHTML;
    if (currentContent === block.content) return;
    if (isCodeBlock) {
      ref.current.textContent = block.content;
    } else {
      ref.current.innerHTML = block.content;
    }
  }, [block.id, block.content, isCodeBlock]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const isFirstBlockOnEmptyPage = blockIndex === 0 && blocks.length === 1 && !(block.content?.trim());

  const placeholders: Record<string, string> = {
    text: isFirstBlockOnEmptyPage ? "Type '/' for commands, or start writing..." : "",
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

  const baseClass = "outline-none w-full min-h-[24px] whitespace-pre-wrap break-words";

  const [hoveredLink, setHoveredLink] = useState<{ url: string; top: number; left: number } | null>(null);
  const linkTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleLinkHover = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor && ref.current?.contains(anchor)) {
      clearTimeout(linkTooltipTimeoutRef.current);
      const rect = anchor.getBoundingClientRect();
      const containerRect = ref.current.getBoundingClientRect();
      setHoveredLink({
        url: anchor.href,
        top: rect.bottom - containerRect.top + 4,
        left: rect.left - containerRect.left,
      });
    } else {
      linkTooltipTimeoutRef.current = setTimeout(() => setHoveredLink(null), 200);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      window.open(anchor.href, "_blank", "noreferrer");
    }
  };

  const renderEditable = (className: string, placeholder: string) => (
    <div className="relative flex-1 min-w-0">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={`${baseClass} ${className}`}
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseMove={handleLinkHover}
        onMouseLeave={() => { linkTooltipTimeoutRef.current = setTimeout(() => setHoveredLink(null), 200); }}
        onClick={handleLinkClick}
        data-testid={`editor-block-${block.id}`}
      />
      {hoveredLink && (
        <div
          className="absolute z-50 flex items-center gap-1.5 bg-popover border rounded-md shadow-lg px-2 py-1 animate-in fade-in-0 duration-100"
          style={{ top: hoveredLink.top, left: hoveredLink.left, maxWidth: "320px" }}
          onMouseEnter={() => clearTimeout(linkTooltipTimeoutRef.current)}
          onMouseLeave={() => setHoveredLink(null)}
          data-testid="link-hover-tooltip"
        >
          <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{hoveredLink.url}</span>
          <button
            className="p-0.5 rounded text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(hoveredLink.url, "_blank", "noreferrer"); }}
            data-testid="button-open-link"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}
      {showSlashMenu && (
        <SlashCommandMenu
          filter={slashFilter}
          onSelect={selectSlashType}
          onClose={() => { setShowSlashMenu(false); setSlashFilter(""); clearSlashContent(); }}
          selectedIndex={slashSelectedIndex}
        />
      )}
      {pastedUrl && (
        <div
          className="absolute left-0 bottom-full mb-1 z-50 flex items-center gap-1 bg-popover border rounded-lg shadow-lg px-2 py-1.5 animate-in fade-in-0 zoom-in-95 duration-150"
          onMouseDown={(e) => e.preventDefault()}
          data-testid="paste-url-popup"
        >
          <span className="text-xs text-muted-foreground mr-1">Pasted URL:</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2 gap-1"
            onClick={dismissPastedUrl}
            data-testid="button-keep-text"
          >
            Dismiss
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-xs h-6 px-2 gap-1"
            onClick={convertPastedUrlToLink}
            data-testid="button-create-link"
          >
            <Link2 className="h-3 w-3" />
            Create Link
          </Button>
        </div>
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
        <div className="flex items-center gap-2 py-0.5">
          <span className="text-foreground flex-shrink-0 select-none text-[7px] leading-none" aria-hidden="true">●</span>
          {renderEditable("text-base", placeholders.bullet_list)}
        </div>
      );

    case "numbered_list": {
      let listNum = 1;
      for (let i = blockIndex - 1; i >= 0; i--) {
        if (blocks[i]?.type === "numbered_list") listNum++;
        else break;
      }
      return (
        <div className="flex items-start gap-2 py-0.5">
          <span className="text-foreground mt-[1px] flex-shrink-0 select-none text-base font-normal min-w-[1.5rem] text-right">{listNum}.</span>
          {renderEditable("text-base", placeholders.numbered_list)}
        </div>
      );
    }

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
            onFocus={handleFocus}
            onBlur={handleBlur}
            data-testid={`editor-block-${block.id}`}
          />
          {showSlashMenu && (
            <SlashCommandMenu
              filter={slashFilter}
              onSelect={selectSlashType}
              onClose={() => { setShowSlashMenu(false); setSlashFilter(""); clearSlashContent(); }}
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
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5 pointer-events-none" />
          <div className="flex-1 min-w-0">
            {renderEditable("text-base", placeholders.callout)}
          </div>
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

function normalizeImageUrl(url: string): string {
  const trimmed = url.trim();
  const ibbMatch = trimmed.match(/ibb\.co\/(?:([A-Za-z0-9]+)$)/);
  if (ibbMatch) return trimmed;
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(trimmed)) return trimmed;
  if (trimmed.includes("imgur.com") && !trimmed.includes("/a/")) {
    const id = trimmed.split("/").pop()?.split(".")[0];
    if (id) return `https://i.imgur.com/${id}.jpg`;
  }
  return trimmed;
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
  const [imgError, setImgError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => {
      onContentChange(block.id, res.objectPath);
      setInputVal(res.objectPath);
      setEditing(false);
      setImgError(false);
    },
    onError: () => toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" }),
  });

  useEffect(() => {
    setInputVal(block.content || "");
    setImgError(false);
    if (block.content) setEditing(false);
  }, [block.content]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const commit = () => {
    if (inputVal.trim() && inputVal !== block.content) {
      const finalUrl = type === "image" ? normalizeImageUrl(inputVal) : inputVal.trim();
      onContentChange(block.id, finalUrl);
      setInputVal(finalUrl);
      setEditing(false);
      setImgError(false);
    } else if (!inputVal.trim() && block.content) {
      setInputVal(block.content);
      setEditing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    await uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const placeholder = type === "image" ? "Paste a direct image URL (ending in .jpg, .png, etc.)..." : type === "video" ? "Paste video URL (YouTube, Vimeo, etc.)..." : "Paste link URL...";
  const hasContent = !!block.content;

  const preview = hasContent ? (
    type === "image" ? (
      <div className="rounded-md overflow-hidden bg-muted">
        {imgError ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <p className="text-sm">Image could not be loaded</p>
            <p className="text-xs">Make sure the URL points directly to an image file (e.g. ending in .jpg, .png)</p>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="mt-1">Change URL</Button>
          </div>
        ) : (
          <img
            src={block.content}
            alt="Block image"
            className="max-w-full h-auto"
            onError={() => setImgError(true)}
            data-testid={`img-block-${block.id}`}
          />
        )}
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
        <div className="space-y-2">
          {type === "image" && (
            <>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                data-testid={`button-upload-image-${block.id}`}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isUploading ? "Uploading..." : "Upload Image"}
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 border-t" />
                <span>or paste a direct image URL</span>
                <div className="flex-1 border-t" />
              </div>
            </>
          )}
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
          {type === "image" && (
            <p className="text-[11px] text-muted-foreground">Tip: Use a direct image link ending in .jpg, .png, .gif, .webp — not a page link from image hosting sites.</p>
          )}
        </div>
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
  showSettingsExternal,
  onCloseSettings,
}: {
  kb: KnowledgeBase;
  kbId: string;
  pageCount: number;
  showSettingsExternal?: boolean;
  onCloseSettings?: () => void;
}) {
  const { toast } = useToast();
  const [showSettingsInternal, setShowSettingsInternal] = useState(false);
  const showSettings = showSettingsExternal ?? showSettingsInternal;
  const setShowSettings = (v: boolean) => {
    setShowSettingsInternal(v);
    if (!v && onCloseSettings) onCloseSettings();
  };
  const [title, setTitle] = useState(kb.title || "");
  const [description, setDescription] = useState(kb.description || "");
  const [coverImageUrl, setCoverImageUrl] = useState(kb.coverImageUrl || "");
  const [priceCents, setPriceCents] = useState(kb.priceCents || 0);
  const [fontFamily, setFontFamily] = useState(kb.fontFamily || "");
  const [copied, setCopied] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const { uploadFile: uploadCoverFile, isUploading: isCoverUploading } = useUpload({
    onSuccess: (res) => {
      setCoverImageUrl(res.objectPath);
    },
    onError: () => toast({ title: "Upload failed", description: "Could not upload cover image.", variant: "destructive" }),
  });

  useEffect(() => {
    setTitle(kb.title || "");
    setDescription(kb.description || "");
    setCoverImageUrl(kb.coverImageUrl || "");
    setPriceCents(kb.priceCents || 0);
    setFontFamily(kb.fontFamily || "");
  }, [kb]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    await uploadCoverFile(file);
    if (coverFileRef.current) coverFileRef.current.value = "";
  };

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
    updateMutation.mutate({ title: title.trim() || kb.title, description, coverImageUrl: coverImageUrl || null, priceCents, fontFamily: fontFamily || null });
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
      <div className="flex items-center gap-2">
        {kb.isPublished ? (
          <Badge variant="secondary" className="text-[11px]">Published</Badge>
        ) : (
          <Badge variant="outline" className="text-[11px]">Draft</Badge>
        )}
        <div className="flex-1" />
        {kb.isPublished && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => window.open(viewerUrl, "_blank")} data-testid="button-preview-kb">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview</TooltipContent>
          </Tooltip>
        )}
        {kb.isPublished && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={copyLink} data-testid="button-copy-kb-link">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copied!" : "Copy link"}</TooltipContent>
          </Tooltip>
        )}
        <Button
          variant={kb.isPublished ? "outline" : "default"}
          size="sm"
          onClick={togglePublish}
          disabled={updateMutation.isPending}
          data-testid="button-toggle-publish"
        >
          {updateMutation.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
          {kb.isPublished ? "Unpublish" : "Publish"}
        </Button>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Knowledge Base Settings</DialogTitle>
            <DialogDescription>Configure how your content appears to readers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Knowledge base title..."
                data-testid="input-kb-settings-title"
              />
            </div>
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
              <Label>Cover Image</Label>
              <p className="text-xs text-muted-foreground">Recommended: 1024 x 1024px (square)</p>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
                data-testid="input-kb-cover-file"
              />
              {coverImageUrl ? (
                <div className="relative group/cover">
                  <div className="rounded-md overflow-hidden bg-muted w-full max-w-[256px] aspect-square">
                    <img src={coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" data-testid="img-kb-cover-preview" />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 invisible group-hover/cover:visible">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => coverFileRef.current?.click()}
                      disabled={isCoverUploading}
                      data-testid="button-kb-cover-replace"
                    >
                      {isCoverUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setCoverImageUrl("")}
                      data-testid="button-kb-cover-remove"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full max-w-[256px] aspect-square rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover-elevate transition-colors"
                  onClick={() => coverFileRef.current?.click()}
                  disabled={isCoverUploading}
                  data-testid="button-kb-cover-upload"
                >
                  {isCoverUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Click to upload cover image</span>
                    </>
                  )}
                </button>
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
            <div className="space-y-1.5">
              <Label>Font Family</Label>
              <p className="text-xs text-muted-foreground">Choose a default font for all content in this knowledge base.</p>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-testid="select-kb-font-family"
              >
                <option value="">System Default</option>
                {[
                  { label: "Inter", value: "Inter", family: "'Inter', sans-serif" },
                  { label: "Poppins", value: "Poppins", family: "'Poppins', sans-serif" },
                  { label: "DM Sans", value: "DM Sans", family: "'DM Sans', sans-serif" },
                  { label: "Nunito", value: "Nunito", family: "'Nunito', sans-serif" },
                  { label: "Outfit", value: "Outfit", family: "'Outfit', sans-serif" },
                  { label: "Raleway", value: "Raleway", family: "'Raleway', sans-serif" },
                  { label: "Work Sans", value: "Work Sans", family: "'Work Sans', sans-serif" },
                  { label: "Manrope", value: "Manrope", family: "'Manrope', sans-serif" },
                  { label: "Sora", value: "Sora", family: "'Sora', sans-serif" },
                  { label: "Playfair Display", value: "Playfair Display", family: "'Playfair Display', serif" },
                  { label: "Merriweather", value: "Merriweather", family: "'Merriweather', serif" },
                  { label: "Lora", value: "Lora", family: "'Lora', serif" },
                  { label: "Crimson Text", value: "Crimson Text", family: "'Crimson Text', serif" },
                  { label: "Source Serif 4", value: "Source Serif 4", family: "'Source Serif 4', serif" },
                  { label: "Space Mono", value: "Space Mono", family: "'Space Mono', monospace" },
                  { label: "Fira Code", value: "Fira Code", family: "'Fira Code', monospace" },
                  { label: "JetBrains Mono", value: "JetBrains Mono", family: "'JetBrains Mono', monospace" },
                  { label: "Dancing Script", value: "Dancing Script", family: "'Dancing Script', cursive" },
                ].map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.family }}>
                    {f.label}
                  </option>
                ))}
              </select>
              {fontFamily && (
                <p className="text-xs mt-1 px-1 py-1.5 rounded bg-muted" style={{ fontFamily: `'${fontFamily}', sans-serif` }}>
                  The quick brown fox jumps over the lazy dog.
                </p>
              )}
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
  const [showKbSettings, setShowKbSettings] = useState(false);

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
    staleTime: Infinity,
    refetchOnWindowFocus: false,
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
        <div className="p-3 border-b">
          <div className="flex items-center gap-1.5 mb-3">
            <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => navigate("/dashboard/content-creator")} data-testid="button-back-to-kbs">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <DebouncedInput
                className="h-auto text-sm font-semibold border-none bg-transparent px-1 py-0.5 leading-snug truncate"
                value={kb.title}
                onChange={(val) => { if (val.trim()) updateKbTitleMutation.mutate(val.trim()); }}
                data-testid="input-kb-title"
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => setShowKbSettings(true)} data-testid="button-kb-settings-top">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </div>
          <KbSettingsPanel kb={kb} kbId={kbId} pageCount={pages.length} showSettingsExternal={showKbSettings} onCloseSettings={() => setShowKbSettings(false)} />
        </div>

        <div className="flex-1 overflow-y-auto p-2.5">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pages</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{pages.length}</Badge>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => createPageMutation.mutate(null)} data-testid="button-add-page">
                  <Plus className="h-4 w-4" />
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

      <div className="flex-1 overflow-y-auto min-h-0">
        {activePageId && activePage ? (
          <div className="max-w-3xl mx-auto p-8">
            <BlockEditor
              pageId={activePageId}
              blocks={blocks}
              onRefresh={() => refetchBlocks()}
              pageTitle={activePage.title}
              onPageTitleChange={handlePageTitleChange}
              kbFontFamily={kb?.fontFamily || undefined}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-lg">No page selected</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">Select a page from the sidebar or create a new one to start building your content.</p>
            </div>
            <Button onClick={() => createPageMutation.mutate(null)} className="gap-2" data-testid="button-create-first-page">
              <Plus className="h-4 w-4" />
              Create First Page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
