// Builds public/data/tournament.json from the crawled source tables below.
// Run with: npm run build:seed
//
// Kickoff times were crawled in US Eastern (ET). In June the US observes EDT
// (UTC-4), so the true UTC instant = ET wall-clock + 4h. We store a single UTC
// ISO instant per match; the UI converts it to venue-local / user-local / UTC
// at runtime using each venue's IANA timezone. This keeps the timezone toggle
// exact and DST-safe regardless of where the viewer sits.

import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Set this when re-crawling so DataCenter shows when the data was pulled.
// Passed in via env to keep the file output deterministic across reruns.
const CRAWLED_AT = process.env.CRAWLED_AT || "2026-06-07T00:00:00.000Z";
const ET_TO_UTC_HOURS = 4; // EDT in June

// ---------------------------------------------------------------------------
// VENUES
// ---------------------------------------------------------------------------
const VENUES = [
  { id: "azteca", stadium: "Estadio Azteca", city: "Mexico City", country: "Mexico", capacity: 83000, lat: 19.3029, lng: -99.1505, tz: "America/Mexico_City", accent: "#0b6e4f" },
  { id: "akron", stadium: "Estadio Akron", city: "Guadalajara", country: "Mexico", capacity: 48000, lat: 20.6817, lng: -103.4625, tz: "America/Mexico_City", accent: "#c8102e" },
  { id: "bbva", stadium: "Estadio BBVA", city: "Monterrey", country: "Mexico", capacity: 53500, lat: 25.6692, lng: -100.2444, tz: "America/Monterrey", accent: "#1d3c87" },
  { id: "bmo", stadium: "BMO Field", city: "Toronto", country: "Canada", capacity: 45000, lat: 43.6332, lng: -79.4185, tz: "America/Toronto", accent: "#c8102e" },
  { id: "bcplace", stadium: "BC Place", city: "Vancouver", country: "Canada", capacity: 54000, lat: 49.2768, lng: -123.1119, tz: "America/Vancouver", accent: "#0a7abf" },
  { id: "metlife", stadium: "MetLife Stadium", city: "New York / New Jersey", country: "USA", capacity: 82500, lat: 40.8128, lng: -74.0742, tz: "America/New_York", accent: "#1f6feb" },
  { id: "gillette", stadium: "Gillette Stadium", city: "Boston", country: "USA", capacity: 65000, lat: 42.0909, lng: -71.2643, tz: "America/New_York", accent: "#13294b" },
  { id: "linc", stadium: "Lincoln Financial Field", city: "Philadelphia", country: "USA", capacity: 69000, lat: 39.9008, lng: -75.1675, tz: "America/New_York", accent: "#004c54" },
  { id: "hardrock", stadium: "Hard Rock Stadium", city: "Miami", country: "USA", capacity: 65000, lat: 25.958, lng: -80.2389, tz: "America/New_York", accent: "#f58220" },
  { id: "mercedes", stadium: "Mercedes-Benz Stadium", city: "Atlanta", country: "USA", capacity: 75000, lat: 33.7553, lng: -84.4006, tz: "America/New_York", accent: "#a71930" },
  { id: "arrowhead", stadium: "Arrowhead Stadium", city: "Kansas City", country: "USA", capacity: 73000, lat: 39.0489, lng: -94.4839, tz: "America/Chicago", accent: "#e31837" },
  { id: "att", stadium: "AT&T Stadium", city: "Dallas", country: "USA", capacity: 94000, lat: 32.7473, lng: -97.0945, tz: "America/Chicago", accent: "#0b2265" },
  { id: "nrg", stadium: "NRG Stadium", city: "Houston", country: "USA", capacity: 72000, lat: 29.6847, lng: -95.4107, tz: "America/Chicago", accent: "#03202f" },
  { id: "lumen", stadium: "Lumen Field", city: "Seattle", country: "USA", capacity: 69000, lat: 47.5952, lng: -122.3316, tz: "America/Los_Angeles", accent: "#69be28" },
  { id: "levis", stadium: "Levi's Stadium", city: "San Francisco Bay Area", country: "USA", capacity: 71000, lat: 37.403, lng: -121.9698, tz: "America/Los_Angeles", accent: "#aa0000" },
  { id: "sofi", stadium: "SoFi Stadium", city: "Los Angeles", country: "USA", capacity: 70000, lat: 33.9535, lng: -118.3392, tz: "America/Los_Angeles", accent: "#7c3aed" },
];

// ---------------------------------------------------------------------------
// TEAMS & GROUPS  (final draw, with March 2026 playoff slots resolved)
// ---------------------------------------------------------------------------
const GROUPS = {
  A: [["Mexico", "MEX", "🇲🇽", "CONCACAF"], ["South Africa", "RSA", "🇿🇦", "CAF"], ["South Korea", "KOR", "🇰🇷", "AFC"], ["Czechia", "CZE", "🇨🇿", "UEFA"]],
  B: [["Canada", "CAN", "🇨🇦", "CONCACAF"], ["Bosnia and Herzegovina", "BIH", "🇧🇦", "UEFA"], ["Qatar", "QAT", "🇶🇦", "AFC"], ["Switzerland", "SUI", "🇨🇭", "UEFA"]],
  C: [["Brazil", "BRA", "🇧🇷", "CONMEBOL"], ["Morocco", "MAR", "🇲🇦", "CAF"], ["Haiti", "HAI", "🇭🇹", "CONCACAF"], ["Scotland", "SCO", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "UEFA"]],
  D: [["United States", "USA", "🇺🇸", "CONCACAF"], ["Paraguay", "PAR", "🇵🇾", "CONMEBOL"], ["Australia", "AUS", "🇦🇺", "AFC"], ["Turkiye", "TUR", "🇹🇷", "UEFA"]],
  E: [["Germany", "GER", "🇩🇪", "UEFA"], ["Curacao", "CUW", "🇨🇼", "CONCACAF"], ["Ivory Coast", "CIV", "🇨🇮", "CAF"], ["Ecuador", "ECU", "🇪🇨", "CONMEBOL"]],
  F: [["Netherlands", "NED", "🇳🇱", "UEFA"], ["Japan", "JPN", "🇯🇵", "AFC"], ["Sweden", "SWE", "🇸🇪", "UEFA"], ["Tunisia", "TUN", "🇹🇳", "CAF"]],
  G: [["Belgium", "BEL", "🇧🇪", "UEFA"], ["Egypt", "EGY", "🇪🇬", "CAF"], ["Iran", "IRN", "🇮🇷", "AFC"], ["New Zealand", "NZL", "🇳🇿", "OFC"]],
  H: [["Spain", "ESP", "🇪🇸", "UEFA"], ["Cape Verde", "CPV", "🇨🇻", "CAF"], ["Saudi Arabia", "KSA", "🇸🇦", "AFC"], ["Uruguay", "URU", "🇺🇾", "CONMEBOL"]],
  I: [["France", "FRA", "🇫🇷", "UEFA"], ["Senegal", "SEN", "🇸🇳", "CAF"], ["Iraq", "IRQ", "🇮🇶", "AFC"], ["Norway", "NOR", "🇳🇴", "UEFA"]],
  J: [["Argentina", "ARG", "🇦🇷", "CONMEBOL"], ["Algeria", "ALG", "🇩🇿", "CAF"], ["Austria", "AUT", "🇦🇹", "UEFA"], ["Jordan", "JOR", "🇯🇴", "AFC"]],
  K: [["Portugal", "POR", "🇵🇹", "UEFA"], ["DR Congo", "COD", "🇨🇩", "CAF"], ["Uzbekistan", "UZB", "🇺🇿", "AFC"], ["Colombia", "COL", "🇨🇴", "CONMEBOL"]],
  L: [["England", "ENG", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "UEFA"], ["Croatia", "CRO", "🇭🇷", "UEFA"], ["Ghana", "GHA", "🇬🇭", "CAF"], ["Panama", "PAN", "🇵🇦", "CONCACAF"]],
};

// name -> {id, groupId} lookup
const teams = [];
const teamByName = new Map();
for (const [g, list] of Object.entries(GROUPS)) {
  for (const [name, code, flag, conf] of list) {
    const id = code.toLowerCase();
    const t = { id, name, code, flag, confederation: conf, groupId: g };
    teams.push(t);
    teamByName.set(name, t);
  }
}

// ---------------------------------------------------------------------------
// GROUP-STAGE SCHEDULE  [dateET, timeET, home, away, venueId]
// dateET is the ET calendar date of kickoff (midnight games already rolled to next day).
// ---------------------------------------------------------------------------
const SCHEDULE = [
  ["2026-06-11", "15:00", "Mexico", "South Africa", "azteca"],
  ["2026-06-11", "22:00", "South Korea", "Czechia", "akron"],
  ["2026-06-12", "15:00", "Canada", "Bosnia and Herzegovina", "bmo"],
  ["2026-06-12", "21:00", "United States", "Paraguay", "sofi"],
  ["2026-06-13", "15:00", "Qatar", "Switzerland", "levis"],
  ["2026-06-13", "18:00", "Brazil", "Morocco", "metlife"],
  ["2026-06-13", "21:00", "Haiti", "Scotland", "gillette"],
  ["2026-06-14", "00:00", "Australia", "Turkiye", "bcplace"],
  ["2026-06-14", "13:00", "Germany", "Curacao", "nrg"],
  ["2026-06-14", "19:00", "Ivory Coast", "Ecuador", "linc"],
  ["2026-06-14", "16:00", "Netherlands", "Japan", "att"],
  ["2026-06-14", "22:00", "Sweden", "Tunisia", "bbva"],
  ["2026-06-15", "21:00", "Iran", "New Zealand", "sofi"],
  ["2026-06-15", "15:00", "Belgium", "Egypt", "lumen"],
  ["2026-06-15", "12:00", "Spain", "Cape Verde", "mercedes"],
  ["2026-06-15", "18:00", "Saudi Arabia", "Uruguay", "hardrock"],
  ["2026-06-16", "15:00", "France", "Senegal", "metlife"],
  ["2026-06-16", "18:00", "Iraq", "Norway", "gillette"],
  ["2026-06-16", "21:00", "Argentina", "Algeria", "arrowhead"],
  ["2026-06-17", "00:00", "Austria", "Jordan", "levis"],
  ["2026-06-17", "13:00", "Portugal", "DR Congo", "nrg"],
  ["2026-06-17", "22:00", "Uzbekistan", "Colombia", "azteca"],
  ["2026-06-17", "16:00", "England", "Croatia", "att"],
  ["2026-06-17", "19:00", "Ghana", "Panama", "bmo"],
  ["2026-06-18", "12:00", "Czechia", "South Africa", "mercedes"],
  ["2026-06-18", "21:00", "Mexico", "South Korea", "akron"],
  ["2026-06-18", "15:00", "Switzerland", "Bosnia and Herzegovina", "sofi"],
  ["2026-06-18", "18:00", "Canada", "Qatar", "bcplace"],
  ["2026-06-19", "18:00", "Scotland", "Morocco", "gillette"],
  ["2026-06-19", "21:00", "Brazil", "Haiti", "linc"],
  ["2026-06-19", "15:00", "United States", "Australia", "lumen"],
  ["2026-06-20", "00:00", "Turkiye", "Paraguay", "levis"],
  ["2026-06-20", "16:00", "Germany", "Ivory Coast", "bmo"],
  ["2026-06-20", "20:00", "Ecuador", "Curacao", "arrowhead"],
  ["2026-06-20", "13:00", "Netherlands", "Sweden", "nrg"],
  ["2026-06-21", "00:00", "Tunisia", "Japan", "bbva"],
  ["2026-06-21", "15:00", "Belgium", "Iran", "sofi"],
  ["2026-06-21", "21:00", "New Zealand", "Egypt", "bcplace"],
  ["2026-06-21", "12:00", "Spain", "Saudi Arabia", "mercedes"],
  ["2026-06-21", "18:00", "Uruguay", "Cape Verde", "hardrock"],
  ["2026-06-22", "17:00", "France", "Iraq", "linc"],
  ["2026-06-22", "20:00", "Norway", "Senegal", "metlife"],
  ["2026-06-22", "13:00", "Argentina", "Austria", "att"],
  ["2026-06-22", "23:00", "Jordan", "Algeria", "levis"],
  ["2026-06-23", "13:00", "Portugal", "Uzbekistan", "nrg"],
  ["2026-06-23", "22:00", "Colombia", "DR Congo", "akron"],
  ["2026-06-23", "16:00", "England", "Ghana", "gillette"],
  ["2026-06-23", "19:00", "Panama", "Croatia", "bmo"],
  ["2026-06-24", "21:00", "Czechia", "Mexico", "azteca"],
  ["2026-06-24", "21:00", "South Africa", "South Korea", "bbva"],
  ["2026-06-24", "15:00", "Switzerland", "Canada", "bcplace"],
  ["2026-06-24", "15:00", "Bosnia and Herzegovina", "Qatar", "lumen"],
  ["2026-06-24", "18:00", "Scotland", "Brazil", "hardrock"],
  ["2026-06-24", "18:00", "Morocco", "Haiti", "mercedes"],
  ["2026-06-25", "16:00", "Ecuador", "Germany", "metlife"],
  ["2026-06-25", "16:00", "Curacao", "Ivory Coast", "linc"],
  ["2026-06-25", "22:00", "Turkiye", "United States", "sofi"],
  ["2026-06-25", "22:00", "Paraguay", "Australia", "levis"],
  ["2026-06-25", "19:00", "Japan", "Sweden", "att"],
  ["2026-06-25", "19:00", "Tunisia", "Netherlands", "arrowhead"],
  ["2026-06-26", "23:00", "Egypt", "Iran", "lumen"],
  ["2026-06-26", "23:00", "New Zealand", "Belgium", "bcplace"],
  ["2026-06-26", "20:00", "Cape Verde", "Saudi Arabia", "nrg"],
  ["2026-06-26", "20:00", "Uruguay", "Spain", "akron"],
  ["2026-06-26", "15:00", "Norway", "France", "gillette"],
  ["2026-06-26", "15:00", "Senegal", "Iraq", "bmo"],
  ["2026-06-27", "22:00", "Algeria", "Austria", "arrowhead"],
  ["2026-06-27", "22:00", "Jordan", "Argentina", "att"],
  ["2026-06-27", "19:30", "Colombia", "Portugal", "hardrock"],
  ["2026-06-27", "19:30", "DR Congo", "Uzbekistan", "mercedes"],
  ["2026-06-27", "17:00", "Panama", "England", "metlife"],
  ["2026-06-27", "17:00", "Croatia", "Ghana", "linc"],
];

function etToUtcIso(dateET, timeET) {
  const [y, m, d] = dateET.split("-").map(Number);
  const [hh, mm] = timeET.split(":").map(Number);
  const ms = Date.UTC(y, m - 1, d, hh, mm) + ET_TO_UTC_HOURS * 3600_000;
  return new Date(ms).toISOString();
}

// ---------------------------------------------------------------------------
// RESULTS — final scores of completed group-stage matches.
// Key: "Home|Away" exactly as written in SCHEDULE. Value: [homeScore, awayScore].
// Add a line here as each match finishes; the generator marks it "finished".
// ---------------------------------------------------------------------------
const RESULTS = {
  "Mexico|South Africa": [2, 0],
  "South Korea|Czechia": [2, 1],
  "Canada|Bosnia and Herzegovina": [1, 1],
  "United States|Paraguay": [4, 1],
  "Qatar|Switzerland": [1, 1],
  "Brazil|Morocco": [1, 1],
  "Haiti|Scotland": [0, 1],
  "Australia|Turkiye": [2, 0],
  "Germany|Curacao": [7, 1],
  "Ivory Coast|Ecuador": [1, 0],
  "Sweden|Tunisia": [5, 1],
  "Netherlands|Japan": [2, 2],
  "Belgium|Egypt": [0, 1],
  "Spain|Cape Verde": [0, 0],
  "France|Senegal": [3, 1],
  "Norway|Iraq": [4, 1],
  "Argentina|Algeria": [3, 0],
  "Austria|Jordan": [3, 1],
  "Portugal|DR Congo": [1, 1],
  "Uzbekistan|Colombia": [1, 3],
  "England|Croatia": [4, 2],
  "Ghana|Panama": [1, 0],
  "Czechia|South Africa": [1, 1],
  "Switzerland|Bosnia and Herzegovina": [4, 1],
  "Canada|Qatar": [6, 0],
  "Mexico|South Korea": [1, 0],
};

const matches = [];
let n = 1;
for (const [dateET, timeET, home, away, venueId] of SCHEDULE) {
  const h = teamByName.get(home);
  const a = teamByName.get(away);
  if (!h) throw new Error(`Unknown home team: ${home}`);
  if (!a) throw new Error(`Unknown away team: ${away}`);
  if (h.groupId !== a.groupId) throw new Error(`Cross-group match: ${home} vs ${away}`);
  const result = RESULTS[`${home}|${away}`] ?? null;
  matches.push({
    id: `M${String(n).padStart(2, "0")}`,
    matchNumber: n,
    stage: "group",
    groupId: h.groupId,
    venueId,
    kickoff: etToUtcIso(dateET, timeET),
    homeTeamId: h.id,
    awayTeamId: a.id,
    homeLabel: null,
    awayLabel: null,
    status: result ? "finished" : "scheduled",
    homeScore: result ? result[0] : null,
    awayScore: result ? result[1] : null,
  });
  n++;
}

// ---------------------------------------------------------------------------
// KNOCKOUT BRACKET  (structural placeholders; exact pairings/venues per update.md)
// ---------------------------------------------------------------------------
function ko(id, stage, kickoff, venueId, homeLabel, awayLabel) {
  return {
    id, matchNumber: n++, stage, groupId: null, venueId,
    kickoff, homeTeamId: null, awayTeamId: null,
    homeLabel, awayLabel, status: "scheduled", homeScore: null, awayScore: null,
    feeders: null,
  };
}
function feeders(match, home, away) {
  match.feeders = { home, away };
  return match;
}

const knockout = [];
// Round of 32 — 16 matches, June 28 – July 3. Venues TBD until update.
const r32Labels = [
  ["1A", "3rd (C/E/F/H)"], ["1C", "3rd (D/E/I/J/L)"],
  ["1E", "3rd (A/B/F/I)"], ["2A", "2B"],
  ["1F", "2C"], ["1I", "2D"],
  ["1B", "3rd (E/H/I/J/K)"], ["1D", "3rd (B/E/F/I/J)"],
  ["1G", "3rd (A/E/H/I/J)"], ["2E", "2F"],
  ["1H", "2J"], ["1K", "2L"],
  ["1J", "3rd (C/D/F/G/H)"], ["1L", "3rd (A/B/C/D/G)"],
  ["2G", "2H"], ["2I", "2K"],
];
const r32Dates = ["2026-06-28","2026-06-29","2026-06-29","2026-06-30","2026-06-30","2026-07-01","2026-07-01","2026-07-02","2026-06-28","2026-06-29","2026-06-30","2026-07-01","2026-07-02","2026-07-02","2026-07-03","2026-07-03"];
for (let i = 0; i < 16; i++) {
  knockout.push(ko(`R32-${i + 1}`, "r32", etToUtcIso(r32Dates[i], "16:00"), null, r32Labels[i][0], r32Labels[i][1]));
}
// Round of 16 — 8 matches, July 4–7. Feeders: winners of consecutive R32 pairs.
const r16Dates = ["2026-07-04","2026-07-04","2026-07-05","2026-07-05","2026-07-06","2026-07-06","2026-07-07","2026-07-07"];
for (let i = 0; i < 8; i++) {
  const m = ko(`R16-${i + 1}`, "r16", etToUtcIso(r16Dates[i], "16:00"), null, null, null);
  feeders(m, { winnerOf: `R32-${2 * i + 1}` }, { winnerOf: `R32-${2 * i + 2}` });
  knockout.push(m);
}
// Quarter-finals — 4 matches, July 9–11.
const qfDates = ["2026-07-09","2026-07-10","2026-07-11","2026-07-11"];
for (let i = 0; i < 4; i++) {
  const m = ko(`QF-${i + 1}`, "qf", etToUtcIso(qfDates[i], "16:00"), null, null, null);
  feeders(m, { winnerOf: `R16-${2 * i + 1}` }, { winnerOf: `R16-${2 * i + 2}` });
  knockout.push(m);
}
// Semi-finals — 2 matches, July 14–15.
const sf1 = feeders(ko("SF-1", "sf", etToUtcIso("2026-07-14", "15:00"), null, null, null), { winnerOf: "QF-1" }, { winnerOf: "QF-2" });
const sf2 = feeders(ko("SF-2", "sf", etToUtcIso("2026-07-15", "15:00"), null, null, null), { winnerOf: "QF-3" }, { winnerOf: "QF-4" });
knockout.push(sf1, sf2);
// Third place — July 18, Hard Rock Stadium, Miami, 17:00 ET.
knockout.push(feeders(ko("TP", "third", etToUtcIso("2026-07-18", "17:00"), "hardrock", null, null), { loserOf: "SF-1" }, { loserOf: "SF-2" }));
// Final — July 19, MetLife Stadium, NY/NJ, 15:00 ET.
knockout.push(feeders(ko("FINAL", "final", etToUtcIso("2026-07-19", "15:00"), "metlife", null, null), { winnerOf: "SF-1" }, { winnerOf: "SF-2" }));

const allMatches = [...matches, ...knockout];

// ---------------------------------------------------------------------------
// ASSEMBLE + METADATA
// ---------------------------------------------------------------------------
const groups = Object.entries(GROUPS).map(([id, list]) => ({
  id,
  name: `Group ${id}`,
  teamIds: list.map(([, code]) => code.toLowerCase()),
}));

const payload = {
  tournament: {
    id: "fwc-2026",
    name: "FIFA World Cup 2026",
    year: 2026,
    hosts: ["USA", "Canada", "Mexico"],
    startDate: "2026-06-11",
    endDate: "2026-07-19",
    totalMatches: 104,
    teamCount: 48,
    groupCount: 12,
  },
  venues: VENUES,
  teams,
  groups,
  matches: allMatches,
};

// Stable hash over the data (excluding the volatile metadata block).
const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 12);

payload.metadata = {
  source: "Wikipedia (2026 FIFA World Cup, draw) + NBC Sports & Sky Sports schedule",
  sourceUrls: [
    "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup",
    "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_draw",
    "https://www.nbcsports.com/soccer/news/2026-world-cup-schedule-confirmed-dates-times-stadiums-full-details",
  ],
  crawledAt: CRAWLED_AT,
  version: hash,
  schemaVersion: 1,
  notes:
    "Group stage is final (dates, kickoff times in venue-local via UTC, venues). " +
    "Knockout matchups are structural placeholders until results are known.",
};

const outDir = resolve(ROOT, "public/data");
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, "tournament.json");
writeFileSync(outFile, JSON.stringify(payload, null, 2) + "\n");

console.log(`✓ Wrote ${outFile}`);
console.log(`  teams=${teams.length} groups=${groups.length} venues=${VENUES.length} matches=${allMatches.length} version=${hash}`);
