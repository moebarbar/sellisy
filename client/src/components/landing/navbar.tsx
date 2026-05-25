import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Products", href: "#products" },
  { label: "Create & Sell", href: "#create" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn } = useUser();
  const user = isSignedIn ? { id: "signed-in" } : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500"
      style={{
        background: scrolled ? "rgba(5,5,5,0.95)" : "linear-gradient(to bottom, rgba(5,5,5,0.95), transparent)",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}
      data-testid="landing-nav"
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="s-heading text-[28px] tracking-[3px] flex items-center" data-testid="link-logo">
          <span style={{ color: "var(--s-white)" }}>SELL</span>
          <span style={{ color: "var(--s-yellow)" }}>I</span>
          <span style={{ color: "var(--s-white)" }}>SY</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="s-label s-nav-link"
              data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {user ? (
          <a
            href="/dashboard"
            className="s-label px-5 py-2.5 rounded font-bold transition-all duration-200"
            style={{
              background: "var(--s-yellow)",
              color: "var(--s-black)",
              fontSize: "11px",
            }}
            data-testid="button-nav-cta"
          >
            Dashboard
          </a>
        ) : (
          <div className="flex items-center gap-3">
            <a
              href="/auth"
              className="s-label s-btn-outline px-5 py-2.5 rounded font-bold"
              style={{ color: "var(--s-white)", fontSize: "11px" }}
              data-testid="button-nav-login"
            >
              Login
            </a>
            <button
              onClick={() => scrollTo("#pricing")}
              className="s-label px-5 py-2.5 rounded font-bold transition-all duration-200"
              style={{
                background: "var(--s-yellow)",
                color: "var(--s-black)",
                fontSize: "11px",
              }}
              data-testid="button-nav-cta"
            >
              Get Started →
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
