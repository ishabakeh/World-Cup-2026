# ⚽ World Cup 2026 Explorer

A premium, offline-first web app for exploring the **FIFA World Cup 2026** —
matches, groups, the knockout bracket, and all 16 host venues across the USA,
Canada & Mexico. Dark, broadcast-style UI; all times in 24-hour format; metric units.

> Built as a static single-page app. No backend, no API keys, no tracking. Data is
> cached locally and only refreshes when **you** press *Update data*.

## ✨ Features

- **Dashboard** — featured next match with live countdown, today's matches, tournament progress, quick nav.
- **Match explorer** — all 104 fixtures with filters (date, group, host country, venue, stage, status) and full-text search, grouped by day.
- **Match detail** — flags, confederations, live countdown, kickoff shown in **venue / your / UTC** time at once, add-to-calendar (`.ics`), maps link, venue facts, source metadata.
- **Groups** — all 12 groups with standings (P/W/D/L/GD/Pts), qualification indicators, and clickable fixtures. Standings compute live from results.
- **Knockout bracket** — Round of 32 → Final + third-place match, with seeding placeholders that resolve to real teams as results come in.
- **Venues** — 16 host stadiums grouped by country, each with a detail page (capacity, coordinates, local time, hosted matches, stages).
- **Timezone toggle** — venue-local / my time / UTC, applied everywhere (24-hour).
- **Data Center** — cache status, version hash, timestamps, configurable update source, honest failure handling.

## 🚀 Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Build & preview the production bundle:

```bash
npm run build
npm run preview
```

## 🧱 Tech

Vite · React 18 · TypeScript · Tailwind CSS · Framer Motion · Zustand ·
Radix Dialog · Luxon (timezone-safe formatting) · idb-keyval (IndexedDB cache) ·
lucide-react. No mapping library — venues use generated stadium artwork + a
"open in maps" link.

## 📁 Project structure

```
.
├─ public/data/tournament.json   # the bundled seed dataset (generated)
├─ scripts/build-seed.mjs        # crawl tables → tournament.json (run: npm run build:seed)
├─ update.md                     # ← how to re-crawl & refresh the data (read this!)
├─ index.html
└─ src/
   ├─ types.ts                   # data model (Tournament, Team, Group, Match, Venue, …)
   ├─ main.tsx · App.tsx         # entry + hash router + loading/error states
   ├─ lib/
   │  ├─ dataService.ts          # IndexedDB cache, seed, validate, hash-compare, update
   │  ├─ time.ts                 # Luxon helpers + timezone modes + countdown
   │  ├─ standings.ts            # group standings from finished matches
   │  ├─ calendar.ts             # .ics generation
   │  ├─ matchView.ts            # resolve team / placeholder / feeder labels
   │  └─ router.tsx              # tiny dependency-free hash router
   ├─ store/useStore.ts          # Zustand store (data + settings + modal state)
   ├─ components/                # MatchCard, MatchDetailModal, GroupTable, BracketView,
   │                             #   VenueCard, UpdateDataPanel, TimezoneToggle, FilterBar,
   │                             #   Countdown, StadiumArt, Layout, ui primitives
   └─ pages/                     # Dashboard, Matches, Groups, Bracket, Venues, DataCenter
```

## 🔄 Updating the data

The app seeds from `public/data/tournament.json` once, then reads its local cache.
Pressing **Data → Update data** re-fetches the configured source, validates it,
and replaces the cache **only if the version hash changed** — preserving your settings.

To pull genuinely fresh tournament data, follow **[`update.md`](update.md)**: crawl
the sources, update the tables in `scripts/build-seed.mjs`, run `npm run build:seed`,
then press *Update data*. `update.md` is written so an AI coding assistant can follow
it start to finish.

## ☁️ Deploy (free)

**Netlify** (zero config — `netlify.toml` included):

```bash
npm i -g netlify-cli
netlify deploy --build --prod
```
…or drag the `dist/` folder onto app.netlify.com, or connect the repo (build:
`npm run build`, publish: `dist`).

**GitHub Pages** (workflow included at `.github/workflows/deploy.yml`):

1. Push to GitHub. In **Settings → Pages**, set **Source: GitHub Actions**.
2. The workflow builds with `VITE_BASE=/<repo>/` so asset paths resolve under the
   project subpath, and publishes `dist/`.
3. The workflow auto-uses the actual repo name for the base path.

The hash router (`#/matches`, etc.) means there are **no server rewrite rules to
configure** — deep links work on any static host.

## 📊 Data sources & accuracy

Group stage (dates, kickoff times, venues) and the final draw are crawled from
Wikipedia + NBC Sports/Sky Sports (see the Data Center for live links). Knockout
matchups are structural placeholders until results decide them. Times are stored
as UTC instants and converted client-side, so the timezone toggle is exact and
DST-safe.

This project is an independent fan tool and is not affiliated with or endorsed by FIFA.
