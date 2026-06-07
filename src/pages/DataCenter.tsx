import { ExternalLink } from "lucide-react";
import { useStore } from "@/store/useStore";
import { UpdateDataPanel } from "@/components/UpdateDataPanel";
import { SectionTitle } from "@/components/ui";

export function DataCenter() {
  const data = useStore((s) => s.data)!;

  return (
    <div className="space-y-6">
      <SectionTitle title="Data & Update Center" subtitle="The app caches data locally and only refreshes on demand." />
      <UpdateDataPanel />

      <div className="glass space-y-3 p-5">
        <h2 className="h-display text-lg text-ink">Sources</h2>
        <p className="text-sm text-ink-muted">{data.metadata.notes}</p>
        <ul className="space-y-1.5">
          {data.metadata.sourceUrls.map((url) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
              >
                <ExternalLink size={13} /> {url}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass space-y-2 p-5 text-sm text-ink-muted">
        <h2 className="h-display text-lg text-ink">How refreshing works</h2>
        <ol className="list-inside list-decimal space-y-1">
          <li>On first load the app seeds from the bundled <code className="text-ink">tournament.json</code>.</li>
          <li>It then reads only from your local cache (IndexedDB) — no network calls on every visit.</li>
          <li>Pressing <span className="text-ink">Update data</span> re-fetches the configured source, validates the schema, and compares the version hash.</li>
          <li>The cache is overwritten only if the data actually changed. Your timezone and other settings are preserved.</li>
          <li>If an update fails, the previous data and a clear error remain visible.</li>
        </ol>
        <p className="pt-1 text-xs text-ink-faint">
          To pull genuinely fresh tournament data, re-run the crawl described in <code className="text-ink">update.md</code>,
          regenerate <code className="text-ink">tournament.json</code>, then press Update data.
        </p>
      </div>
    </div>
  );
}
