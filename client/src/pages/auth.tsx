import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {subscribed && (
            <div className="flex items-center justify-center gap-2 mb-4 text-green-500" data-testid="text-subscription-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">
                {plan && planLabels[plan]
                  ? `${planLabels[plan]} plan activated!`
                  : "Subscription activated!"}
              </span>
            </div>
          )}
          <CardTitle className="text-2xl font-bold" data-testid="text-auth-title">
            Welcome Back
          </CardTitle>
          <CardDescription data-testid="text-auth-description">
            Sign in to your Sellisy account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isPending} data-testid="button-auth-submit">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a
              href="/#pricing"
              className="text-primary hover:underline font-medium"
              data-testid="link-view-plans"
            >
              View Plans
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
