import { DateTime } from "luxon";
import type { Match, Venue } from "@/types";

export type TzMode = "venue" | "local" | "utc";

/** Resolve the IANA zone to render a match in, per the user's toggle. */
export function zoneFor(mode: TzMode, venue?: Venue | null): string {
  if (mode === "utc") return "utc";
  if (mode === "local") return DateTime.local().zoneName ?? "local";
  return venue?.tz ?? "utc";
}

export function dtFor(match: Match, mode: TzMode, venue?: Venue | null): DateTime {
  return DateTime.fromISO(match.kickoff, { zone: "utc" }).setZone(zoneFor(mode, venue));
}

/** 24-hour kickoff time, e.g. "15:00". */
export function formatTime(match: Match, mode: TzMode, venue?: Venue | null): string {
  return dtFor(match, mode, venue).toFormat("HH:mm");
}

/** e.g. "Thu 11 Jun · 15:00" (24h). */
export function formatDateTime(match: Match, mode: TzMode, venue?: Venue | null): string {
  return dtFor(match, mode, venue).toFormat("ccc d LLL · HH:mm");
}

/** e.g. "Thu 11 Jun". */
export function formatDate(match: Match, mode: TzMode, venue?: Venue | null): string {
  return dtFor(match, mode, venue).toFormat("ccc d LLL");
}

/** Short zone abbreviation for the active mode, e.g. "CDT", "UTC". */
export function zoneAbbr(match: Match, mode: TzMode, venue?: Venue | null): string {
  if (mode === "utc") return "UTC";
  return dtFor(match, mode, venue).toFormat("ZZZZ");
}

/** ISO date (yyyy-LL-dd) in the given mode — used for grouping by day. */
export function isoDate(match: Match, mode: TzMode, venue?: Venue | null): string {
  return dtFor(match, mode, venue).toFormat("yyyy-LL-dd");
}

export function nowUtc(): DateTime {
  return DateTime.utc();
}

/** Milliseconds until kickoff (negative if started). */
export function msUntil(match: Match): number {
  return DateTime.fromISO(match.kickoff, { zone: "utc" }).toMillis() - DateTime.utc().toMillis();
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
}

export function countdown(match: Match): Countdown {
  let ms = msUntil(match);
  const past = ms <= 0;
  ms = Math.abs(ms);
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { days, hours, minutes, seconds, past };
}
