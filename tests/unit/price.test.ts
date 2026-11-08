import { describe, expect, it } from "vitest";
import {
  assessGuess,
  describeGuess,
  formatPrice,
  isClose,
  isWin,
  parseGuess,
} from "@/lib/game/price";

describe("win tolerance", () => {
  it("accepts exactly 10% either side", () => {
    expect(isWin(11000, 10000)).toBe(true);
    expect(isWin(9000, 10000)).toBe(true);
  });
  it("rejects just outside 10%", () => {
    expect(isWin(11001, 10000)).toBe(false);
    expect(isWin(8999, 10000)).toBe(false);
  });
  it("applies the $2 floor to cheap items", () => {
    expect(isWin(700, 500)).toBe(true);
    expect(isWin(701, 500)).toBe(false);
    expect(isWin(300, 500)).toBe(true);
  });
  it("handles cents without float drift", () => {
    expect(isWin(4389, 3990)).toBe(true); // 399 off is exactly 10% of 3990
    expect(isWin(4390, 3990)).toBe(false);
  });
});

describe("feedback", () => {
  it("gives direction", () => {
    expect(assessGuess(5000, 10000).outcome).toBe("higher");
    expect(assessGuess(20000, 10000).outcome).toBe("lower");
  });
  it("marks close at 25% and far beyond it", () => {
    expect(isClose(12500, 10000)).toBe(true);
    expect(isClose(12501, 10000)).toBe(false);
    expect(assessGuess(7500, 10000)).toEqual({ cents: 7500, outcome: "higher", close: true });
    expect(assessGuess(7499, 10000).close).toBe(false);
  });
  it("marks a win as a win, not close", () => {
    expect(assessGuess(10000, 10000)).toEqual({ cents: 10000, outcome: "win", close: false });
  });
  it("describes guesses for screen readers", () => {
    expect(describeGuess({ cents: 1, outcome: "higher", close: true })).toBe("Higher. Close.");
    expect(describeGuess({ cents: 1, outcome: "lower", close: false })).toBe("Lower.");
  });
});

describe("parseGuess", () => {
  it.each([
    ["48", 4800],
    ["48.5", 4850],
    ["48.50", 4850],
    ["$1,250", 125000],
    [" .99 ", 99],
    ["100000", 10000000],
  ])("parses %s", (raw, cents) => {
    expect(parseGuess(raw)).toEqual({ ok: true, cents });
  });
  it.each(["", "  ", "0", "0.00", "-5", "abc", "1.999", "1,5", ".", "100000.01"])(
    "rejects %j",
    (raw) => {
      expect(parseGuess(raw).ok).toBe(false);
    },
  );
});

it("formats prices", () => {
  expect(formatPrice(245000)).toBe("$2,450");
  expect(formatPrice(3990)).toBe("$39.90");
});
