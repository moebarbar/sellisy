import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Download, AlertCircle } from "lucide-react";
import { Link } from "wouter";

type SuccessData = {
  order: {
    id: string;
    buyerEmail: string;
    totalCents: number;
    status: string;
  };
  downloadToken: string;
};

export default function CheckoutSuccessPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");
  const orderId = params.get("order_id");

  const { data, isLoading, error } = useQuery<SuccessData>({
    queryKey: ["/api/checkout/success", orderId || sessionId],
    enabled: !!(orderId || sessionId),
  });

  if (!orderId && !sessionId) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center py-12 text-center">
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
          {data.downloadToken && (
            <a href={`/api/download/${data.downloadToken}`}>
              <Button data-testid="button-download">
                <Download className="mr-2 h-4 w-4" />
                Download Files
              </Button>
            </a>
          )}
          <Link href="/">
            <Button variant="ghost" className="mt-3" data-testid="button-back-home">
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
