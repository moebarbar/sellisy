import { useRef, useState, useEffect, useCallback } from "react";

const STATS = [
  { label: "Total Revenue", value: 12480, prefix: "$", suffix: "", decimals: 0 },
  { label: "Orders", value: 342, prefix: "", suffix: "", decimals: 0 },
  { label: "Downloads", value: 891, prefix: "", suffix: "", decimals: 0 },
  { label: "Conversion Rate", value: 4.7, prefix: "", suffix: "%", decimals: 1 },
];

const CHART_POINTS = [
  20, 35, 28, 45, 40, 55, 50, 68, 62, 75, 70, 85, 80, 92, 95,
];

const TOP_PRODUCTS = [
  { name: "UI Component Kit", units: 156, revenue: "$4,680" },
  { name: "Landing Page Templates", units: 98, revenue: "$3,920" },
  { name: "Icon Pack Pro", units: 88, revenue: "$1,760" },
];

function useCountUp(end: number, duration: number, started: boolean, decimals: number) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(parseFloat((eased * end).toFixed(decimals)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, end, duration, decimals]);

  return current;
}

function StatBox({ label, value, prefix, suffix, decimals, started }: {
  label: string; value: number; prefix: string; suffix: string; decimals: number; started: boolean;
}) {
  const count = useCountUp(value, 1800, started, decimals);
  const display = decimals > 0
    ? count.toFixed(decimals)
    : count.toLocaleString();

  return (
    <div
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
      style={{
        background: "#111",
        borderRadius: 10,
        padding: "20px 16px",
        flex: "1 1 0",
        minWidth: 140,
      }}
    >
      <span className="s-label" style={{ color: "rgba(250,250,245,0.5)", marginBottom: 8, display: "block" }}>
        {label}
      </span>
      <span className="s-heading" style={{ color: "var(--s-yellow)", fontSize: 36 }}>
        {prefix}{display}{suffix}
      </span>
    </div>
  );
}

function ChartSVG() {
  const maxVal = Math.max(...CHART_POINTS);
  const padding = 10;
  const chartH = 180;

  const viewW = 1000;

  const buildPath = useCallback(() => {
    const pts = CHART_POINTS.map((v, i) => {
      const x = padding + (i / (CHART_POINTS.length - 1)) * (viewW - padding * 2);
      const y = padding + (1 - v / maxVal) * (chartH - padding * 2);
      return `${x},${y}`;
    });
    return pts.join(" ");
  }, [maxVal, chartH]);

  const polylinePoints = buildPath();
  const fillPoints = `${padding},${chartH - padding} ${polylinePoints} ${viewW - padding},${chartH - padding}`;

  const gridLines = [0.25, 0.5, 0.75].map((frac) => {
    const y = padding + frac * (chartH - padding * 2);
    return y;
  });

  return (
    <div data-testid="analytics-chart" style={{ width: "100%", marginTop: 24 }}>
      <svg
        viewBox={`0 0 ${viewW} ${chartH}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 200, display: "block" }}
      >
        {gridLines.map((y, i) => (
          <line
            key={i}
            x1="0"
            y1={y}
            x2={viewW}
            y2={y}
            stroke="rgba(250,250,245,0.06)"
            strokeWidth="0.3"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <polygon
          points={fillPoints}
          fill="rgba(245,230,66,0.08)"
        />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="var(--s-yellow)"
          strokeWidth="0.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export function AnalyticsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-testid="analytics-section"
      style={{ padding: "120px 24px", maxWidth: 1100, margin: "0 auto" }}
    >
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <span className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 16, display: "inline-block" }}>
          {"// Know what's working"}
        </span>
        <h2 className="s-heading" style={{ fontSize: "clamp(48px, 8vw, 96px)", color: "var(--s-white)" }}>
          REAL-TIME ANALYTICS
        </h2>
        <p className="s-body" style={{ color: "rgba(250,250,245,0.55)", maxWidth: 520, margin: "16px auto 0" }}>
          Track revenue, orders, and downloads in real time. See exactly what&apos;s selling and double down on what works.
        </p>
      </div>

      <div
        data-testid="analytics-dashboard"
        style={{
          background: "#0a0a0a",
          border: "1px solid rgba(250,250,245,0.08)",
          borderRadius: 16,
          padding: "28px 28px 24px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24, alignItems: "center" }}>
          <div
            style={{
              background: "#161616",
              borderRadius: 8,
              padding: "8px 16px",
              color: "var(--s-white)",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              border: "1px solid rgba(250,250,245,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            My Store
            <span style={{ opacity: 0.4, fontSize: 10 }}>&#9662;</span>
          </div>
          <div
            style={{
              background: "#161616",
              borderRadius: 8,
              padding: "8px 16px",
              color: "rgba(250,250,245,0.6)",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              border: "1px solid rgba(250,250,245,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Last 30 days
            <span style={{ opacity: 0.4, fontSize: 10 }}>&#9662;</span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {STATS.map((s) => (
            <StatBox key={s.label} {...s} started={started} />
          ))}
        </div>

        <ChartSVG />

        <div style={{ marginTop: 28 }}>
          <span className="s-label" style={{ color: "rgba(250,250,245,0.5)", marginBottom: 12, display: "block" }}>
            Top Products
          </span>
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(250,250,245,0.06)" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                padding: "10px 16px",
                background: "#111",
                gap: 16,
              }}
            >
              <span className="s-label" style={{ color: "rgba(250,250,245,0.35)", fontSize: 10 }}>Product</span>
              <span className="s-label" style={{ color: "rgba(250,250,245,0.35)", fontSize: 10, textAlign: "right" }}>Units</span>
              <span className="s-label" style={{ color: "rgba(250,250,245,0.35)", fontSize: 10, textAlign: "right", minWidth: 80 }}>Revenue</span>
            </div>
            {TOP_PRODUCTS.map((p, i) => (
              <div
                key={p.name}
                data-testid={`top-product-row-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  padding: "12px 16px",
                  background: i % 2 === 0 ? "#0e0e0e" : "#0a0a0a",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <span style={{ color: "var(--s-white)", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{p.name}</span>
                <span style={{ color: "rgba(250,250,245,0.6)", fontSize: 14, fontFamily: "'Space Mono', monospace", textAlign: "right" }}>{p.units}</span>
                <span style={{ color: "var(--s-yellow)", fontSize: 14, fontFamily: "'Space Mono', monospace", textAlign: "right", minWidth: 80 }}>{p.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
