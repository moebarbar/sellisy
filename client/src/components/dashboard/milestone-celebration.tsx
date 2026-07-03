import { useEffect, useMemo, useState } from "react";

// "Leveling up your GDP" — a crew celebration when the seller crosses an
// earnings milestone (first sale, $100, $1k, …). Ties the brand DNA into the
// product's most emotional moment. Fires once per milestone; already-passed
// milestones are seeded silently on first run so established stores aren't
// spammed retroactively.

type Milestone = {
  id: string;
  reached: (orders: number, revenueCents: number) => boolean;
  title: string;
  subtitle: string;
};

// Order matters: only the HIGHEST newly-crossed milestone is shown at once.
const MILESTONES: Milestone[] = [
  { id: "first-sale", reached: (o) => o >= 1, title: "FIRST SALE!", subtitle: "The Sublevel just lit up. You're officially in business." },
  { id: "rev-100", reached: (_, r) => r >= 10_000, title: "$100 EARNED", subtitle: "Your personal GDP is climbing. Keep stacking." },
  { id: "rev-1k", reached: (_, r) => r >= 100_000, title: "$1,000 EARNED", subtitle: "Four figures, 100% yours. The crew is proud." },
  { id: "rev-5k", reached: (_, r) => r >= 500_000, title: "$5,000 EARNED", subtitle: "This is a real business now. Onward." },
  { id: "rev-10k", reached: (_, r) => r >= 1_000_000, title: "$10,000 EARNED", subtitle: "Five figures. The Sublevel salutes you." },
  { id: "rev-50k", reached: (_, r) => r >= 5_000_000, title: "$50,000 EARNED", subtitle: "You're running an economy. Keep growing your GDP." },
  { id: "rev-100k", reached: (_, r) => r >= 10_000_000, title: "$100,000 EARNED", subtitle: "Six figures, zero platform cut. Legend." },
];

const NEON = ["#F5E642", "#FF3CAC", "#00F5D4", "#FF6B35", "#FAFAF5"];

function storageKey(storeId: string) {
  return `sellisy_celebrated_${storeId}`;
}

export function MilestoneCelebration({
  storeId,
  totalOrders,
  totalRevenueCents,
  ready,
}: {
  storeId: string;
  totalOrders: number;
  totalRevenueCents: number;
  ready: boolean;
}) {
  const [active, setActive] = useState<Milestone | null>(null);

  useEffect(() => {
    if (!ready || !storeId) return;
    const crossed = MILESTONES.filter((m) => m.reached(totalOrders, totalRevenueCents)).map((m) => m.id);

    let celebrated: string[] | null = null;
    try {
      const raw = localStorage.getItem(storageKey(storeId));
      celebrated = raw ? (JSON.parse(raw) as string[]) : null;
    } catch {
      celebrated = null;
    }

    // First run for this store: seed everything already achieved so we never
    // celebrate the past — only future crossings fire.
    if (celebrated === null) {
      try {
        localStorage.setItem(storageKey(storeId), JSON.stringify(crossed));
      } catch {}
      return;
    }

    const newly = crossed.filter((id) => !celebrated!.includes(id));
    if (newly.length === 0) return;

    // Show only the highest new milestone, but mark ALL newly-crossed as seen
    // so we don't queue up lower ones next render.
    const highest = MILESTONES.filter((m) => newly.includes(m.id)).pop() || null;
    try {
      localStorage.setItem(storageKey(storeId), JSON.stringify([...celebrated, ...newly]));
    } catch {}
    if (highest) setActive(highest);
  }, [ready, storeId, totalOrders, totalRevenueCents]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 44 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.4 + Math.random() * 1.8,
        color: NEON[i % NEON.length],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
      })),
    [active?.id],
  );

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(5,5,5,0.72)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      data-testid="milestone-celebration"
      onClick={() => setActive(null)}
    >
      {/* confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {confetti.map((c, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: -20,
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 0.4,
              background: c.color,
              borderRadius: 1,
              transform: `rotate(${c.rotate}deg)`,
              animation: `mc-fall ${c.duration}s linear ${c.delay}s infinite`,
              boxShadow: `0 0 8px ${c.color}80`,
            }}
          />
        ))}
      </div>

      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border text-center"
        style={{ background: "#0a0a0a", borderColor: "rgba(245,230,66,0.3)", boxShadow: "0 0 80px rgba(255,60,172,0.2), 0 0 40px rgba(245,230,66,0.12)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img src="/dna/crew-earnings.jpg" alt="" className="h-40 w-full object-cover" style={{ objectPosition: "center 40%" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0) 30%, #0a0a0a)" }} />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(0,0,0,0.4) 1px, transparent 1.4px)", backgroundSize: "4px 4px", mixBlendMode: "multiply", opacity: 0.2 }} />
        </div>

        <div className="px-6 pb-6 -mt-6 relative">
          <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.25em]" style={{ color: "#FF3CAC" }}>
            You leveled up your GDP
          </p>
          <h2 className="mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(38px, 9vw, 56px)", lineHeight: 1, letterSpacing: 2, color: "#F5E642", textShadow: "0 0 24px rgba(245,230,66,0.4)" }}>
            {active.title}
          </h2>
          <p className="mx-auto mb-5 max-w-xs text-sm" style={{ color: "rgba(250,250,245,0.7)" }}>
            {active.subtitle}
          </p>
          <button
            type="button"
            onClick={() => setActive(null)}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #F5E642, #FF3CAC)", color: "#050505", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}
            data-testid="milestone-dismiss"
          >
            KEEP GOING →
          </button>
        </div>
      </div>
    </div>
  );
}
