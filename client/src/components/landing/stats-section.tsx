import { useRef, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

type Stat = { end: number; suffix: string; label: string; prefix: string };

// Static fallbacks — used until /api/public-stats responds (and if it
// fails). The library count is replaced by the live number; store and
// order counts only join the grid once they clear honesty thresholds
// (small real numbers hurt more than they help).
const fallbackStats: Stat[] = [
  { end: 200, suffix: "+", label: "Products in our library", prefix: "" },
  { end: 5, suffix: "min", label: "Average store setup time", prefix: "" },
  { end: 0, suffix: "", label: "Platform fees on your sales", prefix: "$" },
];

const STORES_THRESHOLD = 50;
const ORDERS_THRESHOLD = 250;

// 437 → "430+", 1240 → "1,200+"
function roundedDown(n: number): { end: number; suffix: string } {
  const magnitude = n >= 1000 ? 100 : 10;
  return { end: Math.floor(n / magnitude) * magnitude, suffix: "+" };
}

function buildStats(live?: { libraryProducts: number; activeStores: number; ordersDelivered: number }): Stat[] {
  if (!live) return fallbackStats;
  const out: Stat[] = [];
  if (live.libraryProducts >= 50) {
    out.push({ ...roundedDown(live.libraryProducts), label: "Products in our library", prefix: "" });
  } else {
    out.push(fallbackStats[0]);
  }
  if (live.activeStores >= STORES_THRESHOLD) {
    out.push({ ...roundedDown(live.activeStores), label: "Live creator storefronts", prefix: "" });
  } else {
    out.push(fallbackStats[1]);
  }
  if (live.ordersDelivered >= ORDERS_THRESHOLD) {
    out.push({ ...roundedDown(live.ordersDelivered), label: "Orders delivered to buyers", prefix: "" });
  } else {
    out.push(fallbackStats[2]);
  }
  return out;
}

function useCountUp(end: number, trigger: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    if (end === 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [trigger, end, duration]);

  return value;
}

function StatCell({
  end,
  suffix,
  prefix,
  label,
  trigger,
  testId,
}: {
  end: number;
  suffix: string;
  prefix: string;
  label: string;
  trigger: boolean;
  testId: string;
}) {
  const value = useCountUp(end, trigger);

  const gradientStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, var(--s-yellow), var(--s-orange))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <div
      data-testid={testId}
      style={{
        position: "relative",
        padding: "40px 24px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "var(--s-yellow)",
          transform: "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.4s ease",
        }}
        className="stat-top-line"
      />
      <div
        className="s-heading"
        style={{ ...gradientStyle, fontSize: "clamp(56px, 8vw, 96px)" }}
        data-testid={`${testId}-value`}
      >
        {prefix}{value}{suffix}
      </div>
      <div
        className="s-body"
        style={{ opacity: 0.5, marginTop: "12px", color: "var(--s-white)" }}
        data-testid={`${testId}-label`}
      >
        {label}
      </div>
      <style>{`
        [data-testid="${testId}"]:hover .stat-top-line {
          transform: scaleX(1) !important;
        }
      `}</style>
    </div>
  );
}

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  const { data: live } = useQuery<{ libraryProducts: number; activeStores: number; ordersDelivered: number }>({
    queryKey: ["/api/public-stats"],
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const stats = buildStats(live);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting) {
      setTriggered(true);
    }
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <section
      ref={sectionRef}
      data-testid="stats-section"
      style={{
        padding: "80px 24px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div
        className="s-stats-grid"
        style={{
          display: "grid",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              borderRight:
                i < stats.length - 1
                  ? "1px solid rgba(255,255,255,0.07)"
                  : "none",
            }}
          >
            <StatCell
              end={stat.end}
              suffix={stat.suffix}
              prefix={stat.prefix}
              label={stat.label}
              trigger={triggered}
              testId={`stat-cell-${i}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
