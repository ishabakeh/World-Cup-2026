import { motion } from "framer-motion";
import type { Match, Stage } from "@/types";
import { useStore, useTeamMap, useVenueMap } from "@/store/useStore";
import { viewMatch } from "@/lib/matchView";
import { formatDate } from "@/lib/time";
import { STAGE_LABEL, cn } from "./ui";

const COLUMN_ORDER: Stage[] = ["r32", "r16", "qf", "sf", "final"];

function BracketMatch({ match, index }: { match: Match; index: number }) {
  const openMatch = useStore((s) => s.openMatch);
  const tzMode = useStore((s) => s.tzMode);
  const teamMap = useTeamMap();
  const venueMap = useVenueMap();
  const { home, away, venue } = viewMatch(match, teamMap, venueMap);
  const isFinal = match.stage === "final";

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      onClick={() => openMatch(match.id)}
      className={cn(
        "card-press w-[180px] shrink-0 rounded-xl border p-2.5 text-left transition-colors",
        isFinal
          ? "border-gold/40 bg-gold/10 shadow-glow hover:bg-gold/15"
          : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]",
      )}
    >
      {[home, away].map((s, i) => (
        <div key={i} className={cn("flex items-center gap-2 py-1", i === 0 && "border-b border-white/5")}>
          <span className="text-base leading-none">{s.flag}</span>
          <span className={cn("truncate text-xs", s.team ? "font-semibold text-ink" : "italic text-ink-muted")}>
            {s.label}
          </span>
          {match.status === "finished" && (
            <span className="ml-auto text-xs tabular-nums text-ink">{i === 0 ? match.homeScore : match.awayScore}</span>
          )}
        </div>
      ))}
      <div className="mt-1.5 text-[10px] text-ink-faint">
        {formatDate(match, tzMode, venue)}
        {venue && ` · ${venue.city}`}
      </div>
    </motion.button>
  );
}

export function BracketView({ matches }: { matches: Match[] }) {
  const byStage = (s: Stage) => matches.filter((m) => m.stage === s).sort((a, b) => a.matchNumber - b.matchNumber);
  const third = matches.find((m) => m.stage === "third");

  return (
    <div className="space-y-4">
      <div className="flex gap-5 overflow-x-auto pb-4 [scrollbar-gutter:stable]">
        {COLUMN_ORDER.map((stage) => {
          const col = byStage(stage);
          if (col.length === 0) return null;
          return (
            <div key={stage} className="flex flex-col">
              <h3 className="mb-3 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {STAGE_LABEL[stage]}
                <span className="ml-1.5 text-ink-faint">({col.length})</span>
              </h3>
              <div className="flex h-full flex-col justify-around gap-3">
                {col.map((m, i) => (
                  <BracketMatch key={m.id} match={m} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {third && (
        <div className="max-w-xs">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">Third-place match</h3>
          <BracketMatch match={third} index={0} />
        </div>
      )}
    </div>
  );
}
