import { Link } from "wouter";
import { ArrowRight, Lightbulb, Info, AlertTriangle, Star } from "lucide-react";
import type { ArticleBlock } from "@/data/blog/types";
import { InlineText } from "./inline-text";

// Maps article blocks to branded, SEO-correct JSX. Real <h2>/<h3> with ids
// (anchor targets), semantic <ul>/<ol>/<table>, and accessible callouts.

const CALLOUT_STYLE = {
  tip: { icon: Lightbulb, ring: "border-emerald-500/30 bg-emerald-500/[0.06]", iconColor: "text-emerald-400" },
  note: { icon: Info, ring: "border-primary/30 bg-primary/[0.06]", iconColor: "text-primary" },
  warning: { icon: AlertTriangle, ring: "border-amber-500/30 bg-amber-500/[0.06]", iconColor: "text-amber-400" },
  key: { icon: Star, ring: "border-primary/40 bg-primary/[0.08]", iconColor: "text-primary" },
} as const;

export function ArticleRenderer({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </div>
  );
}

function Block({ block: b }: { block: ArticleBlock }) {
  switch (b.type) {
    case "p":
      return <p className="text-[17px] leading-[1.75] text-muted-foreground"><InlineText text={b.text} /></p>;

    case "h2":
      return (
        <h2 id={b.id} className="scroll-mt-24 pt-4 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {b.text}
        </h2>
      );

    case "h3":
      return (
        <h3 id={b.id} className="scroll-mt-24 pt-2 text-xl font-semibold tracking-tight text-foreground">
          {b.text}
        </h3>
      );

    case "ul":
      return (
        <ul className="space-y-2.5 pl-1">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-[17px] leading-[1.7] text-muted-foreground">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span><InlineText text={it} /></span>
            </li>
          ))}
        </ul>
      );

    case "ol":
      return (
        <ol className="space-y-3 pl-1">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-[17px] leading-[1.7] text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{i + 1}</span>
              <span className="pt-0.5"><InlineText text={it} /></span>
            </li>
          ))}
        </ol>
      );

    case "callout": {
      const s = CALLOUT_STYLE[b.variant];
      const Icon = s.icon;
      return (
        <div className={`rounded-xl border p-4 sm:p-5 ${s.ring}`}>
          <div className="flex gap-3">
            <Icon className={`h-5 w-5 shrink-0 ${s.iconColor}`} />
            <div>
              {b.title && <p className="mb-1 font-semibold text-foreground">{b.title}</p>}
              <p className="text-[15px] leading-relaxed text-muted-foreground"><InlineText text={b.text} /></p>
            </div>
          </div>
        </div>
      );
    }

    case "quote":
      return (
        <blockquote className="border-l-2 border-primary pl-5 italic text-[18px] leading-relaxed text-foreground/90">
          <InlineText text={b.text} />
          {b.cite && <footer className="mt-2 text-sm not-italic text-muted-foreground">— {b.cite}</footer>}
        </blockquote>
      );

    case "table":
      return (
        <figure className="my-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {b.headers.map((h, i) => (
                  <th key={i} className={`p-3 text-left font-semibold ${i === b.highlightCol ? "text-primary" : "text-foreground"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/60">
                  {row.map((cell, ci) => (
                    <td key={ci} className={`p-3 ${ci === b.highlightCol ? "font-semibold text-primary" : ci === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {b.caption && <figcaption className="mt-2 text-xs text-muted-foreground/70">{b.caption}</figcaption>}
        </figure>
      );

    case "cta":
      return (
        <div className="my-4 rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{b.heading}</h3>
          <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{b.text}</p>
          {b.href.startsWith("/") ? (
            <Link href={b.href} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              {b.label} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <a href={b.href} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              {b.label} <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      );

    case "faq":
      return (
        <div className="space-y-3 pt-2">
          {b.items.map((it, i) => (
            <details key={i} className="group rounded-xl border border-border p-4 [&_summary]:cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-foreground">
                {it.q}
                <span className="ml-2 text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground"><InlineText text={it.a} /></p>
            </details>
          ))}
        </div>
      );

    default:
      return null;
  }
}
