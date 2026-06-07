import { useStore } from "@/store/useStore";
import type { TzMode } from "@/lib/time";
import { cn } from "./ui";

const MODES: { id: TzMode; label: string; hint: string }[] = [
  { id: "venue", label: "Venue", hint: "Stadium local time" },
  { id: "local", label: "My time", hint: "Your device timezone" },
  { id: "utc", label: "UTC", hint: "Coordinated Universal Time" },
];

/** Segmented control switching how every kickoff time is displayed (always 24h). */
export function TimezoneToggle({ className }: { className?: string }) {
  const tzMode = useStore((s) => s.tzMode);
  const setTzMode = useStore((s) => s.setTzMode);
  return (
    <div className={cn("inline-flex rounded-xl border border-white/10 bg-white/5 p-1", className)} role="tablist" aria-label="Timezone">
      {MODES.map((m) => (
        <button
          key={m.id}
          role="tab"
          aria-selected={tzMode === m.id}
          title={m.hint}
          onClick={() => setTzMode(m.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            tzMode === m.id ? "bg-gold/20 text-gold" : "text-ink-muted hover:text-ink",
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
