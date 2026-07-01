import { useEffect, useRef } from "react";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { TickerBar } from "@/components/landing/ticker-bar";
import { StatsSection } from "@/components/landing/stats-section";
import { LibrarySection } from "@/components/landing/library-section";
import { TemplatesSection } from "@/components/landing/templates-section";
import { PortalSection } from "@/components/landing/portal-section";
import { CreatorSection } from "@/components/landing/creator-section";
import { AnalyticsSection } from "@/components/landing/analytics-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { StoresSection } from "@/components/landing/stores-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("s-revealed");
          }
        });
      },
      { threshold: 0.15 }
    );

    const els = wrapperRef.current.querySelectorAll(".s-reveal");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = ""; };
  }, []);

  // Analyio marketing-attribution pixel. Scoped to the landing page only —
  // dashboard and tenant storefronts deliberately don't fire it (different
  // audiences, different data, multi-tenant privacy concern).
  useEffect(() => {
    const PIXEL_ID = "analyio-pixel";
    if (document.getElementById(PIXEL_ID)) return; // already mounted (HMR / remount)
    const s = document.createElement("script");
    s.id = PIXEL_ID;
    s.defer = true;
    s.src = "https://app.analyio.com/pixel/XGaVcGsLGz7TqZSL";
    document.head.appendChild(s);
    // Intentionally no cleanup — once the visitor lands and the pixel
    // records the session, removing the tag on unmount would just lose
    // the engagement signal as they navigate within the SPA.
  }, []);

  return (
    <div ref={wrapperRef} className="landing-page" data-testid="landing-page">
      <div className="s-ambient-wrap" aria-hidden="true">
        <div className="s-ambient-orb s-ambient-orb--yellow" />
        <div className="s-ambient-orb s-ambient-orb--teal" />
        <div className="s-ambient-orb s-ambient-orb--pink" />
      </div>
      <Navbar />
      <HeroSection />
      <TickerBar />
      <StatsSection />
      <div id="products">
        <LibrarySection />
      </div>
      <TemplatesSection />
      <StoresSection />
      <PortalSection />
      <div id="create">
        <CreatorSection />
      </div>
      <AnalyticsSection />
      <div id="how-it-works">
        <HowItWorksSection />
      </div>
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="pricing">
        <PricingSection />
      </div>
      <FinalCTA />
      <Footer />
    </div>
  );
}
