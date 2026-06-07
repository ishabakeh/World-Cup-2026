import { motion } from "framer-motion";
import { Users, CalendarDays } from "lucide-react";
import type { Match, Venue } from "@/types";
import { StadiumArt } from "./StadiumArt";
import { hrefFor } from "@/lib/router";
import { STAGE_SHORT } from "./ui";

const FLAG: Record<string, string> = { USA: "🇺🇸", Canada: "🇨🇦", Mexico: "🇲🇽" };

export function VenueCard({ venue, matches }: { venue: Venue; matches: Match[] }) {
  const venueMatches = matches.filter((m) => m.venueId === venue.id);
  const stages = [...new Set(venueMatches.map((m) => m.stage))];

  return (
    <motion.a
      href={hrefFor(`/venues?v=${venue.id}`)}
      whileHover={{ y: -3 }}
      className="glass glass-hover card-press group block overflow-hidden"
    >
      <StadiumArt venue={venue} className="h-28 w-full" label={`${FLAG[venue.country]} ${venue.city}`} />
      <div className="p-4">
        <h3 className="h-display text-base text-ink">{venue.stadium}</h3>
        <p className="text-sm text-ink-muted">
          {venue.city}, {venue.country}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span className="chip">
            <Users size={12} /> {venue.capacity.toLocaleString("en-US")}
          </span>
          <span className="chip">
            <CalendarDays size={12} /> {venueMatches.length} matches
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {stages.map((s) => (
            <span key={s} className="chip px-2 py-0.5 text-[10px]">
              {STAGE_SHORT[s]}
            </span>
          ))}
        </div>
      </div>
    </motion.a>
  );
}
