import { Check, Zap, Gem } from "lucide-react";

type TemplateOption = {
  key: string;
  name: string;
  subtitle: string;
  icon: typeof Zap;
  preview: {
    bg: string;
    accent: string;
    cardBg: string;
    cardBorder: string;
    textColor: string;
    textMuted: string;
  };
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
      cardBg: "rgba(255,255,255,0.04)",
      cardBorder: "rgba(96,165,250,0.2)",
      textColor: "#ffffff",
      textMuted: "rgba(255,255,255,0.5)",
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
      cardBg: "#ffffff",
      cardBorder: "rgba(184,134,11,0.15)",
      textColor: "#1a1a1a",
      textMuted: "rgba(26,26,26,0.5)",
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

export function TemplateSelector({
  value,
  onChange,
  storeName,
}: {
  value: string;
  onChange: (value: string) => void;
  storeName?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3" data-testid="template-selector">
      {TEMPLATES.map((t) => {
        const selected = value === t.key;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className="relative rounded-md text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight truncate">{t.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate">{t.subtitle}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
