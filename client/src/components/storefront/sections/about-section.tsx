import { useRef } from "react";
import type { Store } from "@shared/schema";
import type { ThemeColors, StorefrontTheme } from "../theme-types";
import { ProtectedImage } from "@/components/protected-image";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

interface AboutSectionProps {
  store: Store;
  c: ThemeColors;
  theme: StorefrontTheme;
}

export function AboutSection({ store, c, theme }: AboutSectionProps) {
  const revealRef = useScrollReveal();

  if (!store.aboutEnabled) return null;

  const headline = store.aboutHeadline || `About ${store.name}`;
  const text = store.aboutText;
  const imageUrl = store.aboutImageUrl;
  const ctaText = store.aboutCtaText;
  const ctaUrl = store.aboutCtaUrl;

  if (!text && !imageUrl) return null;

  // Internal CTAs (#products anchors, /s/... paths) navigate in place;
  // only true external URLs open a new tab.
  const ctaIsExternal = !!ctaUrl && /^https?:\/\//i.test(ctaUrl);

  const cta = ctaText && ctaUrl && (
    <div className="pt-4">
      <a
        href={ctaUrl}
        {...(ctaIsExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90 shadow-md"
        style={{ background: c.btnGradient, color: c.btnText }}
        data-testid="about-cta"
      >
        {ctaText}
      </a>
    </div>
  );

  const eyebrow = (
    <div className="flex items-center gap-3 justify-center md:justify-start">
      <span className="h-px w-8" style={{ background: c.accent }} aria-hidden="true" />
      <span className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: c.accent }}>
        About the creator
      </span>
    </div>
  );

  // No-image layout: editorial two-column split so the section fills the
  // width instead of stranding a short paragraph in empty space — this is
  // what every AI-launched store renders.
  if (!imageUrl) {
    return (
      <section style={{ background: c.bgAlt, borderTop: `1px solid ${c.divider}`, borderBottom: `1px solid ${c.divider}` }}>
        <div ref={revealRef} className={`mx-auto ${theme.layout.maxWidth} px-6 py-16 md:py-24`}>
          <div className="grid md:grid-cols-[2fr_3fr] gap-8 md:gap-16 items-start sf-reveal-item">
            <div className="space-y-5 text-center md:text-left">
              {eyebrow}
              <h2
                className="text-3xl md:text-4xl font-bold tracking-tight leading-tight"
                style={{ color: c.text, fontFamily: theme.typography.headingFamily }}
              >
                {headline}
              </h2>
              <div className="hidden md:block">{cta}</div>
            </div>
            <div
              className="text-center md:text-left md:pl-10"
              style={{ borderLeft: undefined }}
            >
              <div className="hidden md:block absolute" aria-hidden="true" />
              <p
                className="text-lg md:text-xl leading-relaxed whitespace-pre-wrap md:border-l-2 md:pl-8"
                style={{ color: c.textSecondary, borderColor: c.accent }}
              >
                {text}
              </p>
              <div className="md:hidden flex justify-center">{cta}</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ background: c.bgAlt, borderTop: `1px solid ${c.divider}`, borderBottom: `1px solid ${c.divider}` }}>
      <div ref={revealRef} className={`mx-auto ${theme.layout.maxWidth} px-6 py-16 md:py-24`}>
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 sf-reveal-item">
          <div className="w-48 md:w-1/3 flex-shrink-0">
            <div
              className="aspect-square rounded-2xl overflow-hidden shadow-lg transform -rotate-2 hover:rotate-0 transition-transform duration-300"
              style={{ border: `4px solid ${c.card}` }}
            >
              <ProtectedImage
                src={imageUrl}
                alt={headline}
                className="w-full h-full object-cover"
                protected={!store.allowImageDownload}
              />
            </div>
          </div>

          <div className="flex-1 space-y-6 text-center md:text-left">
            {eyebrow}
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: c.text, fontFamily: theme.typography.headingFamily }}
            >
              {headline}
            </h2>
            {text && (
              <p className="text-lg leading-relaxed whitespace-pre-wrap max-w-xl" style={{ color: c.textSecondary }}>
                {text}
              </p>
            )}
            {cta}
          </div>
        </div>
      </div>
    </section>
  );
}
