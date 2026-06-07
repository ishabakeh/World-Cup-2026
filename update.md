# Data Update Playbook — World Cup 2026 Explorer

> **Purpose.** This file is the durable, self-contained instruction set for
> re-crawling the latest FIFA World Cup 2026 data and regenerating the app's
> dataset. It is written so that **any future session — even an AI assistant with
> no prior context about how this app was built — can read this file and refresh
> the data correctly.**
>
> If you are an AI assistant and the user says *"update the World Cup data"*,
> follow this document top to bottom.

---

## 0. TL;DR for a returning session

1. Crawl the sources in **§3** with `WebFetch`/`WebSearch`.
2. Transcribe the results into the data tables inside
   [`scripts/build-seed.mjs`](scripts/build-seed.mjs) (venues, groups, schedule, knockout).
3. Run `CRAWLED_AT="<now ISO>" npm run build:seed` to regenerate
   `public/data/tournament.json` (this recomputes the content hash automatically).
4. Run `npm run build` to confirm it still compiles.
5. The user presses **Data → Update data** in the app (or reloads after clearing
   cache) to pick up the new version. The version hash changing is what triggers
   the cache to refresh.

Nothing else in `src/` needs to change for a data refresh. The UI reads entirely
from the generated JSON.

---

## 1. How the data flows

```
crawl (you)  ──►  edit tables in scripts/build-seed.mjs  ──►  npm run build:seed
                                                                     │
                                                                     ▼
                                              public/data/tournament.json  (the seed)
                                                                     │
                          first app load seeds it ──► IndexedDB cache ──► UI
                                                                     ▲
                                   "Update data" re-fetches the source URL
                                   and replaces the cache iff metadata.version changed
```

- The app **never** auto-fetches on load after the first seed. It reads the
  IndexedDB cache. This is intentional (see the product brief).
- The **"Update data"** button re-fetches whatever URL is configured in
  `Data → Update source URL` (defaults to the bundled `/data/tournament.json`).
  To serve a fresh dataset without rebuilding, host the regenerated
  `tournament.json` somewhere and point that field at it.
- User settings (timezone mode, etc.) live in `localStorage` under
  `wc26.settings` and are **never** touched by a data update.

## 2. The schema (what `tournament.json` must contain)

Authoritative TypeScript types: [`src/types.ts`](src/types.ts). Shape:

- `tournament` — id, name, year, hosts, startDate, endDate, totalMatches (104), teamCount (48), groupCount (12)
- `venues[]` — `{ id, stadium, city, country, capacity, lat, lng, tz (IANA), accent (hex) }`
- `teams[]` — `{ id (lowercase code), name, code (FIFA 3-letter), flag (emoji), confederation, groupId }`
- `groups[]` — `{ id ("A".."L"), name, teamIds[] }`
- `matches[]` — `{ id, matchNumber, stage, groupId, venueId, kickoff (UTC ISO), homeTeamId, awayTeamId, homeLabel, awayLabel, status, homeScore, awayScore, feeders? }`
- `metadata` — `{ source, sourceUrls[], crawledAt, version (hash), schemaVersion, notes }`

`validateData()` in [`src/lib/dataService.ts`](src/lib/dataService.ts) enforces the
required arrays and `metadata.version`. A malformed update is rejected and the old
cache is kept — so a bad crawl can't break the app.

## 3. Sources to crawl

Use these in order. Wikipedia is the most structured; the schedule sites give
per-match kickoff times.

| What you need | Primary source |
|---|---|
| 16 venues (city, stadium, capacity) | https://en.wikipedia.org/wiki/2026_FIFA_World_Cup |
| Final draw — 12 groups × 4 teams (with playoff slots resolved) | https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_draw |
| Full group-stage schedule with kickoff times (ET) + stadiums | https://www.nbcsports.com/soccer/news/2026-world-cup-schedule-confirmed-dates-times-stadiums-full-details |
| Cross-check schedule / knockout dates | https://www.skysports.com/football/news/11095/13481245/ (and fifa.com) |

**Live scores / results during the tournament:** Wikipedia match articles and
the FIFA site publish final scores. To record a result, set the match's
`status: "finished"` and fill `homeScore`/`awayScore`. Standings then compute
automatically (see [`src/lib/standings.ts`](src/lib/standings.ts)).

## 4. Editing the generator — the only file you touch for data

Open [`scripts/build-seed.mjs`](scripts/build-seed.mjs). It contains four tables:

### 4a. `VENUES`
One row per stadium. Keep the `id` stable (the schedule + matches reference it).
`accent` is the venue's broadcast color used by the stadium artwork — any hex is fine.

### 4b. `GROUPS`
`{ "A": [[name, code, flag, confederation], ... x4], ... "L": [...] }`.
- `code` is the FIFA 3-letter code; it becomes the team `id` (lowercased).
- `flag` is the emoji. England/Scotland use the subdivision emoji (`🏴...`).
- **Resolve playoff slots** to the actual qualified nation once the March 2026
  intercontinental/UEFA playoffs are decided (already done in the current data:
  A→Czechia, B→Bosnia and Herzegovina, D→Turkiye, F→Sweden, I→Iraq, K→DR Congo).

### 4c. `SCHEDULE` (group stage, 72 rows)
`[dateET, timeET, homeName, awayName, venueId]`
- `dateET` / `timeET` are the **US Eastern** date & wall-clock of kickoff (the
  format NBC publishes). The generator converts ET→UTC by **+4 hours** (EDT in
  June/July) and stores a single UTC instant. The UI converts that instant to
  venue-local / your-local / UTC at runtime — DST-safe.
- For a game listed as **"00:00 ET (midnight)"** under day *D*, enter it as
  `D+1` at `"00:00"` (it's the late local-night slot rolling past midnight ET).
- Team names must exactly match a name in `GROUPS`. The generator derives each
  match's `groupId` from the team and **throws** if the two teams aren't in the
  same group — a built-in typo guard.

### 4d. Knockout bracket
Structural placeholders (`r32`→`final` + third place) with seeding labels like
`"1A"`, `"3rd (C/E/F/H)"`, and `feeders` linking `winnerOf`/`loserOf` earlier
matches. To turn a slot into a real team once known, set `homeTeamId`/`awayTeamId`
on that match (and the UI stops showing the placeholder). Update venues/exact
pairings from the official 104-match schedule when refining.

## 5. Regenerate + verify

```bash
# stamp the crawl time so the Data Center shows when data was pulled
CRAWLED_AT="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" npm run build:seed

# sanity build
npm run build
```

`build:seed` prints a summary. **Verify:**
- `teams=48 groups=12 venues=16 matches=104`
- a new `version=` hash (this is what makes the app's "Update data" detect a change)

## 6. Ship the update

- **Local use:** just reload the app and press **Data → Update data**. Because the
  bundled JSON changed, the version differs and the cache refreshes.
  (If the cache seems stale, the data lives in IndexedDB under `wc26.tournament`;
  pressing Update data is the supported refresh path.)
- **Deployed use:** commit the regenerated `public/data/tournament.json`, redeploy
  (Netlify/GitHub Pages — see [README](README.md)), then press Update data. Or host
  the JSON separately and point the Update source URL at it.

## 7. Common pitfalls

- **Don't hand-edit `public/data/tournament.json`.** Edit the tables in
  `build-seed.mjs` and regenerate, so the hash and structure stay consistent.
- **Times look wrong by N hours** → check the `ET_TO_UTC_HOURS` constant. It's `4`
  for June/July (EDT). It would only differ if FIFA scheduled matches outside DST.
- **A team name in `SCHEDULE` doesn't match `GROUPS`** → the generator throws with
  the offending name; fix the spelling.
- **App didn't refresh** → the version hash didn't change (identical data), or the
  configured Update source URL points at the old file.
