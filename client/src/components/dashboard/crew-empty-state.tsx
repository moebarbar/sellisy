import type { ReactNode } from "react";
import { PixelMascot } from "./pixel-mascot";

// DNA empty state: Pixel greets you instead of a generic icon-in-a-circle.
// Mono eyebrow + Bebas headline + optional action, on the halftone/neon surface.

export function CrewEmptyState({
  eyebrow,
  title,
  description,
  action,
  accent = "#F5E642",
  expression = "happy",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  accent?: string;
  expression?: "happy" | "wink" | "dead" | "flat";
}) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border bg-card px-6 py-14 text-center"
      data-testid="crew-empty-state"
    >
      {/* neon glow + halftone DNA */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl" style={{ background: `${accent}14` }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(${accent} 1px, transparent 1.4px)`, backgroundSize: "6px 6px" }} />

      <div className="relative z-10 flex flex-col items-center">
        <PixelMascot size={92} accent={accent} expression={expression} className="mb-5" />
        {eyebrow && <span className="d-eyebrow mb-2 block">{eyebrow}</span>}
        <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, lineHeight: 1, letterSpacing: "0.5px", color: "hsl(var(--foreground))" }}>
          {title}
        </h3>
        {description && (
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}
