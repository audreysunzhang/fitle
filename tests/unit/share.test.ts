import { expect, it } from "vitest";
import { buildShareText } from "@/lib/game/share";
import type { DayProgress, GuessRecord, ItemProgress, Verdict } from "@/lib/game/types";
import { makePuzzle } from "./fixtures";

const up: GuessRecord = { cents: 1, outcome: "higher", close: false };
const down: GuessRecord = { cents: 1, outcome: "lower", close: false };
const fire: GuessRecord = { cents: 1, outcome: "lower", close: true };
const win: GuessRecord = { cents: 1, outcome: "win", close: false };

const item = (guesses: GuessRecord[], verdict: Verdict): ItemProgress => ({
  itemId: "x",
  priceCents: 1,
  guesses,
  status: "done",
  solved: guesses.at(-1)?.outcome === "win",
  verdict,
});
const day = (items: ItemProgress[]): DayProgress => ({
  date: "2027-01-03",
  puzzleNumber: 57,
  currentIndex: 3,
  items,
});
const share = (items: ItemProgress[]) =>
  buildShareText(day(items), makePuzzle().items, "copordrop.example");

it("matches the spec's example exactly: a mix with an X/5 item", () => {
  expect(
    share([
      item([up, down, win], "drop"),
      item([fire, win], "cop"),
      item([up, up, fire, down, down], "drop"),
    ]),
  ).toBe(
    [
      "Cop or Drop #57 🏷️",
      "👕 ⬆️⬇️✅ 3/5 · DROP",
      "👖 🔥✅ 2/5 · COP",
      "👜 ⬆️⬆️🔥⬇️❌ X/5 · DROP",
      "copordrop.example",
    ].join("\n"),
  );
});

it("formats all wins", () => {
  expect(share([item([win], "cop"), item([up, win], "cop"), item([win], "drop")])).toBe(
    [
      "Cop or Drop #57 🏷️",
      "👕 ✅ 1/5 · COP",
      "👖 ⬆️✅ 2/5 · COP",
      "👜 ✅ 1/5 · DROP",
      "copordrop.example",
    ].join("\n"),
  );
});

it("contains no spoilers", () => {
  const text = share([item([win], "cop"), item([win], "cop"), item([win], "cop")]);
  expect(text).not.toMatch(/Test Brand|Test Item|\$/);
});
