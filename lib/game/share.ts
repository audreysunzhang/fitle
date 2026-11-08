import { MAX_GUESSES } from "./config";
import type { DayProgress, GuessRecord, Item, ItemProgress } from "./types";

function symbol(guess: GuessRecord): string {
  if (guess.outcome === "win") return "✅";
  if (guess.close) return "🔥";
  return guess.outcome === "higher" ? "⬆️" : "⬇️";
}

function shareLine(emoji: string, progress: ItemProgress): string {
  const symbols = progress.guesses.map(symbol);
  // §4's example: on a loss, ❌ takes the place of the final guess's symbol.
  if (!progress.solved) symbols[symbols.length - 1] = "❌";
  const score = progress.solved ? progress.guesses.length : "X";
  return `${emoji} ${symbols.join("")} ${score}/${MAX_GUESSES} · ${(progress.verdict ?? "").toUpperCase()}`;
}

export function buildShareText(day: DayProgress, items: readonly Item[], siteUrl: string): string {
  return [
    `Cop or Drop #${day.puzzleNumber} 🏷️`,
    ...day.items.map((progress, i) => shareLine(items[i].categoryEmoji, progress)),
    siteUrl,
  ].join("\n");
}
