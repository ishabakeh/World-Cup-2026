import { useStore } from "@/store/useStore";
import { BracketView } from "@/components/BracketView";
import { SectionTitle } from "@/components/ui";

export function Bracket() {
  const data = useStore((s) => s.data)!;
  const knockout = data.matches.filter((m) => m.stage !== "group");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Knockout bracket"
        subtitle="Round of 32 → Final. Slots fill in as groups conclude — tap any match for details."
      />
      <div className="glass p-4 sm:p-6">
        <BracketView matches={knockout} />
      </div>
      <p className="text-xs text-ink-faint">
        Scroll horizontally to follow the road to the final. Knockout matchups currently show seeding placeholders
        (e.g. “Winner R32 1”); they resolve to real teams once results are recorded.
      </p>
    </div>
  );
}
