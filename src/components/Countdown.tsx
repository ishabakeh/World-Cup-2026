import { useEffect, useState } from "react";
import type { Match } from "@/types";
import { countdown } from "@/lib/time";
import { cn } from "./ui";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Live ticking countdown to kickoff. Compact variant for cards. */
export function Countdown({ match, compact = false }: { match: Match; compact?: boolean }) {
  const [c, setC] = useState(() => countdown(match));
  useEffect(() => {
    const id = setInterval(() => setC(countdown(match)), 1000);
    return () => clearInterval(id);
  }, [match.id, match.kickoff]);

  if (c.past) {
    return (
      <span className={cn("chip", compact && "px-2 py-0.5")}>
        {match.status === "finished" ? "Full time" : match.status === "live" ? "Live" : "Kicked off"}
      </span>
    );
  }

  if (compact) {
    const lead =
      c.days > 0 ? `${c.days}d ${pad(c.hours)}h` : c.hours > 0 ? `${c.hours}h ${pad(c.minutes)}m` : `${c.minutes}m ${pad(c.seconds)}s`;
    return <span className="chip px-2 py-0.5 tabular-nums">⏱ {lead}</span>;
  }

  const units: [number, string][] = [
    [c.days, "Days"],
    [c.hours, "Hrs"],
    [c.minutes, "Min"],
    [c.seconds, "Sec"],
  ];
  return (
    <div className="flex gap-2">
      {units.map(([v, label]) => (
        <div key={label} className="glass flex min-w-[58px] flex-col items-center px-2 py-2">
          <span className="h-display text-2xl tabular-nums text-ink">{pad(v)}</span>
          <span className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
