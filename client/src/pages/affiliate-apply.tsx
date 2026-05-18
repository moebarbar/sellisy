import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Handshake, AlertCircle } from "lucide-react";

type StoreInfo = {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  affiliateProgramEnabled: boolean;
  affiliateDefaultRateBps: number;
  affiliateCookieDays: number;
};

export default function AffiliateApplyPage() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug || "";

  useEffect(() => {
    document.title = `Apply as Affiliate - Sellisy`;
  }, []);

  const { data: store, isLoading, error } = useQuery<StoreInfo>({
    queryKey: [`/api/affiliate/public/store/${slug}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/affiliate/public/store/${slug}`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !store) {
    return <NotFound />;
  }

  if (!store.affiliateProgramEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center py-12">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Not accepting affiliates</h2>
            <p className="text-sm text-muted-foreground">
              <strong>{store.name}</strong> isn't currently running an affiliate program.
              Check back later or reach out to the owner directly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ApplyForm store={store} />;
}

function ApplyForm({ store }: { store: StoreInfo }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ratePercent = Math.round(store.affiliateDefaultRateBps / 100);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/affiliate/apply", {
        storeSlug: store.slug,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        code: code.trim().toLowerCase(),
        message: message.trim() || undefined,
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitted(true);
      } else {
        setError(data.message || "Application failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Application failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center py-12" data-testid="apply-success">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Application submitted</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Thanks! We sent a confirmation to <strong>{email}</strong>. The owner of{" "}
              <strong>{store.name}</strong> will review and email you again once you're approved
              with your unique tracking link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex items-start justify-center">
      <div className="max-w-lg w-full pt-12">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Handshake className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Apply to be an affiliate</h1>
          <p className="text-muted-foreground">
            Earn <strong>{ratePercent}%</strong> commission on every sale you refer to{" "}
            <strong>{store.name}</strong>.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {store.affiliateCookieDays}-day attribution window
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tell us about you</CardTitle>
            <CardDescription>
              Once you're approved, you'll get a unique link to share. Commissions are paid by{" "}
              {store.name}'s owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="input-apply-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-apply-email"
                />
                <p className="text-xs text-muted-foreground">
                  Where we'll send your unique link and commission notifications.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Pick your affiliate code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="jane-doe"
                  required
                  pattern="[a-z0-9-]+"
                  data-testid="input-apply-code"
                />
                <p className="text-xs text-muted-foreground">
                  Your link will look like:{" "}
                  <code className="text-foreground">
                    /s/{store.slug}/?ref={code || "<your-code>"}
                  </code>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Why do you want to promote {store.name}? (optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  data-testid="input-apply-message"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" data-testid="apply-error">{error}</p>
              )}

              <Button type="submit" disabled={submitting} className="w-full" data-testid="button-apply-submit">
                {submitting ? "Submitting..." : "Apply"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center py-12">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Store not found</h2>
          <p className="text-sm text-muted-foreground">
            We couldn't find a store at this URL.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
