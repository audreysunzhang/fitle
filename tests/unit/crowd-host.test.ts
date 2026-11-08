import { describe, expect, it } from "vitest";
import pool from "@/content/host/lines.json";
import { isMinority, simulateCrowd } from "@/lib/game/crowd";
import { outcomeLineKind, pickHostLine, reactionLine, type HostPool } from "@/lib/game/host";
import type { ItemProgress } from "@/lib/game/types";
import { makeItem } from "./fixtures";

const ctx = { puzzleNumber: 1, item: makeItem("budget", 4000), pool: pool as HostPool };

describe("simulated crowd", () => {
  it("is deterministic and marked as demo data", () => {
    expect(simulateCrowd("a")).toEqual(simulateCrowd("a"));
    expect(simulateCrowd("a").isDemoCrowd).toBe(true);
  });
  it("adds to 100", () => {
    for (const id of ["a", "b", "c", "2026-11-08-mid"]) {
      const { copPct, dropPct } = simulateCrowd(id);
      expect(copPct + dropPct).toBe(100);
    }
  });
  it("flags a minority strictly below 30%", () => {
    const crowd = { copPct: 29, dropPct: 71, isDemoCrowd: true };
    expect(isMinority("cop", crowd)).toBe(true);
    expect(isMinority("drop", crowd)).toBe(false);
    expect(isMinority("cop", { copPct: 30, dropPct: 70, isDemoCrowd: true })).toBe(false);
  });
});

describe("host", () => {
  it("picks the same line for the same situation", () => {
    expect(pickHostLine("win", ctx)).toBe(pickHostLine("win", ctx));
  });
  it("prefers the item's own line and fills variables", () => {
    const item = { ...makeItem("budget", 4000), host: { win: "{brand} at {price}" } };
    expect(pickHostLine("win", { ...ctx, item })).toBe("Test Brand at $40");
  });
  it("chooses the outcome line", () => {
    const base: ItemProgress = {
      itemId: "x",
      priceCents: 1,
      guesses: [{ cents: 1, outcome: "win", close: false }],
      status: "voting",
      solved: true,
      verdict: null,
    };
    expect(outcomeLineKind(base)).toBe("firstGuessWin");
    expect(outcomeLineKind({ ...base, guesses: [...base.guesses, ...base.guesses] })).toBe("win");
    expect(outcomeLineKind({ ...base, solved: false })).toBe("lose");
  });
  it("uses the minority line with real numbers", () => {
    const item = {
      ...makeItem("budget", 4000),
      host: { minorityReaction: "You {voted} what {otherPct}% {otherVoted}." },
    };
    const crowd = { copPct: 19, dropPct: 81, isDemoCrowd: true };
    expect(reactionLine("cop", crowd, { ...ctx, item })).toBe("You copped what 81% dropped.");
  });
  it("keeps every line within 140 characters and leaves no unknown variables", () => {
    const allowed = new Set([
      "brand",
      "price",
      "item",
      "guesses",
      "voted",
      "otherVoted",
      "otherPct",
    ]);
    for (const line of Object.values(pool).flat()) {
      expect(line.length).toBeLessThanOrEqual(140);
      for (const [, name] of line.matchAll(/\{(\w+)\}/g)) expect(allowed).toContain(name);
    }
  });
});
