import { useEffect, useRef } from "react";
import { CustomCursor } from "@/components/landing/custom-cursor";
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

  return (
    <div ref={wrapperRef} className="landing-page" data-testid="landing-page">
      <CustomCursor />
      <Navbar />
      <HeroSection />
      <TickerBar />
      <StatsSection />
      <div id="products">
        <LibrarySection />
      </div>
      <TemplatesSection />
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
