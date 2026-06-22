import { Fragment, type ReactNode } from "react";
import { Link } from "wouter";

// Minimal, safe inline renderer for article text: supports **bold** and
// [label](href). Parses to real React nodes — no dangerouslySetInnerHTML, so
// it's XSS-safe and emits proper <strong>/<a> for SEO. Internal links
// (starting with "/") use wouter's <Link> for client-side nav; external links
// open in a new tab with rel=noopener.

export function InlineText({ text }: { text: string }): ReactNode {
  return <>{parseInline(text)}</>;
}

function parseInline(text: string): ReactNode[] {
  // Split on links first, then bold within each segment.
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={key++}>{parseBold(text.slice(last, m.index), key)}</Fragment>);
    const [, label, href] = m;
    if (href.startsWith("/")) {
      out.push(
        <Link key={key++} href={href} className="text-primary underline underline-offset-2 hover:opacity-80">
          {label}
        </Link>,
      );
    } else {
      out.push(
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">
          {label}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={key++}>{parseBold(text.slice(last), key)}</Fragment>);
  return out;
}

function parseBold(text: string, baseKey: number): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={`${baseKey}-${i}`} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={`${baseKey}-${i}`}>{p}</Fragment>
    ),
  );
}
