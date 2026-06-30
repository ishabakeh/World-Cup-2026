import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import type { Match } from "@/types";
import { useStore, useTeamMap, useVenueMap } from "@/store/useStore";
import { viewMatch, type Side } from "@/lib/matchView";
import { formatDateTime, zoneAbbr } from "@/lib/time";
import { Countdown } from "./Countdown";
import { StageBadge, cn } from "./ui";

function TeamRow({ side, score, penalties }: { side: Side; score: number | null; penalties?: number | null }) {
  const placeholder = !side.team;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xl leading-none">{side.flag}</span>
      <span className={cn("truncate text-sm font-semibold", placeholder ? "italic text-ink-muted" : "text-ink")}>
        {side.label}
      </span>
      {score != null && (
        <span className="ml-auto h-display text-lg tabular-nums text-ink">
          {score}
          {penalties != null && <span className="ml-1 text-xs text-ink-faint">({penalties})</span>}
        </span>
      )}
    </div>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const tzMode = useStore((s) => s.tzMode);
  const openMatch = useStore((s) => s.openMatch);
  const teamMap = useTeamMap();
  const venueMap = useVenueMap();
  const { home, away, venue } = viewMatch(match, teamMap, venueMap);

  return (
    <motion.button
      layout
      onClick={() => openMatch(match.id)}
      className="glass glass-hover card-press group w-full p-4 text-left"
      whileHover={{ y: -2 }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <StageBadge stage={match.stage} groupId={match.groupId} />
        <Countdown match={match} compact />
      </div>

      <div className="space-y-2">
        <TeamRow side={home} score={match.homeScore} penalties={match.homePenalties} />
        <div className="ml-1 h-px bg-white/5" />
        <TeamRow side={away} score={match.awayScore} penalties={match.awayPenalties} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-ink-muted">
        <span className="tabular-nums">
          {formatDateTime(match, tzMode, venue)} <span className="text-ink-faint">{zoneAbbr(match, tzMode, venue)}</span>
        </span>
        {venue && (
          <span className="flex items-center gap-1 truncate">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{venue.city}</span>
          </span>
        )}
      </div>
    </motion.button>
  );
}
