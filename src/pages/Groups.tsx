import { useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useRoute } from "@/lib/router";
import { GroupTable } from "@/components/GroupTable";
import { SectionTitle } from "@/components/ui";

export function Groups() {
  const data = useStore((s) => s.data)!;
  const { params } = useRoute();
  const focus = params.get("g");

  useEffect(() => {
    if (focus) {
      const el = document.getElementById(`group-${focus}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focus]);

  return (
    <div className="space-y-6">
      <SectionTitle title="Groups" subtitle="12 groups · top two of each advance, plus the eight best third-placed teams" />
      <div className="grid gap-5 lg:grid-cols-2">
        {data.groups.map((g, i) => (
          <motion.section
            id={`group-${g.id}`}
            key={g.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className={`scroll-mt-20 rounded-3xl border p-4 transition-colors ${
              focus === g.id ? "border-gold/40 bg-gold/[0.04]" : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 font-display text-lg font-bold text-ink">
                {g.id}
              </span>
              <h2 className="h-display text-lg text-ink">{g.name}</h2>
            </div>
            <GroupTable group={g} matches={data.matches} />
          </motion.section>
        ))}
      </div>
    </div>
  );
}
