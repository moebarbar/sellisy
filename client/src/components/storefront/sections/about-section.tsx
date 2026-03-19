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

  return (
    <section style={{ background: c.bgAlt, borderTop: `1px solid ${c.divider}`, borderBottom: `1px solid ${c.divider}` }}>
      <div ref={revealRef} className={`mx-auto ${theme.layout.maxWidth} px-6 py-16 md:py-24`}>
        <div className={`flex flex-col ${imageUrl ? "md:flex-row" : ""} items-center gap-10 md:gap-16 sf-reveal-item`}>
          {imageUrl && (
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
          )}

          <div className="flex-1 space-y-6 text-center md:text-left">
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
            {ctaText && ctaUrl && (
              <div className="pt-4">
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90 shadow-md"
                  style={{ background: c.btnGradient, color: c.btnText }}
                >
                  {ctaText}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
