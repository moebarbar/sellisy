import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const hovering = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [role='button'], input, select, textarea, [data-cursor-hover]")) {
        hovering.current = true;
      }
    };
    const onOut = () => { hovering.current = false; };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseout", onOut);

    let raf: number;
    const loop = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;

      if (dotRef.current) {
        const s = hovering.current ? 20 : 12;
        dotRef.current.style.transform = `translate(${mouse.current.x - s / 2}px, ${mouse.current.y - s / 2}px)`;
        dotRef.current.style.width = `${s}px`;
        dotRef.current.style.height = `${s}px`;
      }
      if (ringRef.current) {
        const s = hovering.current ? 56 : 36;
        ringRef.current.style.transform = `translate(${ring.current.x - s / 2}px, ${ring.current.y - s / 2}px)`;
        ringRef.current.style.width = `${s}px`;
        ringRef.current.style.height = `${s}px`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="s-cursor-dot hidden md:block" />
      <div ref={ringRef} className="s-cursor-ring hidden md:block" />
    </>
  );
}
