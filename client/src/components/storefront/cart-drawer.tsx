import { X, Trash2, ShoppingCart, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { ProtectedImage } from "@/components/protected-image";
import type { ThemeColors, StorefrontTheme } from "./theme-types";

interface CartDrawerProps {
  c: ThemeColors;
  theme: StorefrontTheme;
  storeId: string;
  allowImageDownload: boolean;
  onCheckout: () => void;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartDrawer({ c, theme, storeId, allowImageDownload, onCheckout }: CartDrawerProps) {
  const { items, removeItem, totalCents, isOpen, closeCart } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "min(400px, 100vw)",
          background: c.card,
          borderLeft: `1px solid ${c.cardBorder}`,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${c.cardBorder}` }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" style={{ color: c.accent }} />
            <span className="font-semibold text-base" style={{ color: c.text, fontFamily: theme.typography.headingFamily }}>
              Cart ({items.length})
            </span>
          </div>
          <button
            onClick={closeCart}
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ color: c.textSecondary }}
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center px-4" style={{ color: c.textSecondary }}>
              <ShoppingCart className="h-14 w-14 opacity-20" />
              <div className="space-y-1">
                <p className="text-sm font-semibold" style={{ color: c.text }}>Your cart is empty</p>
                <p className="text-xs">Browse products and add them to start your order.</p>
              </div>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.productId}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: c.bgAlt, border: `1px solid ${c.cardBorder}` }}
              >
                {item.thumbnailUrl ? (
                  <ProtectedImage
                    src={item.thumbnailUrl}
                    alt={item.title}
                    protected={!allowImageDownload}
                    className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: c.card }}
                  >
                    <ShoppingCart className="h-6 w-6 opacity-30" style={{ color: c.textSecondary }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: c.text, fontFamily: theme.typography.bodyFamily }}>
                    {item.title}
                  </p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: c.price }}>
                    {formatPrice(item.priceCents)}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="flex-shrink-0 p-1.5 rounded-lg"
                  style={{ color: c.textSecondary }}
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            className="px-5 py-4 space-y-3"
            style={{ borderTop: `1px solid ${c.cardBorder}` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: c.textSecondary }}>Total</span>
              <span className="text-lg font-bold" style={{ color: c.price }}>{formatPrice(totalCents)}</span>
            </div>
            <button
              onClick={() => { closeCart(); onCheckout(); }}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{
                background: c.btnGradient,
                color: c.btnText,
                borderRadius: theme.layout.buttonBorderRadius,
              }}
            >
              Checkout <ArrowRight className="h-4 w-4" />
            </button>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <div className="flex items-center gap-1 text-[10px]" style={{ color: c.textSecondary }}>
                <ShieldCheck className="h-3 w-3" />
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-1 text-[10px]" style={{ color: c.textSecondary }}>
                <Zap className="h-3 w-3" />
                <span>Instant delivery</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
