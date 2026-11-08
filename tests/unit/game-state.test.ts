import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/game/date";
import { advance, castVote, createDay, resumeDay, submitGuess } from "@/lib/game/reducer";
import { computeStats } from "@/lib/game/stats";
import type { DayProgress } from "@/lib/game/types";
import { makePuzzle } from "./fixtures";

function finishDay(date: string): DayProgress {
  let day = createDay(makePuzzle(date), 1);
  for (let i = 0; i < 3; i++) {
    day = submitGuess(day, day.items[i].priceCents);
    day = castVote(day, "cop");
    day = advance(day);
  }
  return day;
}
const record = (dates: string[]) => Object.fromEntries(dates.map((d) => [d, finishDay(d)]));
const T = "2026-11-20";

describe("reducer", () => {
  it("wins and moves to voting", () => {
    const day = submitGuess(createDay(makePuzzle(), 1), 4000);
    expect(day.items[0]).toMatchObject({ status: "voting", solved: true });
  });
  it("ends after the fifth wrong guess", () => {
    let day = createDay(makePuzzle(), 1);
    for (let i = 0; i < 4; i++) day = submitGuess(day, 100);
    expect(day.items[0].status).toBe("guessing");
    day = submitGuess(day, 100);
    expect(day.items[0]).toMatchObject({ status: "voting", solved: false });
  });
  it("ignores guesses after the item ends, and repeat votes", () => {
    let day = submitGuess(createDay(makePuzzle(), 1), 4000);
    expect(submitGuess(day, 100)).toBe(day);
    day = castVote(day, "cop");
    expect(castVote(day, "drop")).toBe(day);
  });
  it("won't advance before the vote", () => {
    const day = submitGuess(createDay(makePuzzle(), 1), 4000);
    expect(advance(day).currentIndex).toBe(0);
  });
  it("resumes a finished day on the summary", () => {
    let day = finishDay("2026-11-08");
    day = { ...day, currentIndex: 2 };
    expect(resumeDay(day).currentIndex).toBe(3);
  });
});

describe("streaks", () => {
  it("counts consecutive days", () => {
    const stats = computeStats(record([addDays(T, -2), addDays(T, -1), T]), T);
    expect(stats.currentStreak).toBe(3);
    expect(stats.maxStreak).toBe(3);
  });
  it("resets after a missed day but keeps the max", () => {
    const dates = [addDays(T, -5), addDays(T, -4), addDays(T, -3), addDays(T, -1), T];
    const stats = computeStats(record(dates), T);
    expect(stats.currentStreak).toBe(2);
    expect(stats.maxStreak).toBe(3);
  });
  it("stays alive until today is over, then breaks", () => {
    const days = record([addDays(T, -2), addDays(T, -1)]);
    expect(computeStats(days, T).currentStreak).toBe(2);
    expect(computeStats(days, addDays(T, 1)).currentStreak).toBe(0);
  });
  it("doesn't count an unfinished day", () => {
    const days = { ...record([addDays(T, -1)]), [T]: createDay(makePuzzle(T), 1) };
    const stats = computeStats(days, T);
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.currentStreak).toBe(1);
  });
  it("doesn't double count replaying the same record", () => {
    const once = record([T]);
    const twice = { ...once, [T]: finishDay(T) };
    expect(computeStats(twice, T).gamesPlayed).toBe(1);
  });
  it("counts a streak across a DST change", () => {
    const dates = ["2026-10-31", "2026-11-01", "2026-11-02"];
    expect(computeStats(record(dates), "2026-11-02").currentStreak).toBe(3);
  });
});

describe("stats", () => {
  it("computes rates, distribution, and first-guess accuracy", () => {
    let day = createDay(makePuzzle(T), 1);
    day = submitGuess(day, 4000); // 1 guess, 0% off
    day = advance(castVote(day, "cop"));
    day = submitGuess(day, 6000); // 50% off
    day = submitGuess(day, 12000);
    day = advance(castVote(day, "drop"));
    for (let i = 0; i < 5; i++) day = submitGuess(day, 100000); // 50% off, loss
    day = castVote(day, "drop");

    const stats = computeStats({ [T]: day }, T);
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.itemsPlayed).toBe(3);
    expect(stats.itemsSolved).toBe(2);
    expect(stats.winRatePct).toBeCloseTo(66.67, 1);
    expect(stats.distribution).toEqual({ 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, X: 1 });
    expect(stats.snipes).toBe(1);
    expect(stats.avgFirstGuessErrorPct).toBeCloseTo(33.33, 1);
    expect(stats.copRatePct).toBeCloseTo(33.33, 1);
  });
  it("has empty values for a new player", () => {
    const stats = computeStats({}, T);
    expect(stats).toMatchObject({
      winRatePct: null,
      avgFirstGuessErrorPct: null,
      copRatePct: null,
    });
  });
});
