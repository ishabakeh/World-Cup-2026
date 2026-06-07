import type { Match, Team, Venue } from "@/types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC timestamp in iCalendar basic format: 20260611T190000Z */
function toICSDate(iso: string): string {
  const d = new Date(iso);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function esc(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

interface CalEntities {
  home?: Team;
  away?: Team;
  venue?: Venue | null;
}

function title(match: Match, { home, away }: CalEntities): string {
  const h = home?.name ?? match.homeLabel ?? "TBD";
  const a = away?.name ?? match.awayLabel ?? "TBD";
  return `${h} vs ${a} — World Cup 2026`;
}

/** Build a single-event .ics string (matches run a default 2 hours). */
export function buildICS(match: Match, ents: CalEntities): string {
  const start = toICSDate(match.kickoff);
  const end = toICSDate(new Date(new Date(match.kickoff).getTime() + 2 * 3600_000).toISOString());
  const loc = ents.venue ? `${ents.venue.stadium}, ${ents.venue.city}, ${ents.venue.country}` : "Venue TBD";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WC26 Explorer//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${match.id}@wc26-explorer`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${esc(title(match, ents))}`,
    `LOCATION:${esc(loc)}`,
    `DESCRIPTION:${esc(`FIFA World Cup 2026 · Match ${match.matchNumber}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

/** Trigger a download of the match's calendar event. */
export function downloadICS(match: Match, ents: CalEntities): void {
  const blob = new Blob([buildICS(match, ents)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wc26-match-${match.matchNumber}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
