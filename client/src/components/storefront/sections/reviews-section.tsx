import type { Store, StoreReview } from "@shared/schema";
import type { ThemeColors, StorefrontTheme } from "../theme-types";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { ShieldCheck } from "lucide-react";

interface ReviewsSectionProps {
  store: Store;
  reviews: Array<StoreReview & { customerName?: string | null }>;
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
            Loved by {reviews.length}+ {reviews.length === 1 ? "Customer" : "Customers"}
          </h2>
          <p className="text-lg font-medium" style={{ color: c.textSecondary }}>
            <span style={{ color: "#f59e0b" }}>{renderStars(Math.round(avgRating))}</span>
            {" "}{avgRating} average · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => {
            const displayName = r.customerName?.trim() || "Verified Buyer";
            const initials = displayName.charAt(0).toUpperCase();

            return (
              <div
                key={r.id}
                className="sf-reveal-item p-6 rounded-2xl flex flex-col transition-shadow"
                style={{
                  background: c.card,
                  border: `1px solid ${c.cardBorder}`,
                  boxShadow: c.cardShadow,
                }}
              >
                {/* Rating + date row */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl" style={{ color: "#f59e0b" }}>{renderStars(r.rating)}</span>
                  <span className="text-xs" style={{ color: c.textSecondary }}>{formatDate(r.createdAt)}</span>
                </div>

                {/* Verified badge */}
                <div className="flex items-center gap-1 mb-3">
                  <ShieldCheck className="h-3 w-3" style={{ color: "#059669" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#059669" }}>
                    Verified Purchase
                  </span>
                </div>

                {r.title && (
                  <p className="font-semibold mb-2" style={{ color: c.text }}>
                    {r.title}
                  </p>
                )}

                <p className="flex-grow text-sm leading-relaxed mb-5" style={{ color: c.textSecondary }}>
                  {r.content}
                </p>

                {/* Reviewer identity */}
                <div className="flex items-center gap-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: c.accent, color: c.btnText }}
                  >
                    {initials}
                  </div>
                  <span className="text-sm font-medium" style={{ color: c.text }}>{displayName}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
