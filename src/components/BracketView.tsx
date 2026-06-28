import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Match, Stage } from "@/types";
import { useStore, useTeamMap, useVenueMap } from "@/store/useStore";
import { viewMatch } from "@/lib/matchView";
import { formatDate } from "@/lib/time";
import { STAGE_LABEL, STAGE_SHORT, cn } from "./ui";

// ---------------------------------------------------------------------------
// Two-sided bracket: the Final sits in the middle, the two halves of the draw
// fan out symmetrically on each side (R32 → R16 → QF → SF → Final ← SF ← …).
//
// Alignment is structural, not hand-tuned: every column is an equal-height
// flex stack whose matches live in `flex-1` cells. A round with N matches
// therefore centres each match at (k+0.5)/N of the height, which is exactly
// the midpoint of the two cells (2k, 2k+1) of the 2N-match round feeding it.
// The connector columns reuse the same geometry, so a match always renders
// halfway between the two matches it depends on, at any height.
// ---------------------------------------------------------------------------

const HEADER = "mb-3 flex h-7 shrink-0 items-center justify-center";
const LINE = "border-white/15";
const LINE_GOLD = "border-gold/50";

function winnerSide(match: Match): "home" | "away" | null {
  if (match.status !== "finished" || match.homeScore == null || match.awayScore == null) return null;
  if (match.homeScore === match.awayScore) return null;
  return match.homeScore > match.awayScore ? "home" : "away";
}

function BracketCard({
  match,
  index = 0,
  tone = "default",
}: {
  match: Match;
  index?: number;
  tone?: "default" | "final" | "third";
}) {
  const openMatch = useStore((s) => s.openMatch);
  const tzMode = useStore((s) => s.tzMode);
  const teamMap = useTeamMap();
  const venueMap = useVenueMap();
  const { home, away, venue } = viewMatch(match, teamMap, venueMap);
  const win = winnerSide(match);
  const isFinal = tone === "final";
  const isThird = tone === "third";

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.25) }}
      onClick={() => openMatch(match.id)}
      className={cn(
        "card-press relative block text-left transition-colors",
        isFinal ? "w-[208px]" : "w-[150px]",
        "shrink-0 rounded-xl border p-2.5",
        isFinal
          ? "border-gold/60 bg-gradient-to-b from-gold/20 to-gold/5 shadow-glow hover:from-gold/25"
          : isThird
            ? "border-amber-700/40 bg-amber-900/10 hover:border-amber-600/50"
            : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]",
      )}
    >
      {[home, away].map((s, i) => {
        const isWin = win === (i === 0 ? "home" : "away");
        const isLoss = win && !isWin;
        return (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 py-1",
              i === 0 && "border-b border-white/5",
              isFinal && "py-1.5",
            )}
          >
            <span className={cn("leading-none", isFinal ? "text-lg" : "text-base")}>{s.flag}</span>
            <span
              className={cn(
                "truncate",
                isFinal ? "text-sm" : "text-xs",
                s.team ? "text-ink" : "italic text-ink-muted",
                isWin && "font-bold text-ink",
                !isWin && s.team && !isLoss && "font-semibold",
                isLoss && "text-ink-faint",
              )}
            >
              {s.label}
            </span>
            {match.status === "finished" && (
              <span
                className={cn(
                  "ml-auto tabular-nums",
                  isFinal ? "text-sm" : "text-xs",
                  isWin ? "font-bold text-gold" : "text-ink-muted",
                )}
              >
                {i === 0 ? match.homeScore : match.awayScore}
              </span>
            )}
          </div>
        );
      })}
      <div className={cn("mt-1.5 truncate text-[10px]", isFinal ? "text-gold/80" : "text-ink-faint")}>
        {formatDate(match, tzMode, venue)}
        {venue && ` · ${venue.city}`}
      </div>
    </motion.button>
  );
}

// One connector column. `count` vertical joiners; `dir` is the direction the
// lines converge toward (the side where the next, smaller round sits).
function Connectors({
  count,
  dir,
  variant = "bracket",
  gold = false,
}: {
  count: number;
  dir: "left" | "right";
  variant?: "bracket" | "straight";
  gold?: boolean;
}) {
  const color = gold ? LINE_GOLD : LINE;
  return (
    <div className="flex w-6 shrink-0 flex-col self-stretch">
      <div className={HEADER} aria-hidden />
      <div className="flex flex-1 flex-col">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="relative flex-1">
            {variant === "straight" ? (
              <div className={cn("absolute inset-x-0 top-1/2 border-t", color)} />
            ) : dir === "right" ? (
              <>
                {/* arms at 25%/75% meet a vertical bar at centre, then a stub right */}
                <div className={cn("absolute left-0 right-1/2 top-1/4 bottom-1/4 border-y border-r", color)} />
                <div className={cn("absolute left-1/2 right-0 top-1/2 border-t", color)} />
              </>
            ) : (
              <>
                <div className={cn("absolute left-1/2 right-0 top-1/4 bottom-1/4 border-y border-l", color)} />
                <div className={cn("absolute left-0 right-1/2 top-1/2 border-t", color)} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoundColumn({
  stage,
  matches,
}: {
  stage: Stage;
  matches: Match[];
}) {
  return (
    <div className="flex flex-col self-stretch">
      <div className={HEADER}>
        <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
          <span className="hidden sm:inline">{STAGE_LABEL[stage]}</span>
          <span className="sm:hidden">{STAGE_SHORT[stage]}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col">
        {matches.map((m, i) => (
          <div key={m.id} className="flex flex-1 items-center px-1">
            <BracketCard match={m} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CenterColumn({ final, third }: { final: Match | undefined; third: Match | undefined }) {
  const teamMap = useTeamMap();
  const winId =
    final && winnerSide(final) === "home"
      ? final.homeTeamId
      : final && winnerSide(final) === "away"
        ? final.awayTeamId
        : null;
  const champion = winId ? teamMap.get(winId) : null;

  return (
    <div className="flex flex-col self-stretch">
      <div className={HEADER}>
        <span className="whitespace-nowrap rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
          Final
        </span>
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center gap-3 px-2">
        {/* soft central glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-2">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <span className="text-3xl drop-shadow-[0_0_8px_rgba(233,185,73,0.5)]">🏆</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/80">
              {champion ? "Champion" : "World Champion"}
            </span>
            {champion && (
              <span className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-ink">
                <span className="text-base leading-none">{champion.flag}</span>
                {champion.name}
              </span>
            )}
          </motion.div>
          {final && <BracketCard match={final} tone="final" />}
        </div>

        {third && (
          <div className="relative mt-1 flex flex-col items-center">
            <span className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-500/80">
              Third place
            </span>
            <BracketCard match={third} tone="third" />
          </div>
        )}
      </div>
    </div>
  );
}

// Order each round top-to-bottom by walking the feeder tree from the Final.
// An in-order traversal (home subtree → self → away subtree) lays the leaves
// (R32) out in true bracket order, so the positional connectors between
// columns always join the two matches that actually feed the next one.
function bracketOrder(matches: Match[]) {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const out: Record<string, Match[]> = { r32: [], r16: [], qf: [], sf: [], final: [] };
  const seen = new Set<string>();
  const visit = (m: Match | undefined) => {
    if (!m || seen.has(m.id)) return;
    seen.add(m.id);
    const homeRef = m.feeders?.home?.winnerOf;
    const awayRef = m.feeders?.away?.winnerOf;
    visit(homeRef ? byId.get(homeRef) : undefined);
    out[m.stage]?.push(m);
    visit(awayRef ? byId.get(awayRef) : undefined);
  };
  visit(matches.find((m) => m.stage === "final"));
  return out;
}

export function BracketView({ matches }: { matches: Match[] }) {
  const ordered = bracketOrder(matches);
  // Fall back to match-number order if the feeder graph is incomplete.
  const byStage = (s: Stage) =>
    ordered[s]?.length
      ? ordered[s]
      : matches.filter((m) => m.stage === s).sort((a, b) => a.matchNumber - b.matchNumber);
  const r32 = byStage("r32");
  const r16 = byStage("r16");
  const qf = byStage("qf");
  const sf = byStage("sf");
  const final = matches.find((m) => m.stage === "final");
  const third = matches.find((m) => m.stage === "third");

  const half = <T,>(a: T[]) => [a.slice(0, Math.ceil(a.length / 2)), a.slice(Math.ceil(a.length / 2))] as const;
  const [r32L, r32R] = half(r32);
  const [r16L, r16R] = half(r16);
  const [qfL, qfR] = half(qf);
  const [sfL, sfR] = half(sf);

  // Open with the Final centred so the symmetry of the draw reads at a glance.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
  }, []);

  return (
    <div ref={scrollRef} className="overflow-x-auto pb-2 [scrollbar-gutter:stable]">
      <div className="flex min-h-[600px] min-w-max items-stretch">
        {/* ---------- left half (outer → centre) ---------- */}
        <RoundColumn stage="r32" matches={r32L} />
        <Connectors count={r16L.length} dir="right" />
        <RoundColumn stage="r16" matches={r16L} />
        <Connectors count={qfL.length} dir="right" />
        <RoundColumn stage="qf" matches={qfL} />
        <Connectors count={sfL.length} dir="right" />
        <RoundColumn stage="sf" matches={sfL} />
        <Connectors count={1} dir="right" variant="straight" gold />

        {/* ---------- final ---------- */}
        <CenterColumn final={final} third={third} />

        {/* ---------- right half (centre → outer) ---------- */}
        <Connectors count={1} dir="left" variant="straight" gold />
        <RoundColumn stage="sf" matches={sfR} />
        <Connectors count={sfR.length} dir="left" />
        <RoundColumn stage="qf" matches={qfR} />
        <Connectors count={qfR.length} dir="left" />
        <RoundColumn stage="r16" matches={r16R} />
        <Connectors count={r16R.length} dir="left" />
        <RoundColumn stage="r32" matches={r32R} />
      </div>
    </div>
  );
}
