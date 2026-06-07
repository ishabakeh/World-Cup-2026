import type { Venue } from "@/types";

// A lightweight generated "stadium under lights" graphic used as an image
// placeholder for venues and match detail. Uses the venue accent so each
// stadium feels distinct without shipping (or hotlinking) real photos.
export function StadiumArt({ venue, className, label }: { venue?: Venue | null; className?: string; label?: string }) {
  const accent = venue?.accent ?? "#3a4a7a";
  return (
    <div className={className} style={{ position: "relative", overflow: "hidden" }}>
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id={`sky-${venue?.id ?? "x"}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1020" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.35" />
          </linearGradient>
          <radialGradient id={`glow-${venue?.id ?? "x"}`} cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
            <stop offset="60%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="200" fill={`url(#sky-${venue?.id ?? "x"})`} />
        <rect width="400" height="200" fill={`url(#glow-${venue?.id ?? "x"})`} />
        {/* light beams */}
        {[60, 200, 340].map((x, i) => (
          <polygon key={i} points={`${x},10 ${x - 30},150 ${x + 30},150`} fill="#ffffff" opacity="0.05" />
        ))}
        {/* stadium bowl */}
        <ellipse cx="200" cy="200" rx="190" ry="70" fill="#05070f" opacity="0.9" />
        <ellipse cx="200" cy="196" rx="150" ry="48" fill={accent} opacity="0.18" />
        <ellipse cx="200" cy="196" rx="110" ry="32" fill="#0c5c2e" opacity="0.55" />
        {/* light towers */}
        {[40, 360].map((x, i) => (
          <g key={i}>
            <rect x={x - 1.5} y="70" width="3" height="70" fill="#1b2742" />
            <circle cx={x} cy="66" r="6" fill="#ffd66b" opacity="0.85" />
          </g>
        ))}
      </svg>
      {label && (
        <span className="absolute bottom-2 left-3 text-[11px] font-medium uppercase tracking-wider text-white/70">
          {label}
        </span>
      )}
    </div>
  );
}
