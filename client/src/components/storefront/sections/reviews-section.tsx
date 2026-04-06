import type { Store, StoreReview } from "@shared/schema";
import type { ThemeColors, StorefrontTheme } from "../theme-types";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

interface ReviewsSectionProps {
  store: Store;
  reviews: StoreReview[];
  c: ThemeColors;
  theme: StorefrontTheme;
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join("");
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function ReviewsSection({ store, reviews, c, theme }: ReviewsSectionProps) {
  const revealRef = useScrollReveal();

  if (!store.reviewsEnabled || !reviews || reviews.length === 0) return null;

  const avgRating = Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;

  return (
    <section style={{ background: c.bg }}>
      <div ref={revealRef} className={`mx-auto ${theme.layout.maxWidth} px-6 py-16 md:py-24`}>
        <div className="text-center mb-12 sf-reveal-item">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
            style={{ color: c.text, fontFamily: theme.typography.headingFamily }}
          >
            Customer Reviews
          </h2>
          <p className="text-lg font-medium" style={{ color: c.textSecondary }}>
            <span style={{ color: "#f59e0b" }}>{renderStars(Math.round(avgRating))}</span>
            {" "}{avgRating} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="sf-reveal-item p-6 rounded-2xl flex flex-col transition-shadow"
              style={{
                background: c.card,
                border: `1px solid ${c.cardBorder}`,
                boxShadow: c.cardShadow,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl" style={{ color: "#f59e0b" }}>{renderStars(r.rating)}</span>
                <span className="text-xs" style={{ color: c.textSecondary }}>{formatDate(r.createdAt)}</span>
              </div>

              {r.title && (
                <p className="font-semibold mb-2" style={{ color: c.text }}>
                  {r.title}
                </p>
              )}

              <p className="flex-grow text-sm leading-relaxed mb-4" style={{ color: c.textSecondary }}>
                {r.content}
              </p>

              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: c.accent, color: c.btnText }}
              >
                {(r as any).customerName
                  ? String((r as any).customerName).charAt(0).toUpperCase()
                  : "?"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
