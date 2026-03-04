import { useEffect } from "react";

type PageMeta = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  ogSiteName?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  keywords?: string;
  favicon?: string;
  jsonLd?: Record<string, any>;
};

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function setFavicon(url: string) {
  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
  link.type = url.endsWith(".svg") ? "image/svg+xml" : "image/png";
}

function setJsonLd(data: Record<string, any>) {
  let el = document.querySelector('script[data-seo="jsonld"]') as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-seo", "jsonld");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  const el = document.querySelector('script[data-seo="jsonld"]');
  if (el) el.remove();
}

function removeCanonical() {
  const el = document.querySelector('link[rel="canonical"]');
  if (el) el.remove();
}

const DEFAULT_TITLE = "Sellisy - Create & Sell Digital Products";
const DEFAULT_DESC = "Build your own digital storefront, sell products, and grow your business with Sellisy.";
const DEFAULT_FAVICON = "/favicon.png";

export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    if (meta.title) document.title = meta.title;
    if (meta.description) setMeta("description", meta.description);
    if (meta.keywords) setMeta("keywords", meta.keywords);

    const ogTitle = meta.ogTitle || meta.title || "";
    const ogDesc = meta.ogDescription || meta.description || "";
    if (ogTitle) setMeta("og:title", ogTitle, true);
    if (ogDesc) setMeta("og:description", ogDesc, true);
    if (meta.ogImage) {
      setMeta("og:image", meta.ogImage, true);
      setMeta("og:image:alt", ogTitle, true);
    }
    if (meta.ogType) setMeta("og:type", meta.ogType, true);
    if (meta.ogUrl) setMeta("og:url", meta.ogUrl, true);
    if (meta.ogSiteName) setMeta("og:site_name", meta.ogSiteName, true);

    const twitterCard = meta.twitterCard || "summary_large_image";
    setMeta("twitter:card", twitterCard);
    if (ogTitle) setMeta("twitter:title", ogTitle);
    if (ogDesc) setMeta("twitter:description", ogDesc);
    if (meta.ogImage) {
      setMeta("twitter:image", meta.ogImage);
      setMeta("twitter:image:alt", ogTitle);
    }

    if (meta.canonicalUrl) setLink("canonical", meta.canonicalUrl);
    if (meta.favicon) setFavicon(meta.favicon);
    if (meta.jsonLd) setJsonLd(meta.jsonLd);

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta("description", DEFAULT_DESC);
      setMeta("og:title", DEFAULT_TITLE, true);
      setMeta("og:description", DEFAULT_DESC, true);
      setFavicon(DEFAULT_FAVICON);
      removeJsonLd();
      removeCanonical();
    };
  }, [meta.title, meta.description, meta.ogTitle, meta.ogDescription, meta.ogImage, meta.ogType, meta.ogUrl, meta.ogSiteName, meta.twitterCard, meta.canonicalUrl, meta.keywords, meta.favicon, meta.jsonLd]);
}
