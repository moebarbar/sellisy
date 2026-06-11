import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, Send, Trash2 } from "lucide-react";

type Review = {
  id: string;
  storeId: string;
  customerId: string;
  productId: string;
  orderId: string;
  rating: number;
  title: string | null;
  content: string;
  createdAt: string;
  customerName: string;
};

type ReviewsPayload = {
  reviews: Review[];
  aggregate: { avgRating: number; count: number };
  reviewsEnabled: boolean;
};

type CustomerMe = { customerId: string; email: string };

function StarBar({ value, size = 16, color }: { value: number; size?: number; color?: string }) {
  // Render 5 stars, partially filled based on value (0-5).
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {stars.map((s) => {
        const filled = Math.min(1, Math.max(0, value - (s - 1))); // 0..1
        return (
          <span key={s} style={{ position: "relative", display: "inline-block", width: size, height: size }}>
            <Star size={size} style={{ color: color || "currentColor", opacity: 0.25 }} />
            {filled > 0 && (
              <span style={{ position: "absolute", left: 0, top: 0, width: `${filled * 100}%`, height: "100%", overflow: "hidden" }}>
                <Star size={size} fill={color || "currentColor"} style={{ color: color || "currentColor" }} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function StarPicker({ value, onChange, size = 24 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="inline-flex items-center gap-0.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 hover:scale-110 transition-transform"
          data-testid={`button-rating-${s}`}
        >
          <Star
            size={size}
            fill={(hover || value) >= s ? "currentColor" : "transparent"}
            className={(hover || value) >= s ? "text-amber-400" : "text-muted-foreground"}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({
  storeSlug,
  productId,
  textColor,
  mutedColor,
  cardBg,
  cardBorder,
  starColor,
}: {
  storeSlug: string;
  productId: string;
  textColor: string;
  mutedColor: string;
  cardBg: string;
  cardBorder: string;
  starColor: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: customer } = useQuery<CustomerMe>({ queryKey: ["/api/customer/me"], retry: false });

  const { data, isLoading } = useQuery<ReviewsPayload>({
    queryKey: ["/api/storefront", storeSlug, "reviews", productId],
    queryFn: async () => (await apiRequest("GET", `/api/storefront/${storeSlug}/reviews?productId=${productId}`)).json(),
  });

  const post = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/storefront/${storeSlug}/reviews`, {
        productId,
        rating,
        content: content.trim(),
        title: title.trim() || undefined,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to post review");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowForm(false);
      setTitle("");
      setContent("");
      setRating(5);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["/api/storefront", storeSlug, "reviews", productId] });
    },
    onError: (err: any) => {
      setError(err.message || "Could not post review.");
    },
  });

  const deleteMine = useMutation({
    mutationFn: async (reviewId: string) => {
      await apiRequest("DELETE", `/api/storefront/${storeSlug}/reviews/${reviewId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storefront", storeSlug, "reviews", productId] });
    },
  });

  if (isLoading) {
    return (
      <div className="pdp-fade-in" style={{ color: mutedColor }} data-testid="reviews-loading">
        Loading reviews…
      </div>
    );
  }

  if (!data) return null;
  if (!data.reviewsEnabled && data.reviews.length === 0) {
    // Reviews disabled on this product (and none exist) — render nothing.
    return null;
  }

  const myReview = customer ? data.reviews.find((r) => r.customerId === customer.customerId) : null;

  return (
    <section id="reviews" className="pdp-fade-in" data-testid="product-reviews" style={{ scrollMarginTop: 80 }}>
      <div className="pdp-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold" style={{ color: textColor }}>Reviews</h2>
            {data.aggregate.count > 0 && (
              <div className="flex items-center gap-2" data-testid="reviews-aggregate">
                <StarBar value={data.aggregate.avgRating} size={18} color={starColor} />
                <span className="text-sm" style={{ color: mutedColor }}>
                  <strong style={{ color: textColor }}>{data.aggregate.avgRating.toFixed(1)}</strong>
                  {" "}from {data.aggregate.count} review{data.aggregate.count === 1 ? "" : "s"}
                </span>
              </div>
            )}
          </div>

          {data.reviewsEnabled && customer && !myReview && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm font-semibold underline"
              style={{ color: textColor }}
              data-testid="button-show-review-form"
            >
              Write a review
            </button>
          )}
        </div>

        {showForm && (
          <div
            className="rounded-lg p-4 space-y-3"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            data-testid="review-form"
          >
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: mutedColor }}>Your rating</p>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="w-full px-3 py-2 rounded-md text-sm bg-transparent outline-none"
              style={{ border: `1px solid ${cardBorder}`, color: textColor }}
              data-testid="input-review-title"
            />
            <textarea
              placeholder="What did you think of this product?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              minLength={10}
              maxLength={3000}
              rows={4}
              className="w-full px-3 py-2 rounded-md text-sm bg-transparent outline-none"
              style={{ border: `1px solid ${cardBorder}`, color: textColor }}
              data-testid="input-review-content"
            />
            {error && <p className="text-xs" style={{ color: "#ef4444" }} data-testid="review-error">{error}</p>}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowForm(false); setError(null); }}
                className="px-3 py-2 text-sm rounded-md"
                style={{ color: mutedColor }}
              >
                Cancel
              </button>
              <button
                onClick={() => post.mutate()}
                disabled={content.trim().length < 10 || post.isPending}
                className="px-4 py-2 text-sm font-semibold rounded-md inline-flex items-center gap-1.5"
                style={{ background: starColor, color: "#000" }}
                data-testid="button-submit-review"
              >
                <Send className="h-3.5 w-3.5" />
                {post.isPending ? "Posting…" : "Submit"}
              </button>
            </div>
            <p className="text-[11px]" style={{ color: mutedColor }}>
              You must have purchased this product. Your name appears with the review.
            </p>
          </div>
        )}

        {data.reviews.length === 0 ? (
          <p className="text-sm" style={{ color: mutedColor }}>
            No reviews yet — be the first to share your experience.
          </p>
        ) : (
          <ul className="space-y-4">
            {data.reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-lg p-4"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                data-testid={`review-${r.id}`}
              >
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarBar value={r.rating} size={14} color={starColor} />
                    <span className="text-sm font-semibold" style={{ color: textColor }}>{r.customerName}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: cardBorder, color: mutedColor }}>
                      Verified purchase
                    </span>
                    <span className="text-xs" style={{ color: mutedColor }}>
                      · {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {customer && r.customerId === customer.customerId && (
                    <button
                      onClick={() => deleteMine.mutate(r.id)}
                      disabled={deleteMine.isPending}
                      className="text-xs inline-flex items-center gap-1"
                      style={{ color: mutedColor }}
                      data-testid={`button-delete-review-${r.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>
                {r.title && (
                  <p className="font-semibold text-sm mb-1" style={{ color: textColor }}>{r.title}</p>
                )}
                <p className="text-sm whitespace-pre-wrap" style={{ color: textColor }}>{r.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
