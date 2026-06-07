import { Search, X } from "lucide-react";
import type { Stage } from "@/types";
import { useStore } from "@/store/useStore";
import { Button, STAGE_LABEL, cn } from "./ui";

export interface Filters {
  q: string;
  stage: Stage | "all";
  groupId: string | "all";
  country: string | "all";
  venueId: string | "all";
  status: "all" | "scheduled" | "live" | "finished";
  date: string | "all"; // venue-local ISO date
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  stage: "all",
  groupId: "all",
  country: "all",
  venueId: "all",
  status: "all",
  date: "all",
};

function Select<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(
          "h-9 cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 px-3 pr-7 text-xs text-ink outline-none transition-colors hover:border-white/20 focus:border-gold/50",
          value !== "all" && "border-gold/40 bg-gold/10 text-gold",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-pitch-850 text-ink">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint">▾</span>
    </label>
  );
}

export function FilterBar({
  filters,
  onChange,
  dates,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  dates: { value: string; label: string }[];
}) {
  const data = useStore((s) => s.data);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...filters, [k]: v });
  const active = Object.entries(filters).some(([k, v]) => (k === "q" ? v !== "" : v !== "all"));

  const groupOpts = [
    { value: "all" as const, label: "All groups" },
    ...(data?.groups ?? []).map((g) => ({ value: g.id, label: g.name })),
  ];
  const venueOpts = [
    { value: "all" as const, label: "All venues" },
    ...(data?.venues ?? []).map((v) => ({ value: v.id, label: `${v.city} — ${v.stadium}` })),
  ];
  const stageOpts = [
    { value: "all" as const, label: "All stages" },
    ...(["group", "r32", "r16", "qf", "sf", "third", "final"] as Stage[]).map((s) => ({ value: s, label: STAGE_LABEL[s] })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative grow basis-48">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={filters.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Search team, city, stadium…"
          className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 text-xs text-ink outline-none transition-colors placeholder:text-ink-faint hover:border-white/20 focus:border-gold/50"
        />
      </div>
      <Select label="Date" value={filters.date} onChange={(v) => set("date", v)} options={[{ value: "all", label: "All dates" }, ...dates]} />
      <Select label="Stage" value={filters.stage} onChange={(v) => set("stage", v)} options={stageOpts} />
      <Select label="Group" value={filters.groupId} onChange={(v) => set("groupId", v)} options={groupOpts} />
      <Select
        label="Host"
        value={filters.country}
        onChange={(v) => set("country", v)}
        options={[
          { value: "all", label: "All hosts" },
          { value: "USA", label: "🇺🇸 USA" },
          { value: "Canada", label: "🇨🇦 Canada" },
          { value: "Mexico", label: "🇲🇽 Mexico" },
        ]}
      />
      <Select label="Venue" value={filters.venueId} onChange={(v) => set("venueId", v)} options={venueOpts} />
      <Select
        label="Status"
        value={filters.status}
        onChange={(v) => set("status", v)}
        options={[
          { value: "all", label: "Any status" },
          { value: "scheduled", label: "Scheduled" },
          { value: "live", label: "Live" },
          { value: "finished", label: "Finished" },
        ]}
      />
      {active && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
          <X size={14} /> Clear
        </Button>
      )}
    </div>
  );
}
