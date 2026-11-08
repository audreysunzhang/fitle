import { computeStats, type DistributionKey } from "@/lib/game/stats";
import type { DayProgress } from "@/lib/game/types";
import styles from "./game.module.css";
import { Modal } from "./Modal";

const KEYS: DistributionKey[] = ["1", "2", "3", "4", "5", "X"];
const percent = (value: number | null) => (value === null ? "–" : `${Math.round(value)}%`);

export function StatsModal({
  days,
  today,
  onClose,
}: {
  days: Record<string, DayProgress>;
  today: string;
  onClose: () => void;
}) {
  const stats = computeStats(days, today);
  const peak = Math.max(1, ...KEYS.map((key) => stats.distribution[key]));
  const tiles: [string, string | number][] = [
    ["Played", stats.gamesPlayed],
    ["Streak", stats.currentStreak],
    ["Best streak", stats.maxStreak],
    ["Win rate", percent(stats.winRatePct)],
    ["Snipes", stats.snipes],
    ["Cop rate", percent(stats.copRatePct)],
  ];

  return (
    <Modal title="Your stats" onClose={onClose}>
      <dl className={styles.tiles}>
        {tiles.map(([label, value]) => (
          <div key={label}>
            <dd>{value}</dd>
            <dt>{label}</dt>
          </div>
        ))}
      </dl>

      <h3 className={styles.subhead}>Price Sniper</h3>
      <p>
        {stats.avgFirstGuessErrorPct === null
          ? "Play an item to calibrate your eye."
          : `Your first guess is off by ${Math.round(stats.avgFirstGuessErrorPct)}% on average.`}
      </p>

      <h3 className={styles.subhead}>Guess distribution</h3>
      <ul className={styles.histogram}>
        {KEYS.map((key) => (
          <li key={key}>
            <span>
              <span className="visually-hidden">{key === "X" ? "Missed" : `${key} guesses`}: </span>
              <span aria-hidden="true">{key}</span>
            </span>
            <span className={styles.histogramTrack} aria-hidden="true">
              <span
                className={styles.histogramBar}
                style={{ width: `${(stats.distribution[key] / peak) * 100}%` }}
              />
            </span>
            <span>{stats.distribution[key]}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
