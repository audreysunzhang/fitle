import { MAX_GUESSES } from "./config";
import { assessGuess } from "./price";
import type { DailyPuzzle, DayProgress, ItemProgress, Verdict } from "./types";

export const SUMMARY_INDEX = 3;

export function createDay(puzzle: DailyPuzzle, puzzleNumber: number): DayProgress {
  return {
    date: puzzle.date,
    puzzleNumber,
    currentIndex: 0,
    items: puzzle.items.map((item) => ({
      itemId: item.id,
      priceCents: item.priceCents,
      guesses: [],
      status: "guessing",
      solved: false,
      verdict: null,
    })),
  };
}

export function isDayFinished(day: DayProgress): boolean {
  return day.items.length === 3 && day.items.every((item) => item.status === "done");
}

function replaceItem(day: DayProgress, index: number, item: ItemProgress): DayProgress {
  return { ...day, items: day.items.map((old, i) => (i === index ? item : old)) };
}

export function submitGuess(day: DayProgress, cents: number): DayProgress {
  const index = day.currentIndex;
  const item = day.items[index];
  if (!item || item.status !== "guessing") return day;

  const guess = assessGuess(cents, item.priceCents);
  const guesses = [...item.guesses, guess];
  const solved = guess.outcome === "win";
  return replaceItem(day, index, {
    ...item,
    guesses,
    solved,
    status: solved || guesses.length >= MAX_GUESSES ? "voting" : "guessing",
  });
}

export function castVote(day: DayProgress, verdict: Verdict): DayProgress {
  const index = day.currentIndex;
  const item = day.items[index];
  if (!item || item.status !== "voting") return day;
  return replaceItem(day, index, { ...item, verdict, status: "done" });
}

export function advance(day: DayProgress): DayProgress {
  const item = day.items[day.currentIndex];
  if (!item || item.status !== "done") return day;
  return { ...day, currentIndex: day.currentIndex + 1 };
}

/** A reload after the final vote lands on the summary rather than the last item. */
export function resumeDay(day: DayProgress): DayProgress {
  return isDayFinished(day) ? { ...day, currentIndex: SUMMARY_INDEX } : day;
}
