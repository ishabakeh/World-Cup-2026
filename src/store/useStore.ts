import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CacheMeta, Match, Team, TournamentData, Venue } from "@/types";
import type { TzMode } from "@/lib/time";
import { loadData, readMeta, updateData } from "@/lib/dataService";

interface StoreState {
  data: TournamentData | null;
  meta: CacheMeta;
  loading: boolean;
  loadError: string | null;

  // ---- persisted user settings (kept in localStorage, untouched by updates) ----
  tzMode: TzMode;
  setTzMode: (m: TzMode) => void;

  // ---- transient UI state ----
  selectedMatchId: string | null;
  openMatch: (id: string) => void;
  closeMatch: () => void;

  // ---- actions ----
  init: () => Promise<void>;
  runUpdate: () => Promise<void>;
}

const EMPTY_META: CacheMeta = {
  lastUpdated: null,
  lastChecked: null,
  status: "idle",
  message: null,
  version: null,
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      data: null,
      meta: EMPTY_META,
      loading: true,
      loadError: null,

      tzMode: "venue",
      setTzMode: (m) => set({ tzMode: m }),

      selectedMatchId: null,
      openMatch: (id) => set({ selectedMatchId: id }),
      closeMatch: () => set({ selectedMatchId: null }),

      init: async () => {
        set({ loading: true, loadError: null });
        try {
          const { data, meta } = await loadData();
          set({ data, meta, loading: false });
        } catch (err) {
          set({
            loading: false,
            loadError: err instanceof Error ? err.message : "Failed to load data",
            meta: { ...(await readMeta()), status: "error" },
          });
        }
      },

      runUpdate: async () => {
        set({ meta: { ...get().meta, status: "updating", message: "Fetching latest data…" } });
        const current = get().data?.metadata.version ?? null;
        const { data, meta } = await updateData(current);
        set(data ? { data, meta } : { meta });
      },
    }),
    {
      name: "wc26.settings",
      storage: createJSONStorage(() => localStorage),
      // Only persist user settings — never the cached tournament data (that lives
      // in IndexedDB) or transient load/update state.
      partialize: (s) => ({ tzMode: s.tzMode }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Lookup helpers (selectors) — memo-light, called from components.
// ---------------------------------------------------------------------------
export function useTeamMap(): Map<string, Team> {
  const data = useStore((s) => s.data);
  return new Map((data?.teams ?? []).map((t) => [t.id, t]));
}

export function useVenueMap(): Map<string, Venue> {
  const data = useStore((s) => s.data);
  return new Map((data?.venues ?? []).map((v) => [v.id, v]));
}

/** Matches sorted chronologically. */
export function sortedMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}
