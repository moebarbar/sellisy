import { useState, useEffect } from "react";
import { useRoute, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, FileText, BookOpen, Lock, Link as LinkIcon } from "lucide-react";

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
  const rootPages = pages.filter((p) => !p.parentPageId);
  const getChildren = (parentId: string) => pages.filter((p) => p.parentPageId === parentId);

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

function BlockRenderer({ block }: { block: KbViewBlock }) {
  switch (block.type) {
    case "heading1":
      return <h1 className="text-3xl font-bold py-2">{block.content}</h1>;
    case "heading2":
      return <h2 className="text-2xl font-semibold py-1.5">{block.content}</h2>;
    case "heading3":
      return <h3 className="text-xl font-medium py-1">{block.content}</h3>;
    case "image":
      return block.content ? (
        <div className="py-2 rounded-md overflow-hidden">
          <img src={block.content} alt="" className="max-w-full h-auto rounded-md" />
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
      return block.content ? <p className="py-0.5 whitespace-pre-wrap leading-relaxed">{block.content}</p> : null;
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

  const { data, isLoading, error } = useQuery<{ knowledgeBase: any; pages: KbViewPage[]; hasAccess: boolean }>({
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
      setActivePageId(data.pages[0].id);
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

  const { knowledgeBase, pages, hasAccess } = data;

  return (
    <div className="min-h-screen flex bg-background" data-testid="kb-viewer">
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
            <p className="text-sm text-muted-foreground">
              If you have already purchased this content, use the access link from your order confirmation.
            </p>
          </div>
        ) : activePageId && pageData ? (
          <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6" data-testid="text-viewer-page-title">{pageData.page.title}</h1>
            <div className="space-y-1">
              {pageData.blocks.map((block) => (
                <BlockRenderer key={block.id} block={block} />
              ))}
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
