import { useEffect, useRef, useCallback } from "react";

export function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sf-revealed");
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    const items = container.querySelectorAll(".sf-reveal-item:not(.sf-revealed)");
    items.forEach((item, i) => {
      (item as HTMLElement).style.transitionDelay = `${i * 60}ms`;
      observerRef.current!.observe(item);
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observe();

    const mutation = new MutationObserver(() => {
      observe();
    });
    mutation.observe(container, { childList: true, subtree: true });

    return () => {
      observerRef.current?.disconnect();
      mutation.disconnect();
    };
  }, [observe]);

  return containerRef;
}
