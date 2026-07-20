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
// GROUP-STAGE SCHEDULE  [dateET, timeET, home, away, venueId, homeScore, awayScore]
// dateET is the ET calendar date of kickoff (midnight games already rolled to next day).
// Final scores appended where played (group stage complete, crawled June 2026).
// A match with both scores present is emitted as status: "finished".
// ---------------------------------------------------------------------------
const SCHEDULE = [
  ["2026-06-11", "15:00", "Mexico", "South Africa", "azteca", 2, 0],
  ["2026-06-11", "22:00", "South Korea", "Czechia", "akron", 2, 1],
  ["2026-06-12", "15:00", "Canada", "Bosnia and Herzegovina", "bmo", 1, 1],
  ["2026-06-12", "21:00", "United States", "Paraguay", "sofi", 4, 1],
  ["2026-06-13", "15:00", "Qatar", "Switzerland", "levis", 1, 1],
  ["2026-06-13", "18:00", "Brazil", "Morocco", "metlife", 1, 1],
  ["2026-06-13", "21:00", "Haiti", "Scotland", "gillette", 0, 1],
  ["2026-06-14", "00:00", "Australia", "Turkiye", "bcplace", 2, 0],
  ["2026-06-14", "13:00", "Germany", "Curacao", "nrg", 7, 1],
  ["2026-06-14", "19:00", "Ivory Coast", "Ecuador", "linc", 1, 0],
  ["2026-06-14", "16:00", "Netherlands", "Japan", "att", 2, 2],
  ["2026-06-14", "22:00", "Sweden", "Tunisia", "bbva", 5, 1],
  ["2026-06-15", "21:00", "Iran", "New Zealand", "sofi", 2, 2],
  ["2026-06-15", "15:00", "Belgium", "Egypt", "lumen", 1, 1],
  ["2026-06-15", "12:00", "Spain", "Cape Verde", "mercedes", 0, 0],
  ["2026-06-15", "18:00", "Saudi Arabia", "Uruguay", "hardrock", 1, 1],
  ["2026-06-16", "15:00", "France", "Senegal", "metlife", 3, 1],
  ["2026-06-16", "18:00", "Iraq", "Norway", "gillette", 1, 4],
  ["2026-06-16", "21:00", "Argentina", "Algeria", "arrowhead", 3, 0],
  ["2026-06-17", "00:00", "Austria", "Jordan", "levis", 3, 1],
  ["2026-06-17", "13:00", "Portugal", "DR Congo", "nrg", 1, 1],
  ["2026-06-17", "22:00", "Uzbekistan", "Colombia", "azteca", 1, 3],
  ["2026-06-17", "16:00", "England", "Croatia", "att", 4, 2],
  ["2026-06-17", "19:00", "Ghana", "Panama", "bmo", 1, 0],
  ["2026-06-18", "12:00", "Czechia", "South Africa", "mercedes", 1, 1],
  ["2026-06-18", "21:00", "Mexico", "South Korea", "akron", 1, 0],
  ["2026-06-18", "15:00", "Switzerland", "Bosnia and Herzegovina", "sofi", 4, 1],
  ["2026-06-18", "18:00", "Canada", "Qatar", "bcplace", 6, 0],
  ["2026-06-19", "18:00", "Scotland", "Morocco", "gillette", 0, 1],
  ["2026-06-19", "21:00", "Brazil", "Haiti", "linc", 3, 0],
  ["2026-06-19", "15:00", "United States", "Australia", "lumen", 2, 0],
  ["2026-06-20", "00:00", "Turkiye", "Paraguay", "levis", 0, 1],
  ["2026-06-20", "16:00", "Germany", "Ivory Coast", "bmo", 2, 1],
  ["2026-06-20", "20:00", "Ecuador", "Curacao", "arrowhead", 0, 0],
  ["2026-06-20", "13:00", "Netherlands", "Sweden", "nrg", 5, 1],
  ["2026-06-21", "00:00", "Tunisia", "Japan", "bbva", 0, 4],
  ["2026-06-21", "15:00", "Belgium", "Iran", "sofi", 0, 0],
  ["2026-06-21", "21:00", "New Zealand", "Egypt", "bcplace", 1, 3],
  ["2026-06-21", "12:00", "Spain", "Saudi Arabia", "mercedes", 4, 0],
  ["2026-06-21", "18:00", "Uruguay", "Cape Verde", "hardrock", 2, 2],
  ["2026-06-22", "17:00", "France", "Iraq", "linc", 3, 0],
  ["2026-06-22", "20:00", "Norway", "Senegal", "metlife", 3, 2],
  ["2026-06-22", "13:00", "Argentina", "Austria", "att", 2, 0],
  ["2026-06-22", "23:00", "Jordan", "Algeria", "levis", 1, 2],
  ["2026-06-23", "13:00", "Portugal", "Uzbekistan", "nrg", 5, 0],
  ["2026-06-23", "22:00", "Colombia", "DR Congo", "akron", 1, 0],
  ["2026-06-23", "16:00", "England", "Ghana", "gillette", 0, 0],
  ["2026-06-23", "19:00", "Panama", "Croatia", "bmo", 0, 1],
  ["2026-06-24", "21:00", "Czechia", "Mexico", "azteca", 0, 3],
  ["2026-06-24", "21:00", "South Africa", "South Korea", "bbva", 1, 0],
  ["2026-06-24", "15:00", "Switzerland", "Canada", "bcplace", 2, 1],
  ["2026-06-24", "15:00", "Bosnia and Herzegovina", "Qatar", "lumen", 3, 1],
  ["2026-06-24", "18:00", "Scotland", "Brazil", "hardrock", 0, 3],
  ["2026-06-24", "18:00", "Morocco", "Haiti", "mercedes", 4, 2],
  ["2026-06-25", "16:00", "Ecuador", "Germany", "metlife", 2, 1],
  ["2026-06-25", "16:00", "Curacao", "Ivory Coast", "linc", 0, 2],
  ["2026-06-25", "22:00", "Turkiye", "United States", "sofi", 3, 2],
  ["2026-06-25", "22:00", "Paraguay", "Australia", "levis", 0, 0],
  ["2026-06-25", "19:00", "Japan", "Sweden", "att", 1, 1],
  ["2026-06-25", "19:00", "Tunisia", "Netherlands", "arrowhead", 1, 3],
  ["2026-06-26", "23:00", "Egypt", "Iran", "lumen", 1, 1],
  ["2026-06-26", "23:00", "New Zealand", "Belgium", "bcplace", 1, 5],
  ["2026-06-26", "20:00", "Cape Verde", "Saudi Arabia", "nrg", 0, 0],
  ["2026-06-26", "20:00", "Uruguay", "Spain", "akron", 0, 1],
  ["2026-06-26", "15:00", "Norway", "France", "gillette", 1, 4],
  ["2026-06-26", "15:00", "Senegal", "Iraq", "bmo", 5, 0],
  ["2026-06-27", "22:00", "Algeria", "Austria", "arrowhead", 3, 3],
  ["2026-06-27", "22:00", "Jordan", "Argentina", "att", 1, 3],
  ["2026-06-27", "19:30", "Colombia", "Portugal", "hardrock", 0, 0],
  ["2026-06-27", "19:30", "DR Congo", "Uzbekistan", "mercedes", 3, 1],
  ["2026-06-27", "17:00", "Panama", "England", "metlife", 0, 2],
  ["2026-06-27", "17:00", "Croatia", "Ghana", "linc", 2, 1],
];

function etToUtcIso(dateET, timeET) {
  const [y, m, d] = dateET.split("-").map(Number);
  const [hh, mm] = timeET.split(":").map(Number);
  const ms = Date.UTC(y, m - 1, d, hh, mm) + ET_TO_UTC_HOURS * 3600_000;
  return new Date(ms).toISOString();
}

const matches = [];
let n = 1;
for (const [dateET, timeET, home, away, venueId, homeScore, awayScore] of SCHEDULE) {
  const h = teamByName.get(home);
  const a = teamByName.get(away);
  if (!h) throw new Error(`Unknown home team: ${home}`);
  if (!a) throw new Error(`Unknown away team: ${away}`);
  if (h.groupId !== a.groupId) throw new Error(`Cross-group match: ${home} vs ${away}`);
  const played = homeScore != null && awayScore != null;
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
    status: played ? "finished" : "scheduled",
    homeScore: played ? homeScore : null,
    awayScore: played ? awayScore : null,
  });
  n++;
}

// ---------------------------------------------------------------------------
// KNOCKOUT BRACKET
// Round of 32 teams are resolved (group stage complete). Later rounds keep
// feeder placeholders. Match numbers continue 73 (R32) → 104 (Final).
// Feeder adjacency mirrors the official bracket (FIFA / Wikipedia knockout
// stage): a match references the earlier match ids whose winners (or losers)
// it draws from — NOT simply consecutive numbers.
// ---------------------------------------------------------------------------
function ko(
  id,
  stage,
  kickoff,
  venueId,
  { home = null, away = null, feeders = null, homeScore = null, awayScore = null, homePenalties = null, awayPenalties = null } = {},
) {
  const played = homeScore != null && awayScore != null;
  return {
    id, matchNumber: n++, stage, groupId: null, venueId,
    kickoff,
    homeTeamId: home, awayTeamId: away,
    homeLabel: null, awayLabel: null,
    status: played ? "finished" : "scheduled", homeScore, awayScore,
    homePenalties,
    awayPenalties,
    feeders,
  };
}
const tid = (name) => {
  const t = teamByName.get(name);
  if (!t) throw new Error(`Unknown knockout team: ${name}`);
  return t.id;
};
const W = (id) => ({ winnerOf: id });
const L = (id) => ({ loserOf: id });

const knockout = [];

// Round of 32 — matches 73–88.
// [UTC kickoff, venueId, homeName, awayName, homeScore, awayScore, homePenalties, awayPenalties]
const R32 = [
  ["2026-06-28T19:00:00.000Z", "sofi", "South Africa", "Canada", 0, 1], // R32-1  (M73)
  ["2026-06-29T20:30:00.000Z", "gillette", "Germany", "Paraguay", 1, 1, 3, 4], // R32-2  (M74)
  ["2026-06-30T01:00:00.000Z", "bbva", "Netherlands", "Morocco", 1, 1, 2, 3], // R32-3  (M75)
  ["2026-06-29T17:00:00.000Z", "nrg", "Brazil", "Japan", 2, 1],         // R32-4  (M76)
  ["2026-06-30T21:00:00.000Z", "metlife", "France", "Sweden", 3, 0],    // R32-5  (M77)
  ["2026-06-30T17:00:00.000Z", "att", "Ivory Coast", "Norway", 1, 2],   // R32-6  (M78)
  ["2026-07-01T02:00:00.000Z", "azteca", "Mexico", "Ecuador", 2, 0],    // R32-7  (M79; weather delay)
  ["2026-07-01T16:00:00.000Z", "mercedes", "England", "DR Congo", 2, 1], // R32-8  (M80)
  ["2026-07-02T00:00:00.000Z", "levis", "United States", "Bosnia and Herzegovina", 2, 0], // R32-9  (M81)
  ["2026-07-01T20:00:00.000Z", "lumen", "Belgium", "Senegal", 3, 2],    // R32-10 (M82, AET)
  ["2026-07-02T23:00:00.000Z", "bmo", "Portugal", "Croatia", 2, 1],     // R32-11 (M83)
  ["2026-07-02T19:00:00.000Z", "sofi", "Spain", "Austria", 3, 0],       // R32-12 (M84)
  ["2026-07-03T03:00:00.000Z", "bcplace", "Switzerland", "Algeria", 2, 0], // R32-13 (M85)
  ["2026-07-03T22:00:00.000Z", "hardrock", "Argentina", "Cape Verde", 3, 2], // R32-14 (M86, AET)
  ["2026-07-04T01:30:00.000Z", "arrowhead", "Colombia", "Ghana", 1, 0],  // R32-15 (M87)
  ["2026-07-03T18:00:00.000Z", "att", "Australia", "Egypt", 1, 1, 2, 4], // R32-16 (M88)
];
R32.forEach(([kickoff, venueId, home, away, homeScore, awayScore, homePenalties, awayPenalties], i) => {
  knockout.push(ko(`R32-${i + 1}`, "r32", kickoff, venueId, {
    home: tid(home),
    away: tid(away),
    homeScore,
    awayScore,
    homePenalties,
    awayPenalties,
  }));
});

// Round of 16 — matches 89–96. Each draws the winners of two R32 matches.
const R16 = [
  ["2026-07-04T21:00:00.000Z", "linc", ["R32-2", "R32-5"], "Paraguay", "France", 0, 1], // M89
  ["2026-07-04T17:00:00.000Z", "nrg", ["R32-1", "R32-3"], "Canada", "Morocco", 0, 3], // M90
  ["2026-07-05T20:00:00.000Z", "metlife", ["R32-4", "R32-6"], "Brazil", "Norway", 1, 2], // M91
  ["2026-07-06T01:00:00.000Z", "azteca", ["R32-7", "R32-8"], "Mexico", "England", 2, 3], // M92, weather-delayed from 00:00 UTC
  ["2026-07-06T19:00:00.000Z", "att", ["R32-11", "R32-12"], "Portugal", "Spain", 0, 1], // M93
  ["2026-07-07T00:00:00.000Z", "lumen", ["R32-9", "R32-10"], "United States", "Belgium", 1, 4], // M94
  ["2026-07-07T16:00:00.000Z", "mercedes", ["R32-14", "R32-16"], "Argentina", "Egypt", 3, 2], // M95
  ["2026-07-07T20:00:00.000Z", "bcplace", ["R32-13", "R32-15"], "Switzerland", "Colombia", 0, 0, 4, 3], // M96, Switzerland win on penalties
];
R16.forEach(([kickoff, venueId, [h, a], home, away, homeScore, awayScore, homePenalties, awayPenalties], i) => {
  knockout.push(ko(`R16-${i + 1}`, "r16", kickoff, venueId, {
    home: home ? tid(home) : null,
    away: away ? tid(away) : null,
    homeScore,
    awayScore,
    homePenalties,
    awayPenalties,
    feeders: { home: W(h), away: W(a) },
  }));
});

// Quarter-finals — matches 97–100.
const QF = [
  ["2026-07-09T20:00:00.000Z", "gillette", ["R16-1", "R16-2"], "France", "Morocco", 2, 0], // M97
  ["2026-07-10T19:00:00.000Z", "sofi", ["R16-5", "R16-6"], "Spain", "Belgium", 2, 1], // M98
  ["2026-07-11T21:00:00.000Z", "hardrock", ["R16-3", "R16-4"], "Norway", "England", 1, 2], // M99, AET
  ["2026-07-12T01:00:00.000Z", "arrowhead", ["R16-7", "R16-8"], "Argentina", "Switzerland", 3, 1], // M100, AET
];
QF.forEach(([kickoff, venueId, [h, a], home, away, homeScore, awayScore, homePenalties, awayPenalties], i) => {
  knockout.push(ko(`QF-${i + 1}`, "qf", kickoff, venueId, {
    home: home ? tid(home) : null,
    away: away ? tid(away) : null,
    homeScore,
    awayScore,
    homePenalties,
    awayPenalties,
    feeders: { home: W(h), away: W(a) },
  }));
});

// Semi-finals — matches 101–102.
knockout.push(ko("SF-1", "sf", "2026-07-14T19:00:00.000Z", "att", { home: tid("France"), away: tid("Spain"), homeScore: 0, awayScore: 2, feeders: { home: W("QF-1"), away: W("QF-2") } }));
knockout.push(ko("SF-2", "sf", "2026-07-15T19:00:00.000Z", "mercedes", { home: tid("England"), away: tid("Argentina"), homeScore: 1, awayScore: 2, feeders: { home: W("QF-3"), away: W("QF-4") } }));
// Third place — match 103, July 18, Hard Rock Stadium, Miami.
knockout.push(ko("TP", "third", "2026-07-18T21:00:00.000Z", "hardrock", { home: tid("France"), away: tid("England"), homeScore: 4, awayScore: 6, feeders: { home: L("SF-1"), away: L("SF-2") } }));
// Final — match 104, July 19, MetLife Stadium, NY/NJ.
knockout.push(ko("FINAL", "final", "2026-07-19T19:00:00.000Z", "metlife", { home: tid("Spain"), away: tid("Argentina"), homeScore: 1, awayScore: 0, feeders: { home: W("SF-1"), away: W("SF-2") } }));

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
  source: "Wikipedia (2026 FIFA World Cup group articles + knockout stage), cross-checked vs fifa.com standings",
  sourceUrls: [
    "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings",
    "https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf",
    "https://www.fifa.com/en/match-centre/match/17/285023/289287/400021518",
    "https://fdp.fifa.org/assetspublic/ce281/r12527/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12522/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12525/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12531/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12521/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12523/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12524/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12526/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12528/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12529/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12530/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12532/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12533/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12534/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12535/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12536/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12537/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12538/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12539/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12540/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12541/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12542/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12543/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12544/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12545/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12546/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12547/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12548/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12549/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12550/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12551/pdf/FullTimeMatchReport-English.pdf",
    "https://fdp.fifa.org/assetspublic/ce281/r12552/pdf/FullTimeMatchReport-English.pdf",
    "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup",
    "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage",
    "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_round_of_32",
  ],
  crawledAt: CRAWLED_AT,
  version: hash,
  schemaVersion: 1,
  notes:
    "Group stage complete — all 72 results recorded; standings compute from scores. " +
    "Round of 32 resolved to qualified teams with official dates/venues; " +
    "Tournament complete — all 104 matches recorded. " +
    "England finished third; Spain defeated Argentina in the final after extra time. " +
    "Knockout kickoff times are exact UTC instants cross-checked against FIFA-linked match pages.",
};

const outDir = resolve(ROOT, "public/data");
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, "tournament.json");
writeFileSync(outFile, JSON.stringify(payload, null, 2) + "\n");

console.log(`✓ Wrote ${outFile}`);
console.log(`  teams=${teams.length} groups=${groups.length} venues=${VENUES.length} matches=${allMatches.length} version=${hash}`);
