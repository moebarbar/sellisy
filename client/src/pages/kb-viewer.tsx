import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, FileText, BookOpen, ExternalLink, Link as LinkIcon } from "lucide-react";

interface KbViewPage {
  id: string;
  title: string;
  parentPageId: string | null;
  sortOrder: number;
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
}: {
  pages: KbViewPage[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
            isActive ? "bg-accent text-accent-foreground font-medium" : "hover-elevate"
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => onSelectPage(page.id)}
          data-testid={`viewer-page-${page.id}`}
        >
          {hasChildren ? (
            <button onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [page.id]: !prev[page.id] })); }}>
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
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
  const [activePageId, setActivePageId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ knowledgeBase: any; pages: KbViewPage[] }>({
    queryKey: ["/api/kb", kbId, "view"],
    queryFn: async () => {
      const res = await fetch(`/api/kb/${kbId}/view`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!kbId,
  });

  const { data: pageData } = useQuery<{ page: KbViewPage; blocks: KbViewBlock[] }>({
    queryKey: ["/api/kb", kbId, "view/page", activePageId],
    queryFn: async () => {
      const res = await fetch(`/api/kb/${kbId}/view/page/${activePageId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!kbId && !!activePageId,
  });

  useEffect(() => {
    if (data?.pages && data.pages.length > 0 && !activePageId) {
      setActivePageId(data.pages[0].id);
    }
  }, [data, activePageId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  const { knowledgeBase, pages } = data;

  return (
    <div className="min-h-screen flex" data-testid="kb-viewer">
      <aside className="w-64 flex-shrink-0 border-r bg-muted/30 p-4 space-y-4">
        <div>
          <h2 className="font-bold text-lg" data-testid="text-viewer-title">{knowledgeBase.title}</h2>
          {knowledgeBase.description && (
            <p className="text-xs text-muted-foreground mt-1">{knowledgeBase.description}</p>
          )}
        </div>
        <ViewerPageTree pages={pages} activePageId={activePageId} onSelectPage={setActivePageId} />
      </aside>

      <main className="flex-1 overflow-y-auto">
        {activePageId && pageData ? (
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
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a page from the sidebar</p>
          </div>
        )}
      </main>
    </div>
  );
}
