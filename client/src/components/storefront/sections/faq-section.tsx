import { useState } from "react";
import type { Store, StoreFaq } from "@shared/schema";
import type { ThemeColors, StorefrontTheme } from "../theme-types";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

interface FaqSectionProps {
  store: Store;
  faqs: StoreFaq[];
  c: ThemeColors;
  theme: StorefrontTheme;
}

export function FaqSection({ store, faqs, c, theme }: FaqSectionProps) {
  const revealRef = useScrollReveal();
  const [openId, setOpenId] = useState<string | null>(null);

  if (!store.faqEnabled || !faqs || faqs.length === 0) return null;

  return (
    <section style={{ background: c.bgAlt, borderTop: `1px solid ${c.divider}`, borderBottom: `1px solid ${c.divider}` }}>
      <div ref={revealRef} className={`mx-auto ${theme.layout.maxWidth} px-6 py-16 md:py-24`}>
        <div className="text-center mb-12 sf-reveal-item">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            style={{ color: c.text, fontFamily: theme.typography.headingFamily }}
          >
            Frequently Asked Questions
          </h2>
          <p style={{ color: c.textSecondary }}>Everything you need to know about the products.</p>
        </div>

        <div
          className="rounded-2xl border p-2 shadow-sm sf-reveal-item"
          style={{ background: c.card, borderColor: c.cardBorder }}
        >
          {faqs.map((faq, index) => {
            const isOpen = openId === faq.id;
            const isLast = index === faqs.length - 1;
            return (
              <div key={faq.id} style={!isLast ? { borderBottom: `1px solid ${c.divider}` } : undefined}>
                <button
                  className="w-full text-left px-4 py-4 font-medium flex items-center justify-between gap-4 rounded-lg transition-colors"
                  style={{ color: c.text }}
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                >
                  <span>{faq.question}</span>
                  <span className="shrink-0 text-lg transition-transform duration-200" style={{ color: c.accent, transform: isOpen ? "rotate(45deg)" : "none" }}>+</span>
                </button>
                {isOpen && (
                  <p className="px-4 pb-4 leading-relaxed whitespace-pre-wrap" style={{ color: c.textSecondary }}>
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
