import { useEffect, useRef } from "react";
import type { ImgHTMLAttributes } from "react";

interface ProtectedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  protected?: boolean;
}

export function ProtectedImage({ protected: isProtected = true, className, style, ...props }: ProtectedImageProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProtected || !overlayRef.current) return;
    const el = overlayRef.current;
    const prevent = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
    el.addEventListener("contextmenu", prevent, true);
    el.addEventListener("dragstart", prevent, true);
    return () => {
      el.removeEventListener("contextmenu", prevent, true);
      el.removeEventListener("dragstart", prevent, true);
    };
  }, [isProtected]);

  if (!isProtected) {
    return <img className={className} style={style} {...props} />;
  }

  return (
    <div
      className="relative select-none"
      style={{ display: "inline-block", width: "100%", height: "100%", WebkitTouchCallout: "none" } as React.CSSProperties}
    >
      <img
        className={className}
        style={{ ...style, pointerEvents: "none", WebkitUserDrag: "none" } as React.CSSProperties}
        draggable={false}
        {...props}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{ zIndex: 2, WebkitTouchCallout: "none" } as React.CSSProperties}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        data-testid="image-protection-overlay"
      />
    </div>
  );
}
