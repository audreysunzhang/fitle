import { addDays, daysBetween } from "./date";
import { isDayFinished } from "./reducer";
import type { DayProgress } from "./types";

export type DistributionKey = "1" | "2" | "3" | "4" | "5" | "X";

export interface Stats {
  gamesPlayed: number;
  currentStreak: number;
  maxStreak: number;
  itemsPlayed: number;
  itemsSolved: number;
  winRatePct: number | null;
  distribution: Record<DistributionKey, number>;
  snipes: number;
  avgFirstGuessErrorPct: number | null;
  copRatePct: number | null;
}

const pct = (part: number, whole: number) => (whole === 0 ? null : (part / whole) * 100);

function streaks(finished: string[], today: string): { current: number; max: number } {
  const dates = new Set(finished);
  let max = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of [...finished].sort()) {
    run = previous !== null && daysBetween(previous, date) === 1 ? run + 1 : 1;
    max = Math.max(max, run);
    previous = date;
  }

  // An unfinished today hasn't broken the streak yet, so count back from yesterday.
  let cursor = dates.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (dates.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, max };
}

/** Everything is derived from the per-date records, so reloads can't double count. */
export function computeStats(days: Record<string, DayProgress>, today: string): Stats {
  const records = Object.values(days);
  const finished = records.filter(isDayFinished).map((day) => day.date);
  const { current, max } = streaks(finished, today);

  const played = records.flatMap((day) => day.items).filter((item) => item.status !== "guessing");
  const distribution: Record<DistributionKey, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, X: 0 };
  for (const item of played) {
    distribution[item.solved ? (String(item.guesses.length) as DistributionKey) : "X"]++;
  }

  const solved = played.filter((item) => item.solved).length;
  const voted = played.filter((item) => item.verdict !== null);
  const copped = voted.filter((item) => item.verdict === "cop").length;
  const errors = played.map(
    (item) => (Math.abs(item.guesses[0].cents - item.priceCents) / item.priceCents) * 100,
  );

  return {
    gamesPlayed: finished.length,
    currentStreak: current,
    maxStreak: max,
    itemsPlayed: played.length,
    itemsSolved: solved,
    winRatePct: pct(solved, played.length),
    distribution,
    snipes: distribution[1],
    avgFirstGuessErrorPct:
      errors.length === 0 ? null : errors.reduce((a, b) => a + b, 0) / errors.length,
    copRatePct: pct(copped, voted.length),
  };
}
