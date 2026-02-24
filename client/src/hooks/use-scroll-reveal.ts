import { useEffect, useRef } from "react";

export function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sf-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    const items = container.querySelectorAll(".sf-reveal-item");
    items.forEach((item, i) => {
      (item as HTMLElement).style.transitionDelay = `${i * 60}ms`;
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  return containerRef;
}
