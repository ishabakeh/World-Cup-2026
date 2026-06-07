import { clsx, type ClassValue } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Stage } from "@/types";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
type Variant = "solid" | "ghost" | "gold" | "outline";
type Size = "sm" | "md";

const variantCls: Record<Variant, string> = {
  solid: "bg-white/10 hover:bg-white/15 text-ink border border-white/10",
  ghost: "bg-transparent hover:bg-white/8 text-ink-muted hover:text-ink",
  gold: "bg-gold/90 hover:bg-gold text-pitch-950 font-semibold border border-gold/40 shadow-glow",
  outline: "bg-transparent border border-white/15 hover:border-white/30 text-ink",
};
const sizeCls: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export function Button({
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Stage badge
// ---------------------------------------------------------------------------
export const STAGE_LABEL: Record<Stage, string> = {
  group: "Group Stage",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-final",
  sf: "Semi-final",
  third: "Third place",
  final: "Final",
};

export const STAGE_SHORT: Record<Stage, string> = {
  group: "Group",
  r32: "R32",
  r16: "R16",
  qf: "QF",
  sf: "SF",
  third: "3rd",
  final: "Final",
};

export function StageBadge({ stage, groupId }: { stage: Stage; groupId?: string | null }) {
  const isElite = stage === "final" || stage === "third";
  return (
    <span
      className={cn(
        "chip",
        isElite && "border-gold/40 bg-gold/15 text-gold",
      )}
    >
      {stage === "group" && groupId ? `Group ${groupId}` : STAGE_LABEL[stage]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section heading
// ---------------------------------------------------------------------------
export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="h-display text-xl text-ink sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flag — emoji with a graceful monospace fallback on platforms that don't
// render flag emoji (e.g. Windows shows letters; we keep them in a chip).
// ---------------------------------------------------------------------------
export function Flag({ emoji, code, className }: { emoji: string; code?: string; className?: string }) {
  return (
    <span className={cn("inline-block leading-none", className)} title={code} aria-hidden={!!code}>
      {emoji}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-2 py-16 text-center text-ink-muted">
      {children}
    </div>
  );
}
