import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
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

export default function AuthPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const subscribed = params.get("subscribed") === "true";
  const plan = params.get("plan");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (subscribed) {
      toast({
        title: "Account created successfully!",
        description: "Your subscription is active. Log in with your credentials to get started.",
      });
    }
  }, [subscribed]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/dashboard");
    },
    onError: (err: any) => {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    },
  });

  const isPending = loginMutation.isPending;

  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  const planLabels: Record<string, string> = {
    basic: "Starter",
    pro: "Growth",
    max: "Empire",
  };

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 s-hero-grid opacity-30" />

      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />

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
          <h2 className="text-xl font-bold text-foreground mb-1" data-testid="text-auth-title">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mb-6" data-testid="text-auth-description">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Enter your password"
                  required
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
            <Button type="submit" className="w-full font-semibold cta-mono" disabled={isPending} data-testid="button-auth-submit">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a
              href="/#pricing"
              className="text-primary hover:underline font-medium cta-mono text-xs"
              data-testid="link-view-plans"
            >
              View Plans
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
