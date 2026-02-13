import { useEffect, useRef } from "react";

const SQUARE_COUNT = 18;

interface FloatingSquare {
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  speed: number;
  rotSpeed: number;
  delay: number;
  border: boolean;
}

function generateSquares(): FloatingSquare[] {
  const squares: FloatingSquare[] = [];
  for (let i = 0; i < SQUARE_COUNT; i++) {
    squares.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 20 + Math.random() * 80,
      rotation: Math.random() * 360,
      opacity: 0.03 + Math.random() * 0.08,
      speed: 15 + Math.random() * 25,
      rotSpeed: 20 + Math.random() * 40,
      delay: Math.random() * -20,
      border: Math.random() > 0.5,
    });
  }
  return squares;
}

const squares = generateSquares();

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const drawGrid = () => {
      const spacing = 60;
      ctx.strokeStyle = "rgba(139, 149, 255, 0.06)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = 0; x <= w(); x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h());
      }
      for (let y = 0; y <= h(); y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(w(), y);
      }
      ctx.stroke();
    };

    const draw = (t: number) => {
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, w(), h());

      const grd = ctx.createLinearGradient(0, 0, w(), h());
      grd.addColorStop(0, "#0f0f1a");
      grd.addColorStop(0.5, "#111128");
      grd.addColorStop(1, "#0a0a18");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w(), h());

      drawGrid();

      const sec = t / 1000;
      for (const sq of squares) {
        const px = (sq.x / 100) * w();
        const py = (sq.y / 100) * h() + Math.sin((sec + sq.delay) / sq.speed * Math.PI * 2) * 30;
        const rot = ((sec + sq.delay) / sq.rotSpeed) * 360;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((rot * Math.PI) / 180);

        if (sq.border) {
          ctx.strokeStyle = `rgba(120, 130, 255, ${sq.opacity})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);
        } else {
          ctx.fillStyle = `rgba(100, 120, 255, ${sq.opacity})`;
          ctx.fillRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);
        }

        ctx.restore();
      }

      const radGrd = ctx.createRadialGradient(w() * 0.3, h() * 0.4, 0, w() * 0.3, h() * 0.4, w() * 0.6);
      radGrd.addColorStop(0, "rgba(99, 102, 241, 0.08)");
      radGrd.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = radGrd;
      ctx.fillRect(0, 0, w(), h());

      const radGrd2 = ctx.createRadialGradient(w() * 0.8, h() * 0.7, 0, w() * 0.8, h() * 0.7, w() * 0.5);
      radGrd2.addColorStop(0, "rgba(139, 92, 246, 0.06)");
      radGrd2.addColorStop(1, "rgba(139, 92, 246, 0)");
      ctx.fillStyle = radGrd2;
      ctx.fillRect(0, 0, w(), h());

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      data-testid="hero-canvas-bg"
    />
  );
}
