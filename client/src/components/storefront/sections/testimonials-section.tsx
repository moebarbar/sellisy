import type { Store, StoreTestimonial } from "@shared/schema";
import type { ThemeColors, StorefrontTheme } from "../theme-types";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

interface TestimonialsSectionProps {
  store: Store;
  testimonials: StoreTestimonial[];
  c: ThemeColors;
  theme: StorefrontTheme;
}

export function TestimonialsSection({ store, testimonials, c, theme }: TestimonialsSectionProps) {
  const revealRef = useScrollReveal();

  if (!store.testimonialsEnabled || !testimonials || testimonials.length === 0) return null;

  return (
    <section style={{ background: c.bg }}>
      <div ref={revealRef} className={`mx-auto ${theme.layout.maxWidth} px-6 py-16 md:py-24`}>
        <div className="text-center mb-12 sf-reveal-item">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            style={{ color: c.text, fontFamily: theme.typography.headingFamily }}
          >
            What Customers Say
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="sf-reveal-item p-6 rounded-2xl flex flex-col items-center text-center transition-shadow"
              style={{
                background: c.card,
                border: `1px solid ${c.cardBorder}`,
                boxShadow: c.cardShadow,
              }}
            >
              <div className="mb-6 mt-2 relative">
                {t.avatarUrl ? (
                  <img src={t.avatarUrl} alt={t.name} className="w-16 h-16 rounded-full object-cover shadow-sm" />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-sm"
                    style={{ background: c.accent, color: c.btnText }}
                  >
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                  style={{ background: c.accent, color: c.btnText, border: `2px solid ${c.bg}` }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
              </div>

              <p className="italic flex-grow mb-6 whitespace-pre-wrap" style={{ color: c.textSecondary }}>
                "{t.quote}"
              </p>

              <div>
                <p className="font-bold" style={{ color: c.text }}>{t.name}</p>
                {t.role && <p className="text-sm font-medium" style={{ color: c.accent }}>{t.role}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
