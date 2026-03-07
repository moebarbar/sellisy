import { useState } from "react";

const tabs = [
  { key: "courses", icon: "\ud83d\udcda", label: "Courses" },
  { key: "sops", icon: "\ud83d\udccb", label: "SOPs" },
  { key: "kb", icon: "\ud83e\udde0", label: "Knowledge Base" },
  { key: "guides", icon: "\ud83d\udcd6", label: "Guides" },
  { key: "workshops", icon: "\ud83c\udf93", label: "Workshops" },
  { key: "downloads", icon: "\ud83d\udce6", label: "Downloads" },
];

function CoursesContent() {
  return (
    <div style={{ display: "flex", gap: 0, height: "100%" }}>
      <div style={{ width: 200, borderRight: "1px solid rgba(255,255,255,0.08)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <div className="s-label" style={{ color: "var(--s-yellow)", fontSize: 9, marginBottom: 6 }}>PROGRESS</div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ width: "65%", height: "100%", background: "var(--s-yellow)", borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>65% complete</div>
        </div>
        {[
          { title: "Module 1: Basics", lessons: ["Intro to Platform", "Setting Up"] },
          { title: "Module 2: Building", lessons: ["Create First Product", "Pricing Strategy", "Launch Checklist"] },
          { title: "Module 3: Growth", lessons: ["Email Funnels", "Upsells"] },
        ].map((mod, mi) => (
          <div key={mi}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--s-white)", marginBottom: 4 }}>{mod.title}</div>
            {mod.lessons.map((l, li) => (
              <div key={li} style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", padding: "3px 0 3px 12px", borderLeft: "2px solid", borderColor: mi === 0 ? "var(--s-yellow)" : "rgba(255,255,255,0.1)" }}>
                {l}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: "rgba(245,230,66,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>&#9654;</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--s-white)" }}>Intro to Platform</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>12:34 min</div>
      </div>
    </div>
  );
}

function SOPsContent() {
  const steps = [
    { num: 1, emoji: "\ud83c\udfaf", title: "Define Objective", desc: "Set clear goals for your standard operating procedure" },
    { num: 2, emoji: "\ud83d\udcdd", title: "Document Steps", desc: "Break down each action into sequential steps" },
    { num: 3, emoji: "\ud83d\udd17", title: "Link Resources", desc: "Attach templates, tools, and reference materials" },
    { num: 4, emoji: "\u2705", title: "Add Checkpoints", desc: "Insert verification gates at critical milestones" },
    { num: 5, emoji: "\ud83d\ude80", title: "Publish & Share", desc: "Make it available to your team or customers" },
  ];
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      {steps.map((s) => (
        <div key={s.num} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--s-yellow)", color: "var(--s-black)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
          <div style={{ fontSize: 18, flexShrink: 0, lineHeight: "28px" }}>{s.emoji}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--s-white)" }}>{s.title}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function KBContent() {
  return (
    <div style={{ display: "flex", gap: 0, height: "100%" }}>
      <div style={{ width: 180, borderRight: "1px solid rgba(255,255,255,0.08)", padding: 16 }}>
        <div className="s-label" style={{ color: "var(--s-yellow)", fontSize: 9, marginBottom: 12 }}>NAVIGATION</div>
        {[
          { label: "Home", indent: 0, active: false },
          { label: "Getting Started", indent: 0, active: true },
          { label: "Installation", indent: 1, active: false },
          { label: "Quick Start", indent: 1, active: false },
          { label: "Advanced", indent: 0, active: false },
          { label: "API Reference", indent: 1, active: false },
          { label: "Webhooks", indent: 1, active: false },
        ].map((item, i) => (
          <div key={i} style={{ fontSize: 11, padding: "4px 0", paddingLeft: item.indent * 14, color: item.active ? "var(--s-yellow)" : "rgba(255,255,255,0.5)", fontWeight: item.active ? 600 : 400 }}>
            {item.indent > 0 ? "\u2514 " : ""}{item.label}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--s-white)", marginBottom: 8 }}>Getting Started</div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 12 }} />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
          Welcome to your knowledge base. This is where you can organize documentation, tutorials, and reference material for your customers.
        </div>
        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "rgba(245,230,66,0.06)", border: "1px solid rgba(245,230,66,0.15)", fontSize: 11, color: "var(--s-yellow)" }}>
          Tip: Use the tree navigation to organize content hierarchically.
        </div>
      </div>
    </div>
  );
}

function GuidesContent() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, padding: 6, background: "rgba(255,255,255,0.04)", borderRadius: 6, width: "fit-content" }}>
        {["B", "I", "H1", "H2", "Link", "List"].map((btn) => (
          <div key={btn} style={{ padding: "4px 10px", fontSize: 11, fontWeight: btn === "B" ? 700 : btn === "I" ? 400 : 600, fontStyle: btn === "I" ? "italic" : "normal", color: "rgba(255,255,255,0.6)", borderRadius: 4, background: btn === "H1" ? "rgba(245,230,66,0.15)" : "transparent", cursor: "pointer" }}>
            {btn}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--s-white)", marginBottom: 8 }}>
        How to Launch Your First Digital Product
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.9, marginBottom: 12 }}>
        Launching a digital product doesn't have to be complicated. In this guide, we'll walk you through the essential steps to go from idea to your first sale.
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.9 }}>
        Start by identifying a problem your audience faces. Then create a minimal viable product that solves it. Package it professionally, set your price, and publish it on your storefront.
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--s-yellow)" }} />
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Auto-saved 2s ago</div>
      </div>
    </div>
  );
}

function WorkshopsContent() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sessions = [
    { day: 2, label: "Product Launch 101", time: "2:00 PM" },
    { day: 5, label: "Pricing Workshop", time: "11:00 AM" },
  ];
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--s-white)" }}>January 2025</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>&larr;</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>&rarr;</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
        {days.map((d) => (
          <div key={d} style={{ fontSize: 9, textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 4, textTransform: "uppercase", letterSpacing: 1 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array.from({ length: 28 }, (_, i) => {
          const dayNum = i + 1;
          const session = sessions.find((s) => s.day === ((i % 7)));
          const highlighted = session && Math.floor(i / 7) === 1;
          return (
            <div key={i} style={{ padding: 8, borderRadius: 6, background: highlighted ? "rgba(245,230,66,0.15)" : "rgba(255,255,255,0.02)", border: highlighted ? "1px solid var(--s-yellow)" : "1px solid transparent", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: highlighted ? "var(--s-yellow)" : "rgba(255,255,255,0.4)", fontWeight: highlighted ? 700 : 400 }}>{dayNum}</div>
              {highlighted && session && (
                <div style={{ fontSize: 8, color: "var(--s-yellow)", marginTop: 2 }}>{session.time}</div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        {sessions.map((s, i) => (
          <div key={i} style={{ flex: 1, padding: 10, borderRadius: 6, background: "rgba(245,230,66,0.08)", border: "1px solid rgba(245,230,66,0.2)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--s-yellow)" }}>{s.label}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DownloadsContent() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ border: "2px dashed rgba(255,255,255,0.15)", borderRadius: 12, padding: 32, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 32, opacity: 0.3 }}>&uarr;</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--s-white)" }}>Drop files here to upload</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>PDF, ZIP, MP4, or any file up to 5GB</div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Product Name</div>
          <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>e.g. Premium Template Pack</div>
        </div>
        <div style={{ width: 120 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Price</div>
          <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "var(--s-white)", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>$</span>29.00
          </div>
        </div>
      </div>
      <button
        data-testid="button-publish-product"
        style={{
          padding: "12px 24px",
          borderRadius: 8,
          background: "var(--s-yellow)",
          color: "var(--s-black)",
          border: "none",
          fontSize: 14,
          fontWeight: 700,
          width: "100%",
          letterSpacing: 0.5,
        }}
      >
        Publish Product &rarr;
      </button>
    </div>
  );
}

const tabContentMap: Record<string, () => JSX.Element> = {
  courses: CoursesContent,
  sops: SOPsContent,
  kb: KBContent,
  guides: GuidesContent,
  workshops: WorkshopsContent,
  downloads: DownloadsContent,
};

export function CreatorSection() {
  const [activeTab, setActiveTab] = useState("courses");
  const [transitioning, setTransitioning] = useState(false);

  const handleTabChange = (key: string) => {
    if (key === activeTab) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveTab(key);
      setTransitioning(false);
    }, 150);
  };

  const ActiveContent = tabContentMap[activeTab];

  return (
    <section
      data-testid="creator-section"
      style={{
        padding: "120px 24px",
        maxWidth: 1100,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <div className="s-label" style={{ color: "var(--s-yellow)", marginBottom: 24 }} data-testid="creator-section-label">
        // Creator Tools
      </div>

      <h2 className="s-heading" style={{ fontSize: "clamp(48px, 8vw, 96px)", marginBottom: 8 }} data-testid="creator-section-title">
        <span style={{ color: "var(--s-white)" }}>CREATE ANYTHING.</span>
        <br />
        <span style={{ color: "var(--s-yellow)" }}>SELL EVERYTHING.</span>
      </h2>

      <p className="s-body" style={{ color: "rgba(250,250,245,0.55)", maxWidth: 520, marginBottom: 56 }} data-testid="creator-section-subtext">
        Build courses, SOPs, knowledge bases, guides, workshops, and digital downloads — then publish and sell them directly from your storefront. No third-party tools needed.
      </p>

      <div
        data-testid="creator-editor-mockup"
        style={{
          borderRadius: 16,
          overflow: "hidden",
          background: "#0D0D0D",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#111", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28CA42" }} />
          </div>
          <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Sellisy Editor</div>
          <div style={{ width: 46 }} />
        </div>

        <div
          data-testid="creator-tab-bar"
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              data-testid={`creator-tab-${tab.key}`}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: "10px 16px",
                fontSize: 12,
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid var(--s-yellow)" : "2px solid transparent",
                color: activeTab === tab.key ? "var(--s-yellow)" : "rgba(255,255,255,0.4)",
                fontWeight: activeTab === tab.key ? 600 : 400,
                whiteSpace: "nowrap",
                transition: "color 0.2s, border-color 0.2s",
                flexShrink: 0,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div
          data-testid="creator-tab-content"
          style={{
            minHeight: 340,
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.15s ease, transform 0.15s ease",
          }}
        >
          <ActiveContent />
        </div>
      </div>

      <div
        data-testid="creator-stickers"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
          marginTop: 48,
        }}
      >
        {[
          { text: "No-code builder", bg: "var(--s-yellow)" },
          { text: "Drag & drop", bg: "var(--s-teal)" },
          { text: "Instant publish", bg: "var(--s-orange)" },
          { text: "Built-in payments", bg: "var(--s-pink)" },
        ].map((sticker, i) => (
          <span
            key={i}
            className="s-sticker"
            style={{
              background: sticker.bg,
              animation: `s-float ${3 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
            data-testid={`creator-sticker-${i}`}
          >
            {sticker.text}
          </span>
        ))}
      </div>
    </section>
  );
}
