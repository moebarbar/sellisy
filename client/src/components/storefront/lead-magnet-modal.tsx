import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Gift, Loader2, X } from "lucide-react";

type LeadMagnetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productId: string;
  storeId: string;
  storeSlug: string;
  colors: {
    bg: string;
    card: string;
    text: string;
    textSecondary: string;
    accent: string;
    border: string;
  };
};

export function LeadMagnetModal({
  isOpen,
  onClose,
  productTitle,
  productId,
  storeId,
  storeSlug,
  colors: c,
}: LeadMagnetModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/claim-free", {
        email,
        productId,
        storeId,
      });
      const data = await res.json();
      window.location.href = `/claim/success?orderId=${data.orderId}&store=${storeSlug}`;
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl p-6 space-y-5"
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          boxShadow: `0 25px 50px rgba(0,0,0,0.3)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: c.textSecondary }}
          data-testid="button-close-lead-modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-3">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: `${c.accent}18` }}
          >
            <Gift className="h-6 w-6" style={{ color: c.accent }} />
          </div>
          <h3 className="text-xl font-bold" style={{ color: c.text }} data-testid="text-lead-modal-title">
            Get it free
          </h3>
          <p className="text-sm" style={{ color: c.textSecondary }}>
            Enter your email to get <strong style={{ color: c.text }}>{productTitle}</strong> delivered to your inbox
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium" style={{ color: c.textSecondary }}>
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: c.textSecondary }} />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                style={{
                  background: `${c.bg}`,
                  borderColor: c.border,
                  color: c.text,
                }}
                data-testid="input-lead-email"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500" data-testid="text-lead-error">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full no-default-hover-elevate no-default-active-elevate"
            disabled={loading || !email}
            style={{
              background: c.accent,
              color: "#fff",
            }}
            data-testid="button-lead-submit"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Gift className="mr-2 h-4 w-4" />
            )}
            Get Free Access
          </Button>

          <p className="text-xs text-center" style={{ color: c.textSecondary }}>
            You'll get instant access to download your product
          </p>
        </form>
      </div>
    </div>
  );
}
