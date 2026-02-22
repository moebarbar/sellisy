import { useState, useEffect, useMemo } from "react";
import { useRoute, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  BookOpen,
  Lock,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Copy,
} from "lucide-react";

function CodeBlockViewer({ content, id }: { content: string; id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-md bg-muted/60 border p-3 my-1 overflow-x-auto relative group/code">
      <button
        className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border text-muted-foreground hover:text-foreground opacity-0 group-hover/code:opacity-100 transition-opacity z-10"
        onClick={() => {
          navigator.clipboard.writeText(content);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        data-testid={`copy-code-${id}`}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="font-mono text-sm whitespace-pre-wrap">{content}</pre>
    </div>
  );
}

interface KbViewPage {
  id: string;
  title: string;
  parentPageId: string | null;
  sortOrder: number;
  locked?: boolean;
}

interface KbViewBlock {
  id: string;
  type: string;
  content: string;
  sortOrder: number;
}

function ViewerPageTree({
  pages,
  activePageId,
  onSelectPage,
  hasAccess,
}: {
  pages: KbViewPage[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  hasAccess: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const rootPages = pages
    .filter((p) => !p.parentPageId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const getChildren = (parentId: string) =>
    pages.filter((p) => p.parentPageId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  const renderPage = (page: KbViewPage, depth: number) => {
    const children = getChildren(page.id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded[page.id] ?? true;
    const isActive = page.id === activePageId;

    return (
      <div key={page.id}>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
            !hasAccess ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          } ${isActive ? "bg-accent text-accent-foreground font-medium" : hasAccess ? "hover-elevate" : ""}`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => hasAccess && onSelectPage(page.id)}
          data-testid={`viewer-page-${page.id}`}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [page.id]: !prev[page.id] })); }}
              disabled={!hasAccess}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : !hasAccess ? (
            <Lock className="h-3 w-3 text-muted-foreground" />
          ) : (
            <FileText className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="truncate">{page.title}</span>
        </div>
        {hasChildren && isExpanded && children.map((child) => renderPage(child, depth + 1))}
      </div>
    );
  };

  return <div className="space-y-0.5">{rootPages.map((page) => renderPage(page, 0))}</div>;
}

function parseTodoContent(content: string): { checked: boolean; text: string } {
  const match = content.match(/^\[([ x])\]\s*([\s\S]*)/);
  if (match) {
    return { checked: match[1] === "x", text: match[2] };
  }
  return { checked: false, text: content };
}

const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'mark', 'code', 'span', 'a', 'br', 'sub', 'sup', 's', 'del'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'data-color', 'data-font', 'class'],
  ALLOW_DATA_ATTR: true,
};

function RichContent({ html, className }: { html: string; className?: string }) {
  const hasHtml = /<[a-z][\s\S]*>/i.test(html);
  if (hasHtml) {
    const clean = DOMPurify.sanitize(html, PURIFY_CONFIG);
    return <span className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
  }
  return <span className={className}>{html}</span>;
}

function BlockRenderer({ block, listNumber }: { block: KbViewBlock; listNumber?: number }) {
  const [toggleOpen, setToggleOpen] = useState(false);

  switch (block.type) {
    case "heading1":
      return <h1 className="text-3xl font-bold py-2"><RichContent html={block.content} /></h1>;
    case "heading2":
      return <h2 className="text-2xl font-semibold py-1.5"><RichContent html={block.content} /></h2>;
    case "heading3":
      return <h3 className="text-xl font-medium py-1"><RichContent html={block.content} /></h3>;

    case "bullet_list":
      return (
        <div className="flex items-start gap-2 py-0.5 pl-2">
          <span className="text-muted-foreground mt-[3px] flex-shrink-0">&#8226;</span>
          <div className="whitespace-pre-wrap min-w-0"><RichContent html={block.content} /></div>
        </div>
      );

    case "numbered_list":
      return (
        <div className="flex items-start gap-2 py-0.5 pl-2">
          <span className="text-muted-foreground mt-[1px] flex-shrink-0 text-sm font-medium min-w-[1.25rem] text-right">{listNumber ?? 1}.</span>
          <div className="whitespace-pre-wrap min-w-0"><RichContent html={block.content} /></div>
        </div>
      );

    case "todo": {
      const parsed = parseTodoContent(block.content);
      return (
        <div className="flex items-start gap-2 py-0.5 pl-2">
          <div className={`mt-[3px] flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
            parsed.checked ? "bg-primary border-primary" : "border-muted-foreground/40"
          }`}>
            {parsed.checked && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
          <div className={`whitespace-pre-wrap min-w-0 ${parsed.checked ? "line-through text-muted-foreground" : ""}`}><RichContent html={parsed.text} /></div>
        </div>
      );
    }

    case "toggle": {
      const parts = block.content.split("\n---\n");
      const title = parts[0] || "";
      const body = parts.slice(1).join("\n---\n") || "";
      return (
        <div className="rounded-md border bg-muted/20 my-1">
          <button
            className="flex items-center gap-1 px-3 py-2 w-full text-left"
            onClick={() => setToggleOpen(!toggleOpen)}
          >
            {toggleOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            <span className="font-medium"><RichContent html={title} /></span>
          </button>
          {toggleOpen && body && (
            <div className="px-3 pb-3 pl-9 text-sm whitespace-pre-wrap"><RichContent html={body} /></div>
          )}
        </div>
      );
    }

    case "code":
      return <CodeBlockViewer content={block.content} id={block.id} />;

    case "quote":
      return (
        <div className="border-l-[3px] border-muted-foreground/30 pl-4 py-1 my-1">
          <div className="italic text-muted-foreground whitespace-pre-wrap"><RichContent html={block.content} /></div>
        </div>
      );

    case "callout":
      return (
        <div className="rounded-md bg-muted/50 border px-4 py-3 flex items-start gap-3 my-1">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm whitespace-pre-wrap min-w-0"><RichContent html={block.content} /></div>
        </div>
      );

    case "divider":
      return <hr className="border-border my-3" />;

    case "image":
      return block.content ? (
        <div className="py-2 rounded-md overflow-hidden">
          <img
            src={block.content}
            alt=""
            className="max-w-full h-auto rounded-md"
            onError={(e) => {
              const container = (e.target as HTMLImageElement).parentElement;
              if (container) container.style.display = "none";
            }}
          />
        </div>
      ) : null;

    case "video":
      return block.content ? (
        <div className="py-2 aspect-video rounded-md overflow-hidden">
          <iframe
            src={block.content.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
            className="w-full h-full rounded-md"
            allowFullScreen
          />
        </div>
      ) : null;

    case "link":
      return block.content ? (
        <div className="py-1">
          <a
            href={block.content}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-primary underline underline-offset-2"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            {block.content}
          </a>
        </div>
      ) : null;

    default:
      return block.content ? <div className="py-0.5 whitespace-pre-wrap leading-relaxed"><RichContent html={block.content} /></div> : null;
  }
}

export default function KbViewerPage() {
  const [, params] = useRoute("/kb/:id");
  const kbId = params?.id || "";
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const accessToken = searchParams.get("token") || "";
  const [activePageId, setActivePageId] = useState<string | null>(null);

  const tokenParam = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";

  const { data, isLoading, error } = useQuery<{ knowledgeBase: any; pages: KbViewPage[]; hasAccess: boolean; purchaseUrl?: string | null }>({
    queryKey: ["/api/kb", kbId, "view", accessToken],
    queryFn: async () => {
      const res = await fetch(`/api/kb/${kbId}/view${tokenParam}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!kbId,
  });

  const { data: pageData, error: pageError } = useQuery<{ page: KbViewPage; blocks: KbViewBlock[] }>({
    queryKey: ["/api/kb", kbId, "view/page", activePageId, accessToken],
    queryFn: async () => {
      const res = await fetch(`/api/kb/${kbId}/view/page/${activePageId}${tokenParam}`);
      if (!res.ok) throw new Error(res.status === 403 ? "Purchase required" : "Not found");
      return res.json();
    },
    enabled: !!kbId && !!activePageId && !!data?.hasAccess,
  });

  useEffect(() => {
    if (data?.pages && data.pages.length > 0 && !activePageId && data.hasAccess) {
      const sorted = [...data.pages].filter(p => !p.parentPageId).sort((a, b) => a.sortOrder - b.sortOrder);
      setActivePageId(sorted[0]?.id || data.pages[0].id);
    }
  }, [data, activePageId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-1">Content not available</h2>
            <p className="text-sm text-muted-foreground">This knowledge base is not published or does not exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { knowledgeBase, pages, hasAccess, purchaseUrl } = data;

  return (
    <div className="min-h-screen flex bg-background" data-testid="kb-viewer" style={knowledgeBase.fontFamily ? { fontFamily: `'${knowledgeBase.fontFamily}', sans-serif` } : undefined}>
      <aside className="w-64 flex-shrink-0 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b space-y-2">
          <h2 className="font-bold text-lg leading-tight" data-testid="text-viewer-title">{knowledgeBase.title}</h2>
          {knowledgeBase.description && (
            <p className="text-xs text-muted-foreground">{knowledgeBase.description}</p>
          )}
          {knowledgeBase.priceCents > 0 && (
            <Badge variant="secondary">${(knowledgeBase.priceCents / 100).toFixed(2)}</Badge>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <ViewerPageTree
            pages={pages}
            activePageId={activePageId}
            onSelectPage={setActivePageId}
            hasAccess={hasAccess}
          />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {!hasAccess ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-8">
            <Lock className="h-16 w-16 text-muted-foreground" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Premium Content</h2>
              <p className="text-muted-foreground max-w-md">
                This knowledge base requires a purchase to access.
                {knowledgeBase.priceCents > 0 && (
                  <> It is available for <span className="font-semibold text-foreground">${(knowledgeBase.priceCents / 100).toFixed(2)}</span>.</>
                )}
              </p>
            </div>
            {purchaseUrl && (
              <Button asChild size="lg" data-testid="button-purchase-kb">
                <a href={purchaseUrl}>Purchase Access</a>
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              {purchaseUrl ? "Or if" : "If"} you have already purchased this content, use the access link from your order confirmation.
            </p>
          </div>
        ) : activePageId && pageData ? (
          <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6" data-testid="text-viewer-page-title">{pageData.page.title}</h1>
            <div className="space-y-0.5">
              {pageData.blocks.map((block, idx) => {
                let listNumber: number | undefined;
                if (block.type === "numbered_list") {
                  listNumber = 1;
                  for (let i = idx - 1; i >= 0; i--) {
                    if (pageData.blocks[i]?.type === "numbered_list") listNumber++;
                    else break;
                  }
                }
                return <BlockRenderer key={block.id} block={block} listNumber={listNumber} />;
              })}
              {pageData.blocks.length === 0 && (
                <p className="text-muted-foreground py-8 text-center">This page has no content yet.</p>
              )}
            </div>
          </div>
        ) : hasAccess && pages.length > 0 ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="h-8 w-48" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No pages available.</p>
          </div>
        )}
      </main>
    </div>
  );
}
