import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Users, Trophy, MapPin } from "lucide-react";
import { DateTime } from "luxon";
import { useStore, useTeamMap, useVenueMap, sortedMatches } from "@/store/useStore";
import { viewMatch } from "@/lib/matchView";
import { formatDateTime, zoneAbbr, isoDate } from "@/lib/time";
import { downloadICS } from "@/lib/calendar";
import { MatchCard } from "@/components/MatchCard";
import { Countdown } from "@/components/Countdown";
import { StadiumArt } from "@/components/StadiumArt";
import { Button, SectionTitle, StageBadge } from "@/components/ui";
import { hrefFor } from "@/lib/router";

const QUICK = [
  { path: "/matches", label: "Matches", icon: CalendarDays, hint: "All 104 fixtures" },
  { path: "/groups", label: "Groups", icon: Users, hint: "12 groups · standings" },
  { path: "/bracket", label: "Bracket", icon: Trophy, hint: "Road to the final" },
  { path: "/venues", label: "Venues", icon: MapPin, hint: "16 host stadiums" },
];

export function Dashboard() {
  const data = useStore((s) => s.data)!;
  const tzMode = useStore((s) => s.tzMode);
  const openMatch = useStore((s) => s.openMatch);
  const teamMap = useTeamMap();
  const venueMap = useVenueMap();

  const { feature, today, upcoming, playedCount } = useMemo(() => {
    const nowIso = DateTime.utc().toISO()!;
    const all = sortedMatches(data.matches);
    const future = all.filter((m) => m.kickoff >= nowIso);
    const feature = future[0] ?? all[all.length - 1];
    const todayStr = DateTime.local().toFormat("yyyy-LL-dd");
    const today = all.filter((m) => isoDate(m, "local") === todayStr);
    const upcoming = future.slice(0, 6);
    const playedCount = all.filter((m) => m.status === "finished").length;
    return { feature, today, upcoming, playedCount };
  }, [data.matches]);

  const fv = viewMatch(feature, teamMap, venueMap);
  const progress = Math.round((playedCount / data.tournament.totalMatches) * 100);

  return (
    <div className="space-y-10">
      {/* Hero / featured match */}
      <section className="animate-fade-up overflow-hidden rounded-3xl border border-white/10">
        <div className="relative">
          <StadiumArt venue={fv.venue} className="absolute inset-0 h-full w-full opacity-60" />
          <div className="relative bg-gradient-to-br from-pitch-950/90 via-pitch-900/70 to-pitch-900/30 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <StageBadge stage={feature.stage} groupId={feature.groupId} />
              <span className="chip">{feature.status === "finished" ? "Result" : "Next up"}</span>
            </div>

            <div className="mt-5 flex items-center gap-4 sm:gap-8">
              <div className="flex flex-1 flex-col items-center gap-1 text-center">
                <span className="text-5xl sm:text-6xl">{fv.home.flag}</span>
                <span className="text-sm font-semibold text-ink sm:text-base">{fv.home.label}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="h-display text-2xl text-ink-faint sm:text-3xl">vs</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-1 text-center">
                <span className="text-5xl sm:text-6xl">{fv.away.flag}</span>
                <span className="text-sm font-semibold text-ink sm:text-base">{fv.away.label}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <Countdown match={feature} />
              <p className="text-sm text-ink-muted">
                {formatDateTime(feature, tzMode, fv.venue)} {zoneAbbr(feature, tzMode, fv.venue)}
                {fv.venue && ` · ${fv.venue.stadium}, ${fv.venue.city}`}
              </p>
              <div className="flex gap-2">
                <Button variant="gold" onClick={() => openMatch(feature.id)}>
                  Match details <ArrowRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadICS(feature, { home: fv.home.team ?? undefined, away: fv.away.team ?? undefined, venue: fv.venue })}
                >
                  Add to calendar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress + quick nav */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="glass p-5 sm:col-span-1">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">Tournament progress</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="h-display text-3xl text-ink">{playedCount}</span>
            <span className="text-sm text-ink-muted">/ {data.tournament.totalMatches} matches</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-bright" style={{ width: `${Math.max(progress, 2)}%` }} />
          </div>
          <div className="mt-2 text-xs text-ink-faint">
            {DateTime.fromISO(data.tournament.startDate).toFormat("d LLL")} –{" "}
            {DateTime.fromISO(data.tournament.endDate).toFormat("d LLL yyyy")} · {data.tournament.hosts.join(" · ")}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:col-span-2">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <a key={q.path} href={hrefFor(q.path)} className="glass glass-hover card-press flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{q.label}</span>
                  <span className="block text-xs text-ink-muted">{q.hint}</span>
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Today */}
      {today.length > 0 && (
        <section>
          <SectionTitle title="Today's matches" subtitle="In your local time" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {today.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section>
        <SectionTitle
          title="Upcoming matches"
          subtitle="Next on the schedule"
          right={
            <a href={hrefFor("/matches")} className="text-sm text-gold hover:underline">
              View all →
            </a>
          }
        />
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}
