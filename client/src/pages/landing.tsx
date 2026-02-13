import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import {
  Package, ShoppingBag, Download, Zap, ArrowRight, Moon, Sun,
  Shield, Globe, Layers, Palette, CreditCard, Lock, Sparkles, Check,
} from "lucide-react";
import { HeroBackground } from "@/components/hero-background";

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 flex-wrap px-6 py-3">
          <Link href="/">
            <span className="text-lg font-bold tracking-tight" data-testid="link-home">
              DigitalVault
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="transition-colors" data-testid="link-nav-features">Features</a>
            <a href="#how-it-works" className="transition-colors" data-testid="link-nav-how">How It Works</a>
            <a href="#pricing" className="transition-colors" data-testid="link-nav-pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="Toggle theme" data-testid="button-theme-toggle">
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

      <section className="relative overflow-hidden">
        <HeroBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        <div className="relative mx-auto max-w-6xl px-6 py-28 md:py-40 lg:py-48">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm text-white/80 mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              The easiest way to sell digital products
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-[1.1] text-white mb-6">
              Your Storefront,<br />
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Built in Minutes
              </span>
            </h1>
            <p className="max-w-lg text-lg text-white/70 mb-10 leading-relaxed">
              Create a beautiful storefront, import products from our curated library,
              and start accepting payments. No code, no complexity.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-8">
              <Button
                size="lg"
                data-testid="button-hero-cta"
                onClick={() => { window.location.href = "/api/login"; }}
              >
                Start Selling Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/s/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="backdrop-blur-sm bg-white/10 text-white"
                  data-testid="button-hero-demo"
                >
                  View Demo Store
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-5 flex-wrap text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Free forever plan
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Set up in under 5 min
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-b">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-center gap-8 md:gap-14 flex-wrap text-muted-foreground/50">
            {["Trusted by creators", "200+ products sold", "99.9% uptime", "Instant delivery"].map((text, i) => (
              <span key={text} className="text-sm font-medium tracking-wide uppercase" data-testid={`text-social-proof-${i}`}>{text}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight mb-4">
              Everything You Need to Sell
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              A complete toolkit for digital creators who want to monetize their work without the headache.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:row-span-2 overflow-visible" data-testid="card-feature-templates">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary mb-5">
                  <Palette className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Beautiful Templates</h3>
                <p className="text-muted-foreground leading-relaxed mb-4 flex-1">
                  Choose from professionally designed storefront templates. Each one is responsive, fast, and customizable to match your brand.
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline">Neon</Badge>
                  <Badge variant="outline">Silk</Badge>
                  <Badge variant="outline">More coming</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-visible" data-testid="card-feature-library">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary mb-5">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Product Library</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Browse our curated collection of digital products and import them to your store with one click.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-visible" data-testid="card-feature-payments">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary mb-5">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Instant Payments</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Accept payments via Stripe. Customers pay, you get paid. Simple as that.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-visible" data-testid="card-feature-security">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary mb-5">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure Downloads</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Time-limited, unique download tokens protect your files from unauthorized sharing.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-visible" data-testid="card-feature-multistore">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary mb-5">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Multi-Store</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Run multiple storefronts from a single account. Each with its own slug, template, and product catalog.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 bg-card border-y">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight mb-4">
              Three Steps to Your First Sale
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Go from zero to a live storefront in minutes, not days.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: ShoppingBag,
                step: "01",
                title: "Create Your Store",
                desc: "Pick a name, choose a template, and your branded storefront is live instantly with its own unique URL.",
              },
              {
                icon: Package,
                step: "02",
                title: "Import Products",
                desc: "Browse categories in our platform library. Import UI kits, ebooks, graphics, and tools with one click.",
              },
              {
                icon: Download,
                step: "03",
                title: "Sell & Deliver",
                desc: "Publish products, accept payments, and automatically deliver secure download links to your customers.",
              },
            ].map((item) => (
              <div key={item.step} className="relative" data-testid={`step-${item.step}`}>
                <div className="text-7xl font-serif font-bold text-primary/10 mb-4 leading-none">
                  {item.step}
                </div>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight mb-4">
              Start Free, Scale When Ready
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              No upfront costs. No hidden fees. Just start selling.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            <Card className="overflow-visible">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold mb-1">Starter</h3>
                <p className="text-sm text-muted-foreground mb-6">Perfect for getting started</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  {["1 store", "Import from library", "Neon & Silk templates", "Secure file delivery", "Unlimited products"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { window.location.href = "/api/login"; }}
                  data-testid="button-pricing-starter"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-visible border-primary/30">
              <CardContent className="p-8 relative">
                <div className="absolute -top-3 right-6">
                  <Badge>Popular</Badge>
                </div>
                <h3 className="text-lg font-semibold mb-1">Pro</h3>
                <p className="text-sm text-muted-foreground mb-6">For serious creators</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">$19</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  {["Unlimited stores", "Priority support", "Custom domains", "Analytics dashboard", "Everything in Starter"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => { window.location.href = "/api/login"; }}
                  data-testid="button-pricing-pro"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-card border-t">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight mb-4">
              Ready to Start Selling?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join creators who are already monetizing their digital products with DigitalVault. Set up your store in minutes.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                size="lg"
                onClick={() => { window.location.href = "/api/login"; }}
                data-testid="button-cta-final"
              >
                Create Your Store
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between gap-4 flex-wrap text-sm text-muted-foreground">
          <span data-testid="text-footer-brand">DigitalVault — Sell digital products with ease.</span>
          <div className="flex items-center gap-4 flex-wrap">
            <a href="#features" className="transition-colors" data-testid="link-footer-features">Features</a>
            <a href="#pricing" className="transition-colors" data-testid="link-footer-pricing">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
