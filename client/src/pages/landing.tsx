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
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 lg:py-40">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
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

            <div className="hidden md:block" data-testid="hero-graphic">
              <div className="relative" style={{ perspective: "1200px" }}>
                <div style={{ transform: "rotateY(-8deg) rotateX(4deg)" }}>
                  <div className="rounded-md border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                      </div>
                      <div className="flex-1 h-5 rounded-md bg-white/5 flex items-center justify-center">
                        <span className="text-[10px] text-white/30 tracking-wider">mystore.digitalvault.app</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                        <ShoppingBag className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white/80">My Creative Store</span>
                      <div className="ml-auto flex gap-1">
                        <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-medium">Live</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: "UI Kit Pro", price: "$49", color: "from-blue-500/30 to-cyan-500/30", icon: Layers },
                        { name: "Icon Pack", price: "$29", color: "from-violet-500/30 to-pink-500/30", icon: Palette },
                        { name: "Dev Toolkit", price: "$39", color: "from-emerald-500/30 to-teal-500/30", icon: Zap },
                        { name: "Template Kit", price: "$59", color: "from-orange-500/30 to-amber-500/30", icon: Package },
                      ].map((product) => (
                        <div key={product.name} className="rounded-md border border-white/10 bg-white/[0.03] p-3 space-y-2">
                          <div className={`aspect-[4/3] rounded-md bg-gradient-to-br ${product.color} flex items-center justify-center`}>
                            <product.icon className="w-6 h-6 text-white/40" />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-white/70">{product.name}</p>
                            <p className="text-[11px] text-blue-400 font-semibold">{product.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                      <div className="flex-1">
                        <p className="text-[10px] text-white/40 mb-1">Revenue this month</p>
                        <p className="text-sm font-bold text-white/80">$2,847</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-white/40 mb-1">Orders</p>
                        <p className="text-sm font-bold text-white/80">64</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-white/40 mb-1">Downloads</p>
                        <p className="text-sm font-bold text-white/80">128</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 w-40 rounded-md border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-medium text-white/70">New sale!</span>
                  </div>
                  <p className="text-[9px] text-white/40">UI Kit Pro - $49.00</p>
                  <div className="w-full h-1 rounded-full bg-white/10">
                    <div className="w-3/4 h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 w-44 rounded-md border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <ArrowRight className="w-2.5 h-2.5 text-blue-400" />
                    </div>
                    <span className="text-[10px] font-semibold text-white/80">One-click import</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center">
                      <Package className="w-3 h-3 text-violet-400" />
                    </div>
                    <span className="text-[9px] text-white/50">Icon Pack</span>
                    <div className="ml-auto px-1.5 py-0.5 rounded-md bg-emerald-500/20">
                      <span className="text-[8px] text-emerald-400 font-medium">Imported</span>
                    </div>
                  </div>
                </div>
              </div>
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

          <Card className="overflow-visible mb-6 border-primary/20" data-testid="card-feature-import">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <Badge variant="secondary" className="w-fit mb-4">Key Feature</Badge>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold tracking-tight mb-3">
                    One-Click Product Import
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Browse our curated platform library of templates, graphics, ebooks, and dev tools. 
                    Find what you want, click import, and it's instantly in your store — ready to sell. No uploads, no configuration.
                  </p>
                  <div className="flex items-center gap-4 flex-wrap text-sm">
                    <span className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Browse by category
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Import in one click
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Sell immediately
                    </span>
                  </div>
                </div>
                <div className="p-6 md:p-8 bg-muted/30 rounded-b-md md:rounded-b-none md:rounded-r-md flex items-center justify-center">
                  <div className="w-full max-w-sm space-y-3" data-testid="import-demo-graphic">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Platform Library</div>
                    {[
                      { name: "Starter UI Kit", cat: "Templates", price: "$49", color: "bg-blue-500" },
                      { name: "Social Media Pack", cat: "Graphics", price: "$29", color: "bg-violet-500" },
                      { name: "React Components", cat: "Tools", price: "$39", color: "bg-emerald-500" },
                    ].map((item, i) => (
                      <div key={item.name} className="flex items-center gap-3 rounded-md border bg-background p-3">
                        <div className={`w-10 h-10 rounded-md ${item.color}/15 flex items-center justify-center shrink-0`}>
                          <Package className={`w-5 h-5 ${item.color.replace("bg-", "text-")}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.cat} &middot; {item.price}</p>
                        </div>
                        {i === 0 ? (
                          <Badge variant="secondary" className="shrink-0" data-testid="badge-imported">
                            <Check className="w-3 h-3 mr-1" />
                            Imported
                          </Badge>
                        ) : (
                          <Button size="sm" data-testid={`button-import-demo-${i}`}>
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Import
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-visible" data-testid="card-feature-templates">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary mb-5">
                  <Palette className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Beautiful Templates</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Professionally designed storefront templates. Responsive, fast, and customizable to your brand.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">Neon</Badge>
                  <Badge variant="outline">Silk</Badge>
                </div>
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
                  Run multiple storefronts from a single account. Each with its own slug, template, and catalog.
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
