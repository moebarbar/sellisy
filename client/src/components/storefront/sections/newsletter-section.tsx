import { useState } from "react";
import type { Store } from "@shared/schema";
import type { ThemeColors, StorefrontTheme } from "../theme-types";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Loader2, Mail, CheckCircle2, AlertCircle, Lock } from "lucide-react";

interface NewsletterSectionProps {
  store: Store;
  c: ThemeColors;
  theme: StorefrontTheme;
  subscriberCount?: number;
}

export function NewsletterSection({ store, c, theme, subscriberCount = 0 }: NewsletterSectionProps) {
  const revealRef = useScrollReveal();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!store.newsletterEnabled) return null;

  const headline = store.newsletterHeadline || "Join the Newsletter";
  const subtext = store.newsletterSubtext || "Get exclusive tips, early access to new products, and subscriber-only discounts.";
  const showCount = (store as any).showSubscriberCount && subscriberCount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
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
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ background: c.bg }}>
      <div ref={revealRef} className={`mx-auto ${theme.layout.maxWidth} px-6 py-16 md:py-24`}>
        <div
          className="rounded-3xl p-8 md:p-12 text-center shadow-xl relative overflow-hidden sf-reveal-item"
          style={{ background: c.accent }}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,255,255,0.08)" }} />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <Mail className="h-10 w-10 mx-auto opacity-80" style={{ color: c.btnText }} />

            {/* Subscriber count social proof */}
            {showCount && (
              <p className="text-sm font-semibold" style={{ color: c.btnText, opacity: 0.9 }}>
                Join {subscriberCount.toLocaleString()}+ subscribers
              </p>
            )}

            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: c.btnText, fontFamily: theme.typography.headingFamily }}
            >
              {headline}
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: c.btnText, opacity: 0.85 }}>{subtext}</p>

            {subscribed ? (
              <div className="flex flex-col items-center justify-center p-6 rounded-xl space-y-2 mt-8" style={{ background: "rgba(255,255,255,0.12)" }}>
                <CheckCircle2 className="h-8 w-8" style={{ color: c.btnText }} />
                <p className="font-medium text-lg" style={{ color: c.btnText }}>You're on the list!</p>
                <p className="text-sm" style={{ color: c.btnText, opacity: 0.75 }}>Check your inbox for a confirmation.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-3 max-w-lg mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="flex-1 h-12 rounded-full px-6 text-sm outline-none"
                    style={{ background: c.bg, color: c.text, border: "none" }}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 px-8 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-2 shrink-0"
                    style={{ background: c.bg, color: c.text }}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Get Early Access
                  </button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.12)", color: c.btnText }}>
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-1.5 pt-1" style={{ color: c.btnText, opacity: 0.65 }}>
                  <Lock className="h-3 w-3" />
                  <p className="text-xs">No spam. Unsubscribe anytime.</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
