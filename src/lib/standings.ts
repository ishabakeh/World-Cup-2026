import type { Group, Match, StandingRow } from "@/types";

/**
 * Compute a group's standings from finished matches.
 * Before any results exist every row is zeroed; ranking then falls back to the
 * seeded draw order (the order teamIds appear in the group).
 *
 * Tie-breakers applied: points, goal difference, goals for, then seed order.
 */
export function computeStandings(group: Group, matches: Match[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  group.teamIds.forEach((teamId, seed) => {
    rows.set(teamId, {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      rank: seed + 1,
      qualified: false,
    });
  });

  const groupMatches = matches.filter(
    (m) => m.stage === "group" && m.groupId === group.id && m.status === "finished" && m.homeScore != null && m.awayScore != null,
  );

  for (const m of groupMatches) {
    const home = rows.get(m.homeTeamId!);
    const away = rows.get(m.awayTeamId!);
    if (!home || !away) continue;
    const hs = m.homeScore!;
    const as = m.awayScore!;
    home.played++;
    away.played++;
    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;
    if (hs > as) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (hs < as) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  const seedOrder = new Map(group.teamIds.map((id, i) => [id, i]));
  const sorted = [...rows.values()].sort((a, b) => {
    a.goalDiff = a.goalsFor - a.goalsAgainst;
    b.goalDiff = b.goalsFor - b.goalsAgainst;
    return (
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      seedOrder.get(a.teamId)! - seedOrder.get(b.teamId)!
    );
  });

  sorted.forEach((row, i) => {
    row.rank = i + 1;
    row.goalDiff = row.goalsFor - row.goalsAgainst;
    row.qualified = i < 2; // top two advance directly
  });

  return sorted;
}

/** Whether any group has at least one finished match (drives "pending" badges). */
export function tournamentStarted(matches: Match[]): boolean {
  return matches.some((m) => m.status === "finished");
}
