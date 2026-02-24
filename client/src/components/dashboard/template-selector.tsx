import { useState } from "react";
import { Check, Zap, Gem, Eye, ShoppingBag, Package, Star, X, Sunrise, Flame, Snowflake, Moon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";

type TemplatePreviewColors = {
  bg: string;
  accent: string;
  accentLight: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  textMuted: string;
  heroBg: string;
  headerBg: string;
  headerBorder: string;
  buttonBg: string;
  buttonText: string;
  tagBg: string;
  tagText: string;
};

type TemplateOption = {
  key: string;
  name: string;
  subtitle: string;
  icon: typeof Zap;
  preview: TemplatePreviewColors;
};

const TEMPLATES: TemplateOption[] = [
  {
    key: "neon",
    name: "Neon",
    subtitle: "Bold & Modern",
    icon: Zap,
    preview: {
      bg: "#0a0a1a",
      accent: "#60a5fa",
      accentLight: "#93c5fd",
      cardBg: "rgba(255,255,255,0.04)",
      cardBorder: "rgba(96,165,250,0.2)",
      textColor: "#ffffff",
      textMuted: "rgba(255,255,255,0.5)",
      heroBg: "linear-gradient(135deg, #0a0a2e 0%, #1a1a3e 50%, #0a1628 100%)",
      headerBg: "rgba(10,10,26,0.95)",
      headerBorder: "rgba(96,165,250,0.15)",
      buttonBg: "linear-gradient(135deg, #3b82f6, #7c3aed, #06b6d4)",
      buttonText: "#ffffff",
      tagBg: "rgba(96,165,250,0.15)",
      tagText: "#93c5fd",
    },
  },
  {
    key: "silk",
    name: "Silk",
    subtitle: "Elegant & Minimal",
    icon: Gem,
    preview: {
      bg: "#faf9f6",
      accent: "#b8860b",
      accentLight: "#d4a853",
      cardBg: "#ffffff",
      cardBorder: "rgba(184,134,11,0.15)",
      textColor: "#1a1a1a",
      textMuted: "rgba(26,26,26,0.5)",
      heroBg: "linear-gradient(135deg, #f5f0e8 0%, #ede4d3 50%, #f8f4ed 100%)",
      headerBg: "rgba(250,249,246,0.95)",
      headerBorder: "rgba(184,134,11,0.12)",
      buttonBg: "linear-gradient(135deg, #b8860b, #d4a853)",
      buttonText: "#ffffff",
      tagBg: "rgba(184,134,11,0.1)",
      tagText: "#b8860b",
    },
  },
  {
    key: "aurora",
    name: "Aurora",
    subtitle: "Vibrant & Glassy",
    icon: Sunrise,
    preview: {
      bg: "#0a0f1a",
      accent: "#2dd4bf",
      accentLight: "#5eead4",
      cardBg: "rgba(255,255,255,0.04)",
      cardBorder: "rgba(45,212,191,0.2)",
      textColor: "#ffffff",
      textMuted: "rgba(255,255,255,0.5)",
      heroBg: "linear-gradient(135deg, #0a1628 0%, #0f1d30 50%, #0a0f1a 100%)",
      headerBg: "rgba(10,15,26,0.95)",
      headerBorder: "rgba(45,212,191,0.15)",
      buttonBg: "linear-gradient(135deg, #2dd4bf, #8b5cf6, #22d3ee)",
      buttonText: "#ffffff",
      tagBg: "rgba(45,212,191,0.15)",
      tagText: "#5eead4",
    },
  },
  {
    key: "ember",
    name: "Ember",
    subtitle: "Warm & Bold",
    icon: Flame,
    preview: {
      bg: "#fdf6f0",
      accent: "#e67e22",
      accentLight: "#f0a050",
      cardBg: "#ffffff",
      cardBorder: "rgba(230,126,34,0.15)",
      textColor: "#3d2b1f",
      textMuted: "rgba(61,43,31,0.5)",
      heroBg: "linear-gradient(135deg, #fdf6f0 0%, #fce8d5 50%, #fdf6f0 100%)",
      headerBg: "rgba(253,246,240,0.95)",
      headerBorder: "rgba(230,126,34,0.12)",
      buttonBg: "linear-gradient(135deg, #e67e22, #d35400)",
      buttonText: "#ffffff",
      tagBg: "rgba(230,126,34,0.1)",
      tagText: "#e67e22",
    },
  },
  {
    key: "frost",
    name: "Frost",
    subtitle: "Clean & Crisp",
    icon: Snowflake,
    preview: {
      bg: "#f0f7ff",
      accent: "#3b82f6",
      accentLight: "#93c5fd",
      cardBg: "rgba(255,255,255,0.9)",
      cardBorder: "rgba(59,130,246,0.15)",
      textColor: "#0f172a",
      textMuted: "rgba(15,23,42,0.5)",
      heroBg: "linear-gradient(135deg, #e8f2ff 0%, #dbeafe 50%, #f0f7ff 100%)",
      headerBg: "rgba(240,247,255,0.95)",
      headerBorder: "rgba(59,130,246,0.12)",
      buttonBg: "linear-gradient(135deg, #3b82f6, #2563eb)",
      buttonText: "#ffffff",
      tagBg: "rgba(59,130,246,0.1)",
      tagText: "#3b82f6",
    },
  },
  {
    key: "midnight",
    name: "Midnight",
    subtitle: "Sleek & Dark",
    icon: Moon,
    preview: {
      bg: "#0b0d1a",
      accent: "#818cf8",
      accentLight: "#a5b4fc",
      cardBg: "rgba(255,255,255,0.03)",
      cardBorder: "rgba(129,140,248,0.2)",
      textColor: "#e2e8f0",
      textMuted: "rgba(226,232,240,0.5)",
      heroBg: "linear-gradient(135deg, #0b0d1a 0%, #151830 50%, #0b0d1a 100%)",
      headerBg: "rgba(11,13,26,0.95)",
      headerBorder: "rgba(129,140,248,0.15)",
      buttonBg: "linear-gradient(135deg, #818cf8, #6366f1, #a78bfa)",
      buttonText: "#ffffff",
      tagBg: "rgba(129,140,248,0.15)",
      tagText: "#a5b4fc",
    },
  },
];

function MiniStorefront({ t, storeName }: { t: TemplateOption; storeName?: string }) {
  const p = t.preview;
  const name = storeName || "Your Store";
  return (
    <div
      className="w-full rounded-md overflow-hidden select-none pointer-events-none"
      style={{ background: p.bg, aspectRatio: "16/10" }}
    >
      <div
        className="flex items-center justify-between px-2.5 py-1.5"
        style={{ borderBottom: `1px solid ${p.cardBorder}` }}
      >
        <span className="text-[8px] font-bold truncate" style={{ color: p.textColor }}>
          {name}
        </span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.textMuted }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.textMuted }} />
        </div>
      </div>

      <div className="px-2.5 py-2">
        <div
          className="w-full rounded-sm mb-2 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${p.accent}30, ${p.accent}10)`,
            height: "28px",
          }}
        >
          <span className="text-[7px] font-semibold" style={{ color: p.accent }}>
            Premium Digital Products
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-sm overflow-hidden"
              style={{
                background: p.cardBg,
                border: `1px solid ${p.cardBorder}`,
              }}
            >
              <div
                className="w-full"
                style={{
                  height: "18px",
                  background: `linear-gradient(${135 + i * 20}deg, ${p.accent}${i === 1 ? "25" : "15"}, ${p.accent}08)`,
                }}
              />
              <div className="px-1 py-1">
                <div
                  className="h-[3px] rounded-full mb-0.5"
                  style={{ background: p.textMuted, width: `${60 + i * 10}%` }}
                />
                <div
                  className="h-[3px] rounded-full"
                  style={{ background: p.accent, width: "40%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SAMPLE_PRODUCTS = [
  { title: "Pro Design Kit", price: "$49", tag: "Design" },
  { title: "SEO Masterclass", price: "$29", tag: "Course" },
  { title: "Analytics Dashboard", price: "$79", tag: "Software" },
  { title: "Email Templates", price: "$19", tag: "Templates" },
  { title: "Photo Presets Pack", price: "$39", tag: "Graphics" },
  { title: "Business Plan Bundle", price: "$59", tag: "Bundle" },
];

function FullPreview({ t, storeName }: { t: TemplateOption; storeName?: string }) {
  const p = t.preview;
  const name = storeName || "Your Store";

  return (
    <div
      className="w-full rounded-md overflow-hidden select-none"
      style={{ background: p.bg }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{
          background: p.headerBg,
          borderBottom: `1px solid ${p.headerBorder}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" style={{ color: p.accent }} />
          <span className="text-sm font-bold" style={{ color: p.textColor }}>
            {name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: p.textMuted }}>Products</span>
          <span className="text-xs" style={{ color: p.textMuted }}>Bundles</span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: `${p.accent}15`, border: `1px solid ${p.accent}25` }}
          >
            <Package className="h-3 w-3" style={{ color: p.accent }} />
          </div>
        </div>
      </div>

      <div
        className="px-5 py-8 text-center relative overflow-hidden"
        style={{ background: p.heroBg }}
      >
        {t.key === "neon" && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
            <div
              className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }}
            />
          </>
        )}
        {t.key === "silk" && (
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, transparent, ${p.accent}40, transparent)` }}
          />
        )}
        {t.key === "aurora" && (
          <>
            <div
              className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgba(45,212,191,0.12) 0%, rgba(139,92,246,0.06) 50%, transparent 70%)" }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${p.accent}30, rgba(139,92,246,0.2), transparent)` }}
            />
          </>
        )}
        {t.key === "ember" && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${p.accent}40, rgba(211,84,0,0.3), transparent)` }}
          />
        )}
        {t.key === "frost" && (
          <div
            className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }}
          />
        )}
        {t.key === "midnight" && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle 1px, rgba(129,140,248,0.15) 100%, transparent 100%)`,
                backgroundSize: "30px 30px",
              }}
            />
            <div
              className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(129,140,248,0.1) 0%, rgba(99,102,241,0.05) 40%, transparent 70%)" }}
            />
          </>
        )}
        <div className="relative z-10">
          <p
            className="text-[10px] font-medium uppercase tracking-[0.2em] mb-2"
            style={{ color: p.accent }}
          >
            {({ silk: "Curated Collection", aurora: "Northern Lights", ember: "Handcrafted Goods", frost: "Crystal Clear Quality", midnight: "Midnight Collection" } as Record<string, string>)[t.key] || "Digital Storefront"}
          </p>
          <h2 className="text-xl font-bold mb-2" style={{ color: p.textColor }}>
            {name}
          </h2>
          <p className="text-xs max-w-[280px] mx-auto mb-4" style={{ color: p.textMuted }}>
            Premium digital products crafted for creators and entrepreneurs
          </p>
          <div
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold"
            style={{ background: p.buttonBg, color: p.buttonText }}
          >
            <ShoppingBag className="h-3 w-3" />
            Browse Products
          </div>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: p.textColor }}>Featured Products</h3>
          <span className="text-[10px]" style={{ color: p.textMuted }}>6 products</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {SAMPLE_PRODUCTS.map((prod, i) => (
            <div
              key={i}
              className="rounded-md overflow-hidden"
              style={{
                background: p.cardBg,
                border: `1px solid ${p.cardBorder}`,
              }}
            >
              <div
                className="w-full relative"
                style={{
                  height: "60px",
                  background: `linear-gradient(${120 + i * 30}deg, ${p.accent}${i % 2 === 0 ? "20" : "12"}, ${p.accent}05)`,
                }}
              >
                {i === 0 && (
                  <div
                    className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[7px] font-bold"
                    style={{ background: "rgba(16,185,129,0.2)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.3)" }}
                  >
                    <Star className="h-2 w-2" /> Deal
                  </div>
                )}
              </div>
              <div className="px-2 py-2">
                <div
                  className="inline-block px-1.5 py-0.5 rounded text-[7px] font-medium mb-1.5"
                  style={{ background: p.tagBg, color: p.tagText }}
                >
                  {prod.tag}
                </div>
                <p className="text-[10px] font-semibold mb-0.5 truncate" style={{ color: p.textColor }}>
                  {prod.title}
                </p>
                <p className="text-[10px] font-bold" style={{ color: p.accent }}>
                  {prod.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="px-5 py-3 text-center"
        style={{ borderTop: `1px solid ${p.cardBorder}` }}
      >
        <p className="text-[9px]" style={{ color: p.textMuted }}>
          Powered by Sellisy
        </p>
      </div>
    </div>
  );
}

export function TemplateSelector({
  value,
  onChange,
  storeName,
}: {
  value: string;
  onChange: (value: string) => void;
  storeName?: string;
}) {
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const previewTemplate = TEMPLATES.find((t) => t.key === previewKey);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3" data-testid="template-selector">
        {TEMPLATES.map((t) => {
          const selected = value === t.key;
          const Icon = t.icon;
          return (
            <div key={t.key} className="relative">
              <button
                type="button"
                onClick={() => onChange(t.key)}
                className="relative w-full rounded-md text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  border: selected
                    ? "2px solid hsl(var(--primary))"
                    : "2px solid hsl(var(--border))",
                  padding: "0",
                }}
                data-testid={`button-template-${t.key}`}
              >
                {selected && (
                  <div
                    className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}

                <MiniStorefront t={t} storeName={storeName} />

                <div className="px-2.5 py-2 flex items-center gap-1.5"
                  style={{ borderTop: `1px solid ${selected ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))"}` }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: t.preview.accent }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight truncate">{t.subtitle}</p>
                  </div>
                </div>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute bottom-1.5 right-1.5 h-6 gap-1 text-[10px] px-1.5 text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewKey(t.key);
                }}
                data-testid={`button-preview-${t.key}`}
              >
                <Eye className="h-3 w-3" />
                Preview
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewKey(null)}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>{previewTemplate?.name || "Template"} Preview</DialogTitle>
            <DialogDescription>Full preview of the {previewTemplate?.name || ""} storefront template</DialogDescription>
          </VisuallyHidden>
          {previewTemplate && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <previewTemplate.icon className="h-4 w-4" style={{ color: previewTemplate.preview.accent }} />
                  <span className="text-sm font-semibold">{previewTemplate.name} Template</span>
                  <span className="text-xs text-muted-foreground">— {previewTemplate.subtitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onChange(previewTemplate.key);
                      setPreviewKey(null);
                    }}
                    data-testid={`button-select-preview-${previewTemplate.key}`}
                  >
                    {value === previewTemplate.key ? "Selected" : "Use This Template"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewKey(null)}
                    data-testid="button-close-preview"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="overflow-auto max-h-[70vh]">
                <FullPreview t={previewTemplate} storeName={storeName} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
