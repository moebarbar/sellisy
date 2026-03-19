import { useState } from "react";
import type { Store } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

interface NewsletterSectionProps {
  store: Store;
  themeClass: string;
}

export function NewsletterSection({ store, themeClass }: NewsletterSectionProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  if (!store.newsletterEnabled) return null;

  const headline = store.newsletterHeadline || "Subscribe to the Newsletter";
  const subtext = store.newsletterSubtext || "Get the latest updates, resources, and offers delivered straight to your inbox.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/storefront/${store.slug}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to subscribe");
      }

      setSubscribed(true);
      toast({ title: "Subscribed successfully!", description: "Check your inbox for updates." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`py-16 md:py-24 px-4`}>
      <div className="container mx-auto max-w-4xl">
        <div className={`${themeClass}-bg rounded-3xl p-8 md:p-12 text-primary-foreground text-center shadow-xl relative overflow-hidden`}>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-64 h-64 bg-background/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-64 h-64 bg-background/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <Mail className="h-10 w-10 mx-auto opacity-80" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{headline}</h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">{subtext}</p>
            
            {subscribed ? (
              <div className="flex flex-col items-center justify-center p-6 bg-background/10 rounded-xl space-y-2 mt-8">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
                <p className="font-medium text-lg">You're on the list!</p>
                <p className="text-primary-foreground/70 text-sm">Thanks for subscribing.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mt-8 max-w-lg mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="bg-background text-foreground h-12 flex-1 rounded-full px-6"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loading} size="lg" className="rounded-full h-12 px-8 bg-foreground text-background hover:bg-foreground/90 font-medium">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
