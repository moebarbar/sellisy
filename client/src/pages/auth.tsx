import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { SignIn, SignUp, useUser } from "@clerk/react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, TrendingUp, Package, Zap } from "lucide-react";

function ShowcaseCard({ children, className = "", delay = "0s" }: { children: React.ReactNode; className?: string; delay?: string }) {
  return (
    <div
      className={`absolute rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4 shadow-2xl ${className}`}
      style={{ animation: `s-float 6s ease-in-out infinite`, animationDelay: delay }}
    >
      {children}
    </div>
  );
}

// Theme passed to Clerk's <SignIn /> / <SignUp /> so they match Sellisy's
// dark+yellow aesthetic. Clerk's appearance API maps to internal element
// names — kept minimal here, deeper customization can be added later.
const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "iconButton" as const,
  },
  variables: {
    colorPrimary: "#f5d142",
    colorBackground: "#0a0a0a",
    colorInputBackground: "rgba(255,255,255,0.06)",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    // Bumped from 0.5 — at 0.5 opacity headers/subtitles/help text were
    // hard to read against the dark backdrop.
    colorTextSecondary: "rgba(250,250,245,0.75)",
    colorDanger: "#ef4444",
    colorSuccess: "#10b981",
    colorNeutral: "rgba(255,255,255,0.18)",
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "10px",
  },
  elements: {
    rootBox: { width: "100%" },
    card: {
      backgroundColor: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "none",
      backdropFilter: "blur(8px)",
    },
    headerTitle: {
      fontFamily: "'DM Sans', sans-serif",
      color: "#ffffff",
    },
    headerSubtitle: {
      color: "rgba(250,250,245,0.8)",
    },
    formButtonPrimary: {
      backgroundColor: "#f5d142",
      color: "#050505",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "1px",
      fontSize: "13px",
      "&:hover": { backgroundColor: "#ffe066" },
    },
    formFieldInput: {
      backgroundColor: "rgba(255,255,255,0.06)",
      borderColor: "rgba(255,255,255,0.15)",
      color: "#ffffff",
      "&::placeholder": { color: "rgba(250,250,245,0.4)" },
    },
    formFieldLabel: {
      color: "rgba(250,250,245,0.85)",
      fontSize: "11px",
      letterSpacing: "1px",
      textTransform: "uppercase" as const,
      fontFamily: "'Space Mono', monospace",
    },
    formFieldHintText: { color: "rgba(250,250,245,0.7)" },
    formFieldSuccessText: { color: "#10b981" },
    formFieldErrorText: { color: "#f87171" },
    formFieldWarningText: { color: "#fbbf24" },
    socialButtonsIconButton: {
      borderColor: "rgba(255,255,255,0.15)",
      backgroundColor: "rgba(255,255,255,0.05)",
      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
    },
    dividerLine: { backgroundColor: "rgba(255,255,255,0.15)" },
    dividerText: { color: "rgba(250,250,245,0.6)" },
    footerActionText: { color: "rgba(250,250,245,0.8)" },
    footerActionLink: {
      color: "#f5d142",
      fontWeight: 600,
      "&:hover": { color: "#ffe066" },
    },
    identityPreviewText: { color: "rgba(250,250,245,0.85)" },
    identityPreviewEditButton: { color: "#f5d142" },
    formResendCodeLink: { color: "#f5d142", fontWeight: 600 },
    otpCodeFieldInput: {
      backgroundColor: "rgba(255,255,255,0.06)",
      borderColor: "rgba(255,255,255,0.18)",
      color: "#ffffff",
    },
    alternativeMethodsBlockButton: {
      borderColor: "rgba(255,255,255,0.15)",
      color: "rgba(250,250,245,0.85)",
    },
    footer: { backgroundColor: "transparent" },
  },
};

type Mode = "sign-in" | "sign-up";

export default function AuthPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const subscribed = params.get("subscribed") === "true";
  const plan = params.get("plan");
  const [, navigate] = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("sign-in");

  useEffect(() => {
    if (subscribed) {
      toast({
        title: "Account created successfully!",
        description: "Your subscription is active. Log in with your credentials to get started.",
      });
    }
  }, [subscribed, toast]);

  // Pending pricing CTA: if the user clicked a plan while signed-out and got
  // routed here, kick off Stripe checkout right after Clerk completes auth.
  // Otherwise we let Clerk's <SignIn /> / <SignUp /> handle the redirect via
  // their own forceRedirectUrl prop — duplicating the navigate here causes
  // a redirect race with /dashboard.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const pendingPlan = sessionStorage.getItem("pendingPlan");
    if (pendingPlan !== "basic" && pendingPlan !== "pro" && pendingPlan !== "max") return;
    sessionStorage.removeItem("pendingPlan");
    apiRequest("POST", "/api/subscribe", { plan: pendingPlan })
      .then(r => r.json())
      .then(data => {
        if (data.url) window.location.href = data.url;
      })
      .catch(() => { /* Clerk will redirect to dashboard on its own */ });
  }, [isLoaded, isSignedIn]);

  const planLabels: Record<string, string> = {
    basic: "Starter",
    pro: "Growth",
    max: "Empire",
  };

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 s-hero-grid opacity-30" />

      <div className="s-ambient-orb s-ambient-orb-1 top-[10%] left-[15%] w-[600px] h-[600px] bg-[hsl(53_91%_61%/0.04)] blur-[140px]" />
      <div className="s-ambient-orb s-ambient-orb-2 bottom-[10%] right-[10%] w-[500px] h-[500px] bg-[hsl(168_100%_48%/0.035)] blur-[120px]" />
      <div className="s-ambient-orb s-ambient-orb-3 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[hsl(326_100%_62%/0.03)] blur-[130px]" />

      <ShowcaseCard className="top-[15%] left-[5%] w-52 hidden lg:block" delay="0s">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-mono text-muted-foreground">Revenue</span>
        </div>
        <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>$12,847</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] text-emerald-400 font-mono">+23.5%</span>
          <div className="flex-1 h-6">
            <svg viewBox="0 0 100 24" className="w-full h-full">
              <polyline fill="none" stroke="hsl(53 91% 61%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,20 15,16 30,18 45,10 60,12 75,6 90,4 100,2" />
            </svg>
          </div>
        </div>
      </ShowcaseCard>

      <ShowcaseCard className="top-[12%] right-[6%] w-48 hidden lg:block" delay="2s">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xs font-mono text-muted-foreground">Library</span>
        </div>
        <p className="text-lg font-bold text-foreground">200+ Products</p>
        <div className="flex gap-1 mt-2">
          {["Templates", "eBooks", "Courses"].map((t) => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground font-mono">{t}</span>
          ))}
        </div>
      </ShowcaseCard>

      <ShowcaseCard className="bottom-[18%] right-[8%] w-52 hidden lg:block" delay="4s">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-mono text-muted-foreground">Your Store</span>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="h-2 w-16 rounded bg-primary/30 mb-1.5" />
          <div className="h-1.5 w-24 rounded bg-white/10 mb-2" />
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded bg-white/5" />
            ))}
          </div>
        </div>
        <p className="text-[10px] text-emerald-400 font-mono mt-1.5">Live & Selling</p>
      </ShowcaseCard>

      <ShowcaseCard className="bottom-[22%] left-[6%] w-44 hidden lg:block" delay="3s">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">Instant Delivery</p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Automated downloads</p>
        </div>
      </ShowcaseCard>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl tracking-tight mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }} data-testid="text-auth-logo">
            SELL<span className="text-primary">I</span>SY
          </h1>
          <p className="text-sm text-muted-foreground font-mono">Your digital empire starts here</p>
        </div>

        {subscribed && (
          <div className="flex items-center justify-center gap-2 mb-6 py-3 px-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5" data-testid="text-subscription-success">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              {plan && planLabels[plan] ? `${planLabels[plan]} plan activated!` : "Subscription activated!"}
            </span>
          </div>
        )}

        {/* Sellisy-themed tab toggle. The actual auth UI below comes from
            Clerk's <SignIn /> / <SignUp /> components. */}
        <div className="flex gap-2 mb-4 text-xs font-mono uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`flex-1 py-2 rounded-md transition-colors ${mode === "sign-in" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-white/[0.04]"}`}
            data-testid="tab-sign-in"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`flex-1 py-2 rounded-md transition-colors ${mode === "sign-up" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-white/[0.04]"}`}
            data-testid="tab-sign-up"
          >
            Create Account
          </button>
        </div>

        {mode === "sign-in" ? (
          <SignIn
            routing="hash"
            signUpUrl="/auth"
            forceRedirectUrl="/dashboard"
            appearance={clerkAppearance}
          />
        ) : (
          <SignUp
            routing="hash"
            signInUrl="/auth"
            forceRedirectUrl="/dashboard"
            appearance={clerkAppearance}
          />
        )}
      </div>
    </div>
  );
}
