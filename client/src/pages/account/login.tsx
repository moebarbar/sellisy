import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useTheme } from "@/lib/theme";
import { Mail, Loader2, ArrowRight, Package, Moon, Sun, ExternalLink } from "lucide-react";

type CustomerMe = { id: string; email: string };

export default function AccountLoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [devLink, setDevLink] = useState<string | null>(null);

  const { data: customer, isLoading: meLoading } = useQuery<CustomerMe>({
    queryKey: ["/api/customer/me"],
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/customer/login", { email });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.devModeLink) {
        setDevLink(data.devModeLink);
      }
      toast({
        title: "Login link sent",
        description: "Check your email for a login link, or use the dev link below.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (meLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (customer) {
    navigate("/account/purchases");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 flex-wrap px-6 py-3">
          <Link href="/">
            <span className="text-lg font-bold tracking-tight" data-testid="link-home">
              Sellisy
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Package className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-login-title">
              Customer Portal
            </h1>
            <p className="text-muted-foreground">
              Access your purchases and download your files
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loginMutation.mutate();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="input-login-email"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the email you used when purchasing
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending || !email}
                  data-testid="button-login-submit"
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Send Login Link
                </Button>
              </form>

              {devLink && (
                <div className="rounded-lg border border-dashed p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">DEV MODE — Click to log in:</p>
                  <a
                    href={devLink}
                    className="text-sm text-primary underline break-all flex items-center gap-1"
                    data-testid="link-dev-magic"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    Open login link
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            No password needed. We'll send a secure link to your email.
          </p>
        </div>
      </main>
    </div>
  );
}
