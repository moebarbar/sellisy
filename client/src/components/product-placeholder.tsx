import { Package, Code, FileText, BookOpen, GraduationCap, Palette, Layers } from "lucide-react";

const typeConfig: Record<string, { icon: typeof Package; gradient: string; iconColor: string }> = {
  software: { icon: Code, gradient: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-400" },
  template: { icon: Layers, gradient: "from-purple-500/20 to-pink-500/20", iconColor: "text-purple-400" },
  ebook: { icon: BookOpen, gradient: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-400" },
  course: { icon: GraduationCap, gradient: "from-green-500/20 to-emerald-500/20", iconColor: "text-green-400" },
  graphics: { icon: Palette, gradient: "from-rose-500/20 to-fuchsia-500/20", iconColor: "text-rose-400" },
  digital: { icon: FileText, gradient: "from-indigo-500/20 to-violet-500/20", iconColor: "text-indigo-400" },
};

const defaultConfig = { icon: Package, gradient: "from-slate-500/20 to-zinc-500/20", iconColor: "text-slate-400" };

export function ProductPlaceholder({
  productType,
  title,
  className = "",
}: {
  productType?: string | null;
  title?: string;
  className?: string;
}) {
  const config = typeConfig[productType || ""] || defaultConfig;
  const Icon = config.icon;

  const seed = (title || "").length % 3;
  const rotation = seed === 0 ? "rotate-0" : seed === 1 ? "-rotate-3" : "rotate-3";

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${config.gradient} ${className}`}>
      <div className={`${rotation} transition-transform`}>
        <Icon className={`h-12 w-12 ${config.iconColor} opacity-60`} strokeWidth={1.5} />
      </div>
      {productType && (
        <span className={`mt-2 text-[10px] font-medium uppercase tracking-widest ${config.iconColor} opacity-40`}>
          {productType}
        </span>
      )}
    </div>
  );
}

export function StorefrontProductPlaceholder({
  productType,
  accentColor,
  title,
  className = "",
}: {
  productType?: string | null;
  accentColor?: string;
  title?: string;
  className?: string;
}) {
  const config = typeConfig[productType || ""] || defaultConfig;
  const Icon = config.icon;
  const color = accentColor || "#6366f1";

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center ${className}`}
      style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)` }}
    >
      <Icon className="h-10 w-10 opacity-30" style={{ color }} strokeWidth={1.5} />
      {productType && (
        <span className="mt-2 text-[10px] font-medium uppercase tracking-widest opacity-20" style={{ color }}>
          {productType}
        </span>
      )}
    </div>
  );
}
