import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useSignIn, useSignUp, useUser } from "@clerk/react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle2, TrendingUp, Package, Zap } from "lucide-react";

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

type Mode = "sign-in" | "sign-up";

export default function AuthPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const subscribed = params.get("subscribed") === "true";
  const plan = params.get("plan");
  const [, navigate] = useLocation();
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  useEffect(() => {
    if (subscribed) {
      toast({
        title: "Account created successfully!",
        description: "Your subscription is active. Log in with your credentials to get started.",
      });
    }
  }, [subscribed, toast]);

  useEffect(() => {
    if (!isUserLoaded || !isSignedIn) return;
    // If they came from a pricing CTA, resume the checkout flow now that
    // they're authenticated. Otherwise drop them on the dashboard.
    const pendingPlan = sessionStorage.getItem("pendingPlan");
    if (pendingPlan === "basic" || pendingPlan === "pro" || pendingPlan === "max") {
      sessionStorage.removeItem("pendingPlan");
      apiRequest("POST", "/api/subscribe", { plan: pendingPlan })
        .then(r => r.json())
        .then(data => {
          if (data.url) window.location.href = data.url;
          else navigate("/dashboard");
        })
        .catch(() => navigate("/dashboard"));
      return;
    }
    navigate("/dashboard");
  }, [isUserLoaded, isSignedIn, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setSubmitting(true);
    const { error } = await signIn.password({ identifier: email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    if (signIn.status === "complete") {
      const { error: finalizeError } = await signIn.finalize();
      if (finalizeError) {
        toast({ title: "Login failed", description: finalizeError.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      navigate("/dashboard");
    } else {
      toast({ title: "Additional steps required", description: "Please complete verification." });
    }
    setSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setSubmitting(true);
    const { error } = await signUp.password({ emailAddress: email, password, firstName, lastName });
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      toast({ title: "Could not send verification code", description: sendError.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    setPendingVerification(true);
    setSubmitting(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setSubmitting(true);
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      // Log full error so we can see Clerk's underlying code in DevTools.
      console.error("[clerk] verifyEmailCode error:", error);
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    // Always try finalize() — if Clerk says "missing requirements" the
    // finalize call surfaces a useful error we can show the user. Logging
    // the full signUp object also lets us see what's still missing.
    console.log("[clerk] signUp after verify:", {
      status: signUp.status,
      unverifiedFields: signUp.unverifiedFields,
      hasPassword: signUp.hasPassword,
      emailAddress: signUp.emailAddress,
    });
    if (signUp.status === "complete") {
      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) {
        console.error("[clerk] finalize error:", finalizeError);
        toast({ title: "Sign up failed", description: finalizeError.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      navigate("/dashboard");
    } else {
      // Try finalize() anyway — sometimes works even when status looks off.
      const { error: finalizeError } = await signUp.finalize();
      console.log("[clerk] tried finalize fallback:", { finalizeError, statusAfter: signUp.status });
      if (!finalizeError && signUp.status === "complete") {
        navigate("/dashboard");
      } else {
        toast({
          title: "Verification incomplete",
          description: finalizeError?.message ?? `Status: ${signUp.status}. Check console for details.`,
          variant: "destructive",
        });
      }
    }
    setSubmitting(false);
  };

  const planLabels: Record<string, string> = {
    basic: "Starter",
    pro: "Growth",
    max: "Empire",
  };

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden flex items-center justify-center px-4">
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
              <polyline
                fill="none"
                stroke="hsl(53 91% 61%)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,20 15,16 30,18 45,10 60,12 75,6 90,4 100,2"
              />
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
              {plan && planLabels[plan]
                ? `${planLabels[plan]} plan activated!`
                : "Subscription activated!"}
            </span>
          </div>
        )}

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6">
          {pendingVerification ? (
            <>
              <h2 className="text-xl font-bold text-foreground mb-1">Verify your email</h2>
              <p className="text-sm text-muted-foreground mb-6">We sent a 6-digit code to {email}.</p>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Verification code</Label>
                  <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required className="bg-white/[0.04] border-white/[0.08] focus:border-primary/50" />
                </div>
                <Button type="submit" className="w-full font-semibold cta-mono" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & continue"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex gap-2 mb-6 text-xs font-mono uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setMode("sign-in")}
                  className={`flex-1 py-2 rounded-md transition-colors ${mode === "sign-in" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid="tab-sign-in"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("sign-up")}
                  className={`flex-1 py-2 rounded-md transition-colors ${mode === "sign-up" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid="tab-sign-up"
                >
                  Create Account
                </button>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-1" data-testid="text-auth-title">
                {mode === "sign-in" ? "Welcome Back" : "Create your account"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {mode === "sign-in" ? "Sign in to your account" : "Start your digital empire"}
              </p>

              <form onSubmit={mode === "sign-in" ? handleSignIn : handleSignUp} className="space-y-4">
                {mode === "sign-up" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">First name</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="bg-white/[0.04] border-white/[0.08] focus:border-primary/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Last name</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="bg-white/[0.04] border-white/[0.08] focus:border-primary/50" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-white/[0.04] border-white/[0.08] focus:border-primary/50"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "sign-up" ? "At least 8 characters" : "Enter your password"}
                      required
                      minLength={mode === "sign-up" ? 8 : undefined}
                      className="pr-10 bg-white/[0.04] border-white/[0.08] focus:border-primary/50"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full font-semibold cta-mono" disabled={submitting} data-testid="button-auth-submit">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === "sign-in" ? "Sign In" : "Create Account")}
                </Button>
                {/* Required by Clerk for bot protection on sign-up. Clerk's
                    SDK injects an invisible CAPTCHA challenge into this div.
                    Without it, sign-up verifications fail in production. */}
                <div id="clerk-captcha" />
              </form>

              {mode === "sign-in" && (
                <div className="mt-5 text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button onClick={() => setMode("sign-up")} className="text-primary hover:underline font-medium cta-mono text-xs">Create one</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
