import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Package, ShoppingBag, Download, Zap, ArrowRight, Moon, Sun, Shield, Globe } from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 px-6 py-3">
          <Link href="/">
            <span className="text-lg font-bold tracking-tight" data-testid="link-home">
              DigitalVault
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <Link href="/dashboard">
                <Button data-testid="link-dashboard">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Button variant="ghost" data-testid="link-login" onClick={() => { window.location.href = "/api/login"; }}>Sign In</Button>
                <Button data-testid="link-register" onClick={() => { window.location.href = "/api/login"; }}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Launch your digital product store in minutes
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Sell Digital Products<br />
            <span className="text-primary">Without The Complexity</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground mb-10">
            Create a beautiful storefront, import products from our curated library,
            and start accepting payments — all in one platform.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" data-testid="button-hero-cta" onClick={() => { window.location.href = "/api/login"; }}>
              Start Selling Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Link href="/s/demo">
              <Button size="lg" variant="outline" data-testid="button-hero-demo">
                View Demo Store
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 border-t">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Three simple steps to launch your digital product storefront
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: ShoppingBag, title: "Create Your Store", desc: "Pick a template, choose a name, and your store is live in seconds." },
              { icon: Package, title: "Import Products", desc: "Browse our platform library and import products with one click." },
              { icon: Download, title: "Get Paid & Deliver", desc: "Accept payments via Stripe and deliver secure download links automatically." },
            ].map((item, i) => (
              <Card key={i} className="relative overflow-visible">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary mb-4">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="absolute top-4 right-5 text-6xl font-bold text-muted/40">
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-card border-t">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Built For Creators</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Everything you need to sell digital products professionally
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: "Secure Delivery", desc: "Time-limited download tokens protect your files" },
              { icon: Globe, title: "Custom Storefronts", desc: "Choose from beautiful templates for your brand" },
              { icon: Zap, title: "Instant Setup", desc: "Go from zero to selling in under 5 minutes" },
              { icon: Package, title: "Product Library", desc: "Import from our curated collection of products" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-start gap-3 p-5 rounded-md border bg-background">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between gap-4 flex-wrap text-sm text-muted-foreground">
          <span>DigitalVault — Sell digital products with ease.</span>
          <span>Built with care.</span>
        </div>
      </footer>
    </div>
  );
}
