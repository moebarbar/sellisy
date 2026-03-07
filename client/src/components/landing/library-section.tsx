import { useState } from "react";

const products = [
  { name: "Notion Productivity System", price: 29, cat: "Templates" },
  { name: "6-Figure Email Swipe File", price: 19, cat: "Ebooks" },
  { name: "Social Media Content Bundle", price: 39, cat: "Graphics" },
  { name: "React UI Component Kit", price: 49, cat: "UI Kits" },
  { name: "ChatGPT Prompt Bible Vol.2", price: 14, cat: "Ebooks" },
  { name: "Canva Brand Kit Pro", price: 24, cat: "Graphics" },
  { name: "Automation SOP Pack", price: 34, cat: "Templates" },
  { name: "Faceless YouTube Starter Kit", price: 27, cat: "Ebooks" },
  { name: "Digital Marketing Playbook", price: 44, cat: "Ebooks" },
  { name: "Landing Page Template Pack", price: 32, cat: "Templates" },
  { name: "App Wireframe Kit", price: 19, cat: "UI Kits" },
  { name: "Mindset & Productivity Ebook", price: 12, cat: "Ebooks" },
  { name: "Figma Dashboard UI Kit", price: 59, cat: "UI Kits" },
  { name: "30-Day Content Calendar", price: 17, cat: "Tools" },
];

const tabs = ["All", "Templates", "Ebooks", "UI Kits", "Graphics", "Tools", "Software"];

const catColors: Record<string, string> = {
  Templates: "#FF6B35",
  Ebooks: "#FF3CAC",
  "UI Kits": "#00F5D4",
  Graphics: "#F5E642",
  Tools: "#F0E6D3",
  Software: "#00F5D4",
};

export function LibrarySection() {
  const [activeTab, setActiveTab] = useState("All");
  const [importedMap, setImportedMap] = useState<Record<number, boolean>>({});

  const filtered = activeTab === "All"
    ? products
    : products.filter((p) => p.cat === activeTab);

  const handleImport = (idx: number) => {
    setImportedMap((prev) => ({ ...prev, [idx]: true }));
  };

  return (
    <section
      data-testid="library-section"
      style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}
    >
      <div className="s-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          className="s-label"
          style={{ color: "var(--s-yellow)", marginBottom: 16 }}
          data-testid="library-label"
        >
          // The Library
        </div>
        <h2
          className="s-heading"
          style={{ fontSize: "clamp(48px, 8vw, 80px)", color: "var(--s-white)", marginBottom: 20 }}
          data-testid="library-title"
        >
          200+ DONE-FOR-YOU PRODUCTS
        </h2>
        <p
          className="s-body"
          style={{ color: "rgba(250,250,245,0.6)", maxWidth: 600, margin: "0 auto" }}
          data-testid="library-subtext"
        >
          Every product comes with Private Label Rights (PLR) and Master Resell Rights (MRR).
          Rebrand them, resell them, and keep 100% of the profits.
        </p>
      </div>

      <div
        className="s-reveal"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          marginBottom: 48,
        }}
        data-testid="library-tabs"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              data-testid={`tab-${tab.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setActiveTab(tab)}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
                padding: "10px 20px",
                borderRadius: 999,
                border: isActive ? "1px solid var(--s-yellow)" : "1px solid rgba(255,255,255,0.15)",
                background: isActive ? "var(--s-yellow)" : "transparent",
                color: isActive ? "var(--s-black)" : "var(--s-white)",
                transition: "all 0.2s ease",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div
        className="s-reveal"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
        }}
        data-testid="library-grid"
      >
        {filtered.map((product, i) => {
          const originalIdx = products.indexOf(product);
          const imported = !!importedMap[originalIdx];
          const badgeColor = catColors[product.cat] || "#F5E642";

          return (
            <div
              key={originalIdx}
              data-testid={`product-card-${originalIdx}`}
              data-category={product.cat}
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  background: badgeColor,
                  color: "#050505",
                  padding: "4px 10px",
                  borderRadius: 999,
                  alignSelf: "flex-start",
                  fontWeight: 700,
                }}
                data-testid={`product-category-${originalIdx}`}
              >
                {product.cat}
              </span>

              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  color: "var(--s-white)",
                  fontWeight: 500,
                  minHeight: 40,
                }}
                data-testid={`product-name-${originalIdx}`}
              >
                {product.name}
              </div>

              <div
                className="s-heading"
                style={{ fontSize: 28, color: "var(--s-yellow)" }}
                data-testid={`product-price-${originalIdx}`}
              >
                ${product.price}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <span
                  style={{
                    background: "var(--s-teal)",
                    color: "#050505",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  {"PLR \u2713"}
                </span>
                <span
                  style={{
                    background: "var(--s-yellow)",
                    color: "#050505",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  {"MRR \u2713"}
                </span>
              </div>

              <button
                data-testid={`import-btn-${originalIdx}`}
                disabled={imported}
                onClick={() => handleImport(originalIdx)}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 8,
                  border: imported ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.15)",
                  background: imported ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                  color: imported ? "#4ade80" : "var(--s-white)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  marginTop: "auto",
                  opacity: imported ? 0.8 : 1,
                }}
              >
                {imported ? "\u2713 Imported!" : "Import to Store"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
