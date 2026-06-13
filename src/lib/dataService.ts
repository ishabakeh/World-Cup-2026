import { get, set } from "idb-keyval";
import type { CacheMeta, TournamentData } from "@/types";

// Cache lives in IndexedDB (idb-keyval falls back gracefully). User preferences
// are stored under a SEPARATE key namespace (see store) and are never touched by
// data updates — so favorites/settings survive every refresh.
const DATA_KEY = "wc26.tournament";
const META_KEY = "wc26.cacheMeta";
const SOURCE_KEY = "wc26.updateSource";

/** Bundled seed shipped with the app (respects Vite base path). */
export const SEED_URL = `${import.meta.env.BASE_URL}data/tournament.json`;

/** The URL the "Update data" button re-fetches. Defaults to the bundled seed;
 *  point it at a regenerated/hosted JSON (see update.md) to pull fresh data. */
export function getUpdateSource(): string {
  return localStorage.getItem(SOURCE_KEY) || SEED_URL;
}
export function setUpdateSource(url: string): void {
  if (url.trim()) localStorage.setItem(SOURCE_KEY, url.trim());
  else localStorage.removeItem(SOURCE_KEY);
}

/** Structural validation — guards the UI against a malformed update. */
export function validateData(raw: unknown): asserts raw is TournamentData {
  const d = raw as Partial<TournamentData>;
  if (!d || typeof d !== "object") throw new Error("Data is not an object");
  const arrays: (keyof TournamentData)[] = ["venues", "teams", "groups", "matches"];
  for (const k of arrays) {
    if (!Array.isArray(d[k])) throw new Error(`Missing or invalid "${k}" array`);
  }
  if (!d.tournament?.id) throw new Error('Missing "tournament" block');
  if (!d.metadata?.version) throw new Error('Missing "metadata.version"');
  if (d.groups!.length === 0) throw new Error("No groups present");
  if (d.matches!.length === 0) throw new Error("No matches present");
}

async function fetchJson(url: string): Promise<unknown> {
  // Append a cache-buster so a freshly deployed file isn't masked by the
  // GitHub Pages CDN edge cache (which can serve a stale copy for a few minutes
  // after a push). Combined with no-store, this guarantees we read the latest.
  const bust = `_=${Date.now()}`;
  const url2 = url.includes("?") ? `${url}&${bust}` : `${url}?${bust}`;
  const res = await fetch(url2, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching data source`);
  return res.json();
}

export async function readMeta(): Promise<CacheMeta> {
  return (
    (await get<CacheMeta>(META_KEY)) ?? {
      lastUpdated: null,
      lastChecked: null,
      status: "idle",
      message: null,
      version: null,
    }
  );
}

async function writeMeta(meta: CacheMeta): Promise<void> {
  await set(META_KEY, meta);
}

export interface LoadResult {
  data: TournamentData;
  meta: CacheMeta;
}

/** Load from cache; seed from the bundled JSON on first run. */
export async function loadData(): Promise<LoadResult> {
  const cached = await get<TournamentData>(DATA_KEY);
  if (cached) {
    return { data: cached, meta: await readMeta() };
  }
  // First run — seed from bundle.
  const raw = await fetchJson(SEED_URL);
  validateData(raw);
  await set(DATA_KEY, raw);
  const now = new Date().toISOString();
  const meta: CacheMeta = {
    lastUpdated: now,
    lastChecked: now,
    status: "success",
    message: "Seeded from bundled data",
    version: raw.metadata.version,
  };
  await writeMeta(meta);
  return { data: raw, meta };
}

export interface UpdateResult {
  data: TournamentData | null; // null when nothing changed (keep current)
  meta: CacheMeta;
}

/**
 * Re-fetch the configured source, validate, and update the cache only if the
 * content version changed. On any failure the old cache is preserved and an
 * error status is returned — the UI never breaks.
 */
export async function updateData(currentVersion: string | null): Promise<UpdateResult> {
  const checkedAt = new Date().toISOString();
  const prev = await readMeta();
  try {
    const raw = await fetchJson(getUpdateSource());
    validateData(raw);
    if (raw.metadata.version === currentVersion) {
      const meta: CacheMeta = {
        ...prev,
        lastChecked: checkedAt,
        status: "unchanged",
        message: "Data is already up to date",
      };
      await writeMeta(meta);
      return { data: null, meta };
    }
    await set(DATA_KEY, raw);
    const meta: CacheMeta = {
      lastUpdated: checkedAt,
      lastChecked: checkedAt,
      status: "success",
      message: `Updated to version ${raw.metadata.version}`,
      version: raw.metadata.version,
    };
    await writeMeta(meta);
    return { data: raw, meta };
  } catch (err) {
    const meta: CacheMeta = {
      ...prev,
      lastChecked: checkedAt,
      status: "error",
      message: err instanceof Error ? err.message : "Unknown update error",
    };
    await writeMeta(meta);
    return { data: null, meta };
  }
}
