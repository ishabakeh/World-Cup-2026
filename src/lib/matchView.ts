import type { Match, Team, Venue } from "@/types";

export interface Side {
  team: Team | null;
  label: string; // resolved display label when no team yet
  flag: string; // emoji or neutral marker
}

const STAGE_SHORT_BY_PREFIX: Record<string, string> = {
  R32: "R32",
  R16: "R16",
  QF: "QF",
  SF: "SF",
  TP: "3rd place",
  FINAL: "Final",
};

function feederLabel(f?: { winnerOf?: string; loserOf?: string }): string {
  if (!f) return "TBD";
  const ref = f.winnerOf ?? f.loserOf ?? "";
  const prefix = ref.split("-")[0];
  const human = STAGE_SHORT_BY_PREFIX[prefix] ?? prefix;
  const num = ref.includes("-") ? ` ${ref.split("-")[1]}` : "";
  return `${f.loserOf ? "Loser" : "Winner"} ${human}${num}`;
}

export function resolveSide(
  teamId: string | null,
  label: string | null,
  feeder: { winnerOf?: string; loserOf?: string } | undefined,
  teamMap: Map<string, Team>,
): Side {
  if (teamId && teamMap.has(teamId)) {
    const team = teamMap.get(teamId)!;
    return { team, label: team.name, flag: team.flag };
  }
  if (label) return { team: null, label, flag: "🏳️" };
  if (feeder) return { team: null, label: feederLabel(feeder), flag: "🏳️" };
  return { team: null, label: "TBD", flag: "🏳️" };
}

export interface MatchView {
  home: Side;
  away: Side;
  venue: Venue | null;
}

export function viewMatch(match: Match, teamMap: Map<string, Team>, venueMap: Map<string, Venue>): MatchView {
  return {
    home: resolveSide(match.homeTeamId, match.homeLabel, match.feeders?.home, teamMap),
    away: resolveSide(match.awayTeamId, match.awayLabel, match.feeders?.away, teamMap),
    venue: match.venueId ? venueMap.get(match.venueId) ?? null : null,
  };
}
