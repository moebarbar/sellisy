import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Download, AlertCircle, ArrowLeft, Package, Clock, FileDown } from "lucide-react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/use-page-meta";

type SuccessData = {
  order: {
    id: string;
    buyerEmail: string;
    totalCents: number;
    status: string;
  };
  downloadToken: string;
  store?: { name: string; slug: string } | null;
  items?: { title: string; priceCents: number }[];
  fileCount?: number;
};

type DownloadData = {
  files?: { name: string; url: string }[];
  message?: string;
};

export default function CheckoutSuccessPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");
  const orderId = params.get("order_id");

  const identifier = sessionId || orderId;

  usePageMeta({
    title: "Order Confirmation",
    description: "Your purchase is complete. Download your products here.",
  });

  const { data, isLoading, error } = useQuery<SuccessData>({
    queryKey: ["/api/checkout/success", identifier],
    enabled: !!identifier,
    refetchInterval: (query) => {
      const d = query.state.data as SuccessData | undefined;
      if (d && d.order.status === "PENDING") return 3000;
      return false;
    },
  });

  if (!identifier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-xl font-bold mb-2">Invalid Link</h1>
            <p className="text-muted-foreground mb-4">This link doesn't seem right.</p>
            <Link href="/">
              <Button variant="outline" data-testid="button-go-home">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12">
            <Skeleton className="h-12 w-12 rounded-full mb-4" />
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-xl font-bold mb-2">Order Not Found</h1>
            <p className="text-muted-foreground mb-4">
              We couldn't find your order. It may still be processing.
            </p>
            <Link href="/">
              <Button variant="outline" data-testid="button-go-home-error">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = data.order.status === "PENDING";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-lg w-full">
        <CardContent className="flex flex-col items-center py-12 text-center">
          {isPending ? (
            <>
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-amber-500/10 mb-5">
                <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold mb-2" data-testid="text-pending-title">Processing Payment</h1>
              <p className="text-muted-foreground mb-1">
                Your payment is being confirmed. This usually takes a few seconds.
              </p>
              <p className="text-sm text-muted-foreground">
                This page will update automatically.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mb-5">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2" data-testid="text-success-title">Payment Successful</h1>
              <p className="text-muted-foreground mb-1">
                Thank you for your purchase!
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Order total: ${(data.order.totalCents / 100).toFixed(2)}
              </p>

              {data.items && data.items.length > 0 && (
                <div className="w-full mb-6 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Items purchased</span>
                  </div>
                  <div className="space-y-2">
                    {data.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-md bg-muted/50" data-testid={`text-item-${i}`}>
                        <span>{item.title}</span>
                        <span className="text-muted-foreground">${(item.priceCents / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.downloadToken && (
                <DownloadSection token={data.downloadToken} fileCount={data.fileCount || 0} />
              )}

              {data.store && (
                <Link href={`/s/${data.store.slug}/portal`}>
                  <Button variant="outline" className="mt-4" data-testid="button-view-purchases">
                    <Package className="mr-2 h-4 w-4" />
                    View Your Purchases
                  </Button>
                </Link>
              )}

              {data.store && (
                <Link href={`/s/${data.store.slug}`}>
                  <Button variant="ghost" className="mt-3" data-testid="button-back-store">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to {data.store.name}
                  </Button>
                </Link>
              )}

              <Link href="/">
                <Button variant="ghost" className="mt-1" data-testid="button-back-home">
                  Back to Home
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DownloadSection({ token, fileCount }: { token: string; fileCount: number }) {
  const [files, setFiles] = useState<{ name: string; url: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [noFiles, setNoFiles] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/download/${token}`, { redirect: "manual" });
      if (res.type === "opaqueredirect" || res.status === 301 || res.status === 302) {
        window.location.href = `/api/download/${token}`;
        return;
      }
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        setFiles(data.files);
      } else {
        setNoFiles(true);
      }
    } catch {
      window.location.href = `/api/download/${token}`;
    } finally {
      setLoading(false);
    }
  };

  if (noFiles) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="text-no-files">
        No downloadable files available for this order.
      </p>
    );
  }

  if (files) {
    return (
      <div className="w-full space-y-2" data-testid="download-files-list">
        <p className="text-sm font-medium flex items-center gap-2">
          <FileDown className="h-4 w-4 text-muted-foreground" />
          Your files ({files.length})
        </p>
        {files.map((file, i) => (
          <a
            key={i}
            href={file.url}
            download={file.name}
            className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50 text-sm hover-elevate"
            data-testid={`link-download-file-${i}`}
          >
            <span className="truncate mr-2">{file.name}</span>
            <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        ))}
      </div>
    );
  }

  return (
    <Button onClick={handleDownload} disabled={loading} data-testid="button-download">
      {loading ? (
        <Clock className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {fileCount > 1 ? `Download Files (${fileCount})` : "Download File"}
    </Button>
  );
}
