import { useMemo, useState, useEffect } from "react";
import { DateTime } from "luxon";
import { useStore, useTeamMap, useVenueMap, sortedMatches } from "@/store/useStore";
import { isoDate } from "@/lib/time";
import { viewMatch } from "@/lib/matchView";
import { useRoute } from "@/lib/router";
import { FilterBar, EMPTY_FILTERS, type Filters } from "@/components/FilterBar";
import { MatchCard } from "@/components/MatchCard";
import { SectionTitle, Empty } from "@/components/ui";

export function Matches() {
  const data = useStore((s) => s.data)!;
  const tzMode = useStore((s) => s.tzMode);
  const teamMap = useTeamMap();
  const venueMap = useVenueMap();
  const { params } = useRoute();

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  // Seed filters from deep-link query params (e.g. a team or group click).
  useEffect(() => {
    const next = { ...EMPTY_FILTERS };
    const team = params.get("team");
    if (team && teamMap.has(team)) next.q = teamMap.get(team)!.name;
    if (params.get("g")) next.groupId = params.get("g")!;
    if (params.get("v")) next.venueId = params.get("v")!;
    if (params.get("stage")) next.stage = params.get("stage") as Filters["stage"];
    if (params.get("country")) next.country = params.get("country")!;
    setFilters(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString(), data.teams.length]);

  const dateOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const m of sortedMatches(data.matches)) {
      const v = m.venueId ? venueMap.get(m.venueId) : null;
      const iso = isoDate(m, tzMode, v);
      if (!set.has(iso)) set.set(iso, DateTime.fromISO(iso).toFormat("ccc d LLL"));
    }
    return [...set.entries()].map(([value, label]) => ({ value, label }));
  }, [data.matches, tzMode, venueMap]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return sortedMatches(data.matches).filter((m) => {
      const v = m.venueId ? venueMap.get(m.venueId) : null;
      const { home, away } = viewMatch(m, teamMap, venueMap);
      if (filters.stage !== "all" && m.stage !== filters.stage) return false;
      if (filters.groupId !== "all" && m.groupId !== filters.groupId) return false;
      if (filters.venueId !== "all" && m.venueId !== filters.venueId) return false;
      if (filters.country !== "all" && v?.country !== filters.country) return false;
      if (filters.status !== "all" && m.status !== filters.status) return false;
      if (filters.date !== "all" && isoDate(m, tzMode, v) !== filters.date) return false;
      if (q) {
        const hay = [home.label, away.label, home.team?.code, away.team?.code, v?.city, v?.stadium]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data.matches, filters, tzMode, teamMap, venueMap]);

  // Group filtered matches by display day.
  const byDay = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    for (const m of filtered) {
      const v = m.venueId ? venueMap.get(m.venueId) : null;
      const key = isoDate(m, tzMode, v);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return [...groups.entries()];
  }, [filtered, tzMode, venueMap]);

  return (
    <div className="space-y-6">
      <SectionTitle title="Match explorer" subtitle={`${filtered.length} of ${data.matches.length} matches`} />
      <div className="sticky top-16 z-30 -mx-4 border-b border-white/5 bg-pitch-950/80 px-4 py-3 backdrop-blur-lg">
        <FilterBar filters={filters} onChange={setFilters} dates={dateOptions} />
      </div>

      {byDay.length === 0 ? (
        <Empty>
          <p className="text-sm">No matches match these filters.</p>
        </Empty>
      ) : (
        <div className="space-y-8">
          {byDay.map(([day, list]) => (
            <div key={day}>
              <h3 className="mb-3 flex items-center gap-3 text-sm font-semibold text-ink-muted">
                <span className="h-display text-base text-ink">{DateTime.fromISO(day).toFormat("cccc d LLLL")}</span>
                <span className="h-px flex-1 bg-white/5" />
                <span className="text-xs text-ink-faint">{list.length} match{list.length !== 1 ? "es" : ""}</span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
