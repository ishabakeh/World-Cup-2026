import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, MapPin, X, Navigation, CloudSun, Activity, Info } from "lucide-react";
import { useStore, useTeamMap, useVenueMap } from "@/store/useStore";
import { viewMatch, type Side as MatchSide } from "@/lib/matchView";
import { dtFor, formatDate } from "@/lib/time";
import { downloadICS } from "@/lib/calendar";
import { StadiumArt } from "./StadiumArt";
import { Countdown } from "./Countdown";
import { Button, StageBadge, cn } from "./ui";
import { navigate, hrefFor } from "@/lib/router";

function TeamSide({ side }: { side: MatchSide }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <span className="text-5xl leading-none">{side.flag}</span>
      <span className={cn("text-center text-sm font-semibold", side.team ? "text-ink" : "italic text-ink-muted")}>
        {side.label}
      </span>
      {side.team && <span className="chip">{side.team.confederation}</span>}
    </div>
  );
}

function InfoBlock({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="glass p-4">
      <div className="mb-2 flex items-center gap-2 text-ink">
        {icon}
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <div className="text-sm text-ink-muted">{children}</div>
    </div>
  );
}

export function MatchDetailModal() {
  const id = useStore((s) => s.selectedMatchId);
  const closeMatch = useStore((s) => s.closeMatch);
  const data = useStore((s) => s.data);
  const teamMap = useTeamMap();
  const venueMap = useVenueMap();

  const match = data?.matches.find((m) => m.id === id) ?? null;
  const open = !!match;
  const view = match ? viewMatch(match, teamMap, venueMap) : null;
  const venue = view?.venue ?? null;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && closeMatch()}>
      <AnimatePresence>
        {open && match && view && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(640px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/10 bg-pitch-900 shadow-glass"
                initial={{ opacity: 0, scale: 0.96, y: "-46%", x: "-50%" }}
                animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
                exit={{ opacity: 0, scale: 0.96, y: "-46%", x: "-50%" }}
                transition={{ type: "spring", damping: 26, stiffness: 280 }}
              >
                {/* Hero */}
                <div className="relative">
                  <StadiumArt venue={venue} className="h-40 w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-pitch-900 via-pitch-900/40 to-transparent" />
                  <Dialog.Close asChild>
                    <button
                      className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white/80 hover:bg-black/60 hover:text-white"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                  <div className="absolute left-4 top-3">
                    <StageBadge stage={match.stage} groupId={match.groupId} />
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <Dialog.Title className="sr-only">
                    {view.home.label} versus {view.away.label}
                  </Dialog.Title>

                  {/* Matchup */}
                  <div className="flex items-center gap-3">
                    <TeamSide side={view.home} />
                    <div className="flex flex-col items-center">
                      {match.status === "finished" ? (
                        <span className="h-display text-3xl tabular-nums">
                          {match.homeScore}–{match.awayScore}
                        </span>
                      ) : (
                        <span className="h-display text-2xl text-ink-faint">vs</span>
                      )}
                      <span className="mt-1 text-[11px] uppercase tracking-wider text-ink-faint">
                        Match {match.matchNumber}
                      </span>
                    </div>
                    <TeamSide side={view.away} />
                  </div>

                  {/* Countdown */}
                  <div className="flex flex-col items-center gap-2">
                    <Countdown match={match} />
                  </div>

                  {/* Kickoff times across zones */}
                  <div className="glass grid grid-cols-3 divide-x divide-white/5 p-0 text-center">
                    {([
                      ["Venue", "venue"],
                      ["My time", "local"],
                      ["UTC", "utc"],
                    ] as const).map(([label, mode]) => (
                      <div key={mode} className="px-2 py-3">
                        <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
                        <div className="h-display text-lg tabular-nums text-ink">
                          {dtFor(match, mode, venue).toFormat("HH:mm")}
                        </div>
                        <div className="text-[11px] text-ink-muted">{formatDate(match, mode, venue)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="gold"
                      onClick={() => downloadICS(match, { home: view.home.team ?? undefined, away: view.away.team ?? undefined, venue })}
                    >
                      <CalendarPlus size={16} /> Add to calendar
                    </Button>
                    {venue && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button variant="outline">
                          <Navigation size={16} /> Open in maps
                        </Button>
                      </a>
                    )}
                    {match.groupId && (
                      <Button variant="ghost" onClick={() => { closeMatch(); navigate(`/groups?g=${match.groupId}`); }}>
                        View Group {match.groupId}
                      </Button>
                    )}
                  </div>

                  {/* Venue */}
                  {venue && (
                    <InfoBlock icon={<MapPin size={16} className="text-gold" />} title="Venue">
                      <a className="font-medium text-ink hover:text-gold" href={hrefFor(`/venues?v=${venue.id}`)}>
                        {venue.stadium}
                      </a>
                      <div>
                        {venue.city}, {venue.country} · Capacity {venue.capacity.toLocaleString("en-US")}
                      </div>
                      <div className="mt-1 text-xs text-ink-faint">
                        {venue.lat.toFixed(3)}, {venue.lng.toFixed(3)} · {venue.tz}
                      </div>
                    </InfoBlock>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoBlock icon={<Activity size={16} className="text-gold" />} title="Team form">
                      Form & head-to-head will appear here once results are recorded.
                    </InfoBlock>
                    <InfoBlock icon={<CloudSun size={16} className="text-gold" />} title="Travel & weather">
                      Matchday forecast and travel tips for {venue?.city ?? "the host city"} — placeholder.
                    </InfoBlock>
                  </div>

                  {/* Source */}
                  {data && (
                    <div className="flex items-start gap-2 text-xs text-ink-faint">
                      <Info size={13} className="mt-0.5 shrink-0" />
                      <span>
                        Source: {data.metadata.source}. Data version {data.metadata.version}.
                        {match.stage !== "group" && " Knockout matchup is a placeholder until results decide it."}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
