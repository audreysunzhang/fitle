import { describe, expect, it } from "vitest";
import {
  addDays,
  formatCountdown,
  localDateKey,
  msUntilLocalMidnight,
  puzzleNumber,
} from "@/lib/game/date";

const HOUR = 3_600_000;

describe("puzzleNumber", () => {
  it("counts from the launch date", () => {
    expect(puzzleNumber("2026-11-08", "2026-11-08")).toBe(1);
    expect(puzzleNumber("2026-11-09", "2026-11-08")).toBe(2);
    expect(puzzleNumber("2027-01-01", "2026-11-08")).toBe(55);
  });
  it("is unaffected by DST changes", () => {
    expect(puzzleNumber("2026-11-02", "2026-10-31")).toBe(3); // clocks back Nov 1
    expect(puzzleNumber("2027-03-15", "2027-03-13")).toBe(3); // clocks forward Mar 14
  });
});

describe("localDateKey", () => {
  it("uses the local date around midnight, not UTC", () => {
    expect(localDateKey(new Date(2026, 10, 8, 23, 59, 59))).toBe("2026-11-08");
    expect(localDateKey(new Date(2026, 10, 9, 0, 0, 0))).toBe("2026-11-09");
    // 03:00 UTC on the 9th is still the evening of the 8th in New York.
    expect(localDateKey(new Date("2026-11-09T03:00:00Z"))).toBe("2026-11-08");
  });
});

describe("msUntilLocalMidnight", () => {
  it("handles a normal day", () => {
    expect(msUntilLocalMidnight(new Date(2026, 10, 8, 0, 0, 0))).toBe(24 * HOUR);
    expect(msUntilLocalMidnight(new Date(2026, 10, 8, 23, 0, 0))).toBe(HOUR);
  });
  it("handles a 25-hour and a 23-hour day", () => {
    expect(msUntilLocalMidnight(new Date(2026, 10, 1, 0, 0, 0))).toBe(25 * HOUR);
    expect(msUntilLocalMidnight(new Date(2026, 2, 8, 0, 0, 0))).toBe(23 * HOUR);
  });
});

it("adds days across month and year ends", () => {
  expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
});

it("formats a countdown", () => {
  expect(formatCountdown(3_661_000)).toBe("01:01:01");
  expect(formatCountdown(-5)).toBe("00:00:00");
});
