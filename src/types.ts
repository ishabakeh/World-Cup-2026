// ---------------------------------------------------------------------------
// Data model for the World Cup 2026 Explorer.
// Mirrors the shape produced by scripts/build-seed.mjs and persisted to cache.
// ---------------------------------------------------------------------------

export type Country = "USA" | "Canada" | "Mexico";
export type Confederation = "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";

export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
export type MatchStatus = "scheduled" | "live" | "finished";

export interface Tournament {
  id: string;
  name: string;
  year: number;
  hosts: Country[];
  startDate: string; // ISO date
  endDate: string; // ISO date
  totalMatches: number;
  teamCount: number;
  groupCount: number;
}

export interface Venue {
  id: string;
  stadium: string;
  city: string;
  country: Country;
  capacity: number;
  lat: number;
  lng: number;
  tz: string; // IANA timezone
  accent: string; // hex accent used for venue cards
}

export interface Team {
  id: string;
  name: string;
  code: string; // FIFA 3-letter
  flag: string; // emoji
  confederation: Confederation;
  groupId: string; // "A".."L"
}

export interface Group {
  id: string;
  name: string;
  teamIds: string[];
}

/** Reference to the result of an earlier knockout match. */
export interface Feeder {
  winnerOf?: string;
  loserOf?: string;
}

export interface Match {
  id: string;
  matchNumber: number;
  stage: Stage;
  groupId: string | null;
  venueId: string | null;
  kickoff: string; // UTC ISO instant
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeLabel: string | null; // placeholder when team unknown ("Winner Group A")
  awayLabel: string | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  feeders?: { home: Feeder; away: Feeder } | null;
}

export interface DataSourceMetadata {
  source: string;
  sourceUrls: string[];
  crawledAt: string; // ISO
  version: string; // short content hash
  schemaVersion: number;
  notes: string;
}

export interface TournamentData {
  tournament: Tournament;
  venues: Venue[];
  teams: Team[];
  groups: Group[];
  matches: Match[];
  metadata: DataSourceMetadata;
}

/** Computed, not stored. */
export interface StandingRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  rank: number;
  qualified: boolean; // top 2
}

/** Wraps cache state so the Data Center can report status honestly. */
export type UpdateStatus = "idle" | "checking" | "updating" | "success" | "unchanged" | "error";

export interface CacheMeta {
  lastUpdated: string | null; // when the cache was last written
  lastChecked: string | null; // when an update was last attempted
  status: UpdateStatus;
  message: string | null; // error or status detail
  version: string | null;
}
