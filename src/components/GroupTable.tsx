import { useMemo } from "react";
import type { Group, Match } from "@/types";
import { useStore, useTeamMap } from "@/store/useStore";
import { computeStandings, tournamentStarted } from "@/lib/standings";
import { cn } from "./ui";

/** Standings table for one group, with qualification indicators. */
export function GroupTable({ group, matches }: { group: Group; matches: Match[] }) {
  const teamMap = useTeamMap();
  const openMatch = useStore((s) => s.openMatch);
  const rows = useMemo(() => computeStandings(group, matches), [group, matches]);
  const started = tournamentStarted(matches);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-ink-faint">
            <th className="py-2 pl-3 text-left font-medium">#</th>
            <th className="py-2 text-left font-medium">Team</th>
            <th className="px-1.5 py-2 text-center font-medium" title="Played">P</th>
            <th className="px-1.5 py-2 text-center font-medium" title="Won">W</th>
            <th className="px-1.5 py-2 text-center font-medium" title="Drawn">D</th>
            <th className="px-1.5 py-2 text-center font-medium" title="Lost">L</th>
            <th className="px-1.5 py-2 text-center font-medium" title="Goal difference">GD</th>
            <th className="px-2 py-2 text-center font-medium" title="Points">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const team = teamMap.get(r.teamId);
            return (
              <tr
                key={r.teamId}
                className={cn(
                  "border-t border-white/5 transition-colors hover:bg-white/[0.04]",
                  r.qualified && "bg-win/[0.06]",
                )}
              >
                <td className="relative py-2.5 pl-3 text-ink-muted">
                  {r.qualified && <span className="absolute left-0 top-0 h-full w-[3px] bg-win" />}
                  {r.rank}
                </td>
                <td className="py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="text-lg leading-none">{team?.flag}</span>
                    <span className="font-medium text-ink">{team?.name}</span>
                  </span>
                </td>
                <td className="px-1.5 py-2.5 text-center tabular-nums text-ink-muted">{r.played}</td>
                <td className="px-1.5 py-2.5 text-center tabular-nums text-ink-muted">{r.won}</td>
                <td className="px-1.5 py-2.5 text-center tabular-nums text-ink-muted">{r.drawn}</td>
                <td className="px-1.5 py-2.5 text-center tabular-nums text-ink-muted">{r.lost}</td>
                <td className="px-1.5 py-2.5 text-center tabular-nums text-ink-muted">
                  {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                </td>
                <td className="px-2 py-2.5 text-center font-display font-bold tabular-nums text-ink">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!started && (
        <div className="border-t border-white/5 bg-white/[0.02] px-3 py-2 text-[11px] text-ink-faint">
          Standings are pending — order shown reflects the seeded draw until results are recorded.
        </div>
      )}

      {/* Group fixtures */}
      <div className="divide-y divide-white/5 border-t border-white/10">
        {matches
          .filter((m) => m.groupId === group.id && m.stage === "group")
          .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
          .map((m) => {
            const h = teamMap.get(m.homeTeamId ?? "");
            const a = teamMap.get(m.awayTeamId ?? "");
            return (
              <button
                key={m.id}
                onClick={() => openMatch(m.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs text-ink-muted transition-colors hover:bg-white/[0.04]"
              >
                <span className="flex items-center gap-1.5">
                  {h?.flag} {h?.code}
                </span>
                <span className="text-ink-faint">
                  {m.status === "finished" ? `${m.homeScore}–${m.awayScore}` : "vs"}
                </span>
                <span className="flex items-center gap-1.5">
                  {a?.code} {a?.flag}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
