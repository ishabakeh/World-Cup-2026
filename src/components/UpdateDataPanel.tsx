import { useEffect, useState, type ReactNode } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, Clock, Database, Hash, Link2 } from "lucide-react";
import { DateTime } from "luxon";
import { useStore } from "@/store/useStore";
import { getUpdateSource, setUpdateSource, SEED_URL } from "@/lib/dataService";
import { Button, cn } from "./ui";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return DateTime.fromISO(iso).toFormat("ccc d LLL yyyy · HH:mm");
}

const STATUS_STYLE: Record<string, { icon: ReactNode; cls: string; text: string }> = {
  success: { icon: <CheckCircle2 size={16} />, cls: "text-win", text: "Up to date" },
  unchanged: { icon: <CheckCircle2 size={16} />, cls: "text-win", text: "No changes" },
  error: { icon: <AlertTriangle size={16} />, cls: "text-live", text: "Update failed" },
  updating: { icon: <RefreshCw size={16} className="animate-spin" />, cls: "text-gold", text: "Updating…" },
  checking: { icon: <RefreshCw size={16} className="animate-spin" />, cls: "text-gold", text: "Checking…" },
  idle: { icon: <Clock size={16} />, cls: "text-ink-muted", text: "Idle" },
};

export function UpdateDataPanel() {
  const meta = useStore((s) => s.meta);
  const data = useStore((s) => s.data);
  const runUpdate = useStore((s) => s.runUpdate);
  const [source, setSource] = useState(getUpdateSource());
  const busy = meta.status === "updating" || meta.status === "checking";
  const style = STATUS_STYLE[meta.status] ?? STATUS_STYLE.idle;

  useEffect(() => {
    setSource(getUpdateSource());
  }, [meta.lastChecked]);

  const rows: { icon: ReactNode; label: string; value: string }[] = [
    { icon: <Clock size={14} />, label: "Last updated", value: fmt(meta.lastUpdated) },
    { icon: <RefreshCw size={14} />, label: "Last checked", value: fmt(meta.lastChecked) },
    { icon: <Hash size={14} />, label: "Data version", value: data?.metadata.version ?? meta.version ?? "—" },
    { icon: <Database size={14} />, label: "Source", value: data?.metadata.source ?? "—" },
    { icon: <Clock size={14} />, label: "Data crawled", value: fmt(data?.metadata.crawledAt ?? null) },
  ];

  return (
    <div className="glass space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="h-display text-lg text-ink">Data status</h2>
          <p className="text-sm text-ink-muted">Cached locally. Refreshes only when you ask.</p>
        </div>
        <span className={cn("flex items-center gap-1.5 text-sm font-medium", style.cls)}>
          {style.icon} {style.text}
        </span>
      </div>

      <dl className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="bg-pitch-900/60 p-3">
            <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-faint">
              {r.icon} {r.label}
            </dt>
            <dd className="mt-1 truncate text-sm text-ink" title={r.value}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      {meta.message && (
        <div
          className={cn(
            "rounded-xl border px-3 py-2 text-sm",
            meta.status === "error"
              ? "border-live/30 bg-live/10 text-live"
              : "border-white/10 bg-white/5 text-ink-muted",
          )}
        >
          {meta.message}
          {meta.status === "error" && meta.lastUpdated && (
            <div className="mt-1 text-xs text-ink-faint">
              Showing last successful data from {fmt(meta.lastUpdated)}.
            </div>
          )}
        </div>
      )}

      {/* Configurable source */}
      <div>
        <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-faint">
          <Link2 size={13} /> Update source URL
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            onBlur={() => setUpdateSource(source)}
            placeholder={SEED_URL}
            className="h-10 grow rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-ink outline-none focus:border-gold/50"
          />
          <Button variant="gold" disabled={busy} onClick={() => { setUpdateSource(source); runUpdate(); }}>
            <RefreshCw size={16} className={cn(busy && "animate-spin")} /> Update data
          </Button>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          Point this at a regenerated <code className="text-ink-muted">tournament.json</code> to pull fresh data.
          Re-crawling instructions live in <code className="text-ink-muted">update.md</code>. Your settings are never
          overwritten by an update.
        </p>
      </div>
    </div>
  );
}
