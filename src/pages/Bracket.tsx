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
        subtitle="The Final sits at the centre — the two halves of the draw close in from each side. Tap any match for details."
      />
      <div className="glass p-4 sm:p-6">
        <BracketView matches={knockout} />
      </div>
      <p className="text-xs text-ink-faint">
        Each match sits halfway between the two it feeds from. Slots show seeding placeholders (e.g. “Winner R32 1”)
        until results are recorded, then resolve to real teams.
      </p>
    </div>
  );
}
