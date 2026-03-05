import { Star, ShoppingBag, Gift } from "lucide-react";
import { ProtectedImage } from "@/components/protected-image";
import { StorefrontProductPlaceholder } from "@/components/product-placeholder";
import type { Product } from "@shared/schema";

type StorefrontProduct = Product & {
  isLeadMagnet?: boolean;
  isFeatured?: boolean;
  storeProductId?: string;
};

interface FeaturedProductsProps {
  products: StorefrontProduct[];
  basePath: string;
  allowImageDownload?: boolean;
  colors: {
    bg: string;
    card: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    accent: string;
    price: string;
    btnGradient: string;
    btnText: string;
    divider: string;
  };
  isDark: boolean;
  headingFamily?: string;
  cardBorderRadius?: string;
}

export function FeaturedProducts({
  products,
  basePath,
  allowImageDownload,
  colors: c,
  isDark,
  headingFamily = "inherit",
  cardBorderRadius = "12px",
}: FeaturedProductsProps) {
  if (products.length === 0) return null;

  const primary = products[0];
  const secondary = products.slice(1, 3);

  const formatPrice = (p: StorefrontProduct) => {
    if (p.isLeadMagnet || p.priceCents === 0) return "Free";
    return `$${(p.priceCents / 100).toFixed(2)}`;
  };

  const getDiscount = (p: StorefrontProduct) => {
    if (p.originalPriceCents != null && p.originalPriceCents > p.priceCents) {
      return Math.round(((p.originalPriceCents - p.priceCents) / p.originalPriceCents) * 100);
    }
    return 0;
  };

  const renderCard = (product: StorefrontProduct, size: "large" | "small") => {
    const discount = getDiscount(product);
    const isLarge = size === "large";

    return (
      <a
        key={product.id}
        href={`${basePath}/product/${product.slug || product.id}`}
        className="group block relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
        style={{
          borderRadius: cardBorderRadius,
          background: c.card,
          border: `1px solid ${c.cardBorder}`,
          boxShadow: isDark
            ? `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px ${c.accent}10`
            : `0 4px 24px rgba(0,0,0,0.08)`,
        }}
        data-testid={`card-featured-${product.id}`}
      >
        <div className="relative overflow-hidden" style={{ borderRadius: `${cardBorderRadius} ${cardBorderRadius} 0 0` }}>
          <div className="aspect-square overflow-hidden">
            {product.thumbnailUrl ? (
              <ProtectedImage
                protected={!allowImageDownload}
                src={product.thumbnailUrl}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <StorefrontProductPlaceholder
                productType={product.productType}
                accentColor={c.accent}
                title={product.title}
                className="aspect-square"
              />
            )}
          </div>

          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, ${c.accent}dd, ${c.accent}99)`,
              color: "#fff",
              boxShadow: `0 2px 8px ${c.accent}40`,
            }}
          >
            <Star className="h-3 w-3 fill-current" />
            Featured
          </div>

          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <div className="px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md"
                style={{
                  background: isDark ? "rgba(239,68,68,0.85)" : "rgba(220,38,38,0.9)",
                  color: "#fff",
                }}
              >
                -{discount}%
              </div>
            )}

            {product.isLeadMagnet && (
              <div className="px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md"
                style={{ background: c.btnGradient, color: c.btnText }}
              >
                <Gift className="h-3 w-3 inline mr-1" />FREE
              </div>
            )}
          </div>
        </div>

        <div className={`${isLarge ? "p-6" : "p-4"} relative`}>
          {product.productType && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase mb-2"
              style={{
                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                color: c.textSecondary,
              }}
            >
              {product.productType}
            </span>
          )}

          <h3
            className={`font-bold ${isLarge ? "text-lg" : "text-base"} mb-2 transition-colors group-hover:opacity-80`}
            style={{
              color: c.text,
              fontFamily: headingFamily,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            data-testid={`text-featured-title-${product.id}`}
          >
            {product.title}
          </h3>

          {isLarge && product.description && (
            <p className="text-sm mb-3" style={{
              color: c.textSecondary,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}>
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 mt-auto" style={{ borderTop: `1px solid ${c.divider}`, paddingTop: isLarge ? "12px" : "8px" }}>
            <div className="flex items-center gap-2">
              {discount > 0 && product.originalPriceCents && (
                <span className="text-xs line-through" style={{ color: c.textSecondary }}>
                  ${(product.originalPriceCents / 100).toFixed(2)}
                </span>
              )}
              <span className={`${isLarge ? "text-xl" : "text-lg"} font-bold`} style={{ color: c.price }}>
                {formatPrice(product)}
              </span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${isLarge ? "px-4 py-2" : "px-3 py-1.5"} rounded-full text-sm font-medium transition-all duration-200 group-hover:scale-105`}
              style={{
                background: c.btnGradient,
                color: c.btnText,
                boxShadow: `0 2px 8px ${c.accent}30`,
              }}
            >
              <ShoppingBag className={`${isLarge ? "h-4 w-4" : "h-3.5 w-3.5"}`} />
              {product.isLeadMagnet ? "Get Free" : "View"}
            </div>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div className="mb-12" data-testid="section-featured-products">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-current" style={{ color: c.accent }} />
          <h2 className="text-xl font-bold" style={{ color: c.text, fontFamily: headingFamily }}>
            Featured
          </h2>
        </div>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${c.accent}40, transparent)` }} />
      </div>

      {products.length === 1 ? (
        <div className="max-w-md">
          {renderCard(primary, "large")}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            {renderCard(primary, "large")}
          </div>
          <div className={`grid gap-6 ${secondary.length === 2 ? "grid-rows-2" : ""}`}>
            {secondary.map((p) => renderCard(p, "small"))}
          </div>
        </div>
      )}
    </div>
  );
}
