import { describe, expect, it } from "vitest";
import { rangeHint, visibleClues } from "@/lib/game/clues";
import { makeItem } from "./fixtures";

describe("rangeHint", () => {
  it("always contains the price, across a wide span", () => {
    for (let cents = 50; cents < 10_000_000; cents = Math.ceil(cents * 1.013) + 1) {
      const { lowCents, highCents } = rangeHint(cents);
      expect(lowCents).toBeLessThan(cents);
      expect(highCents).toBeGreaterThan(cents);
    }
  });
  it("rounds to friendly whole-dollar numbers", () => {
    expect(rangeHint(3990)).toEqual({ lowCents: 2500, highCents: 5500 });
    expect(rangeHint(245000)).toEqual({ lowCents: 170000, highCents: 320000 });
    expect(rangeHint(1499)).toEqual({ lowCents: 1000, highCents: 2000 });
  });
});

describe("visibleClues", () => {
  const item = makeItem("mid", 12000);
  it("reveals one clue per wrong guess, in order", () => {
    expect(visibleClues(item, 0)).toEqual([]);
    expect(visibleClues(item, 1).map((c) => c.text)).toEqual(["Linen"]);
    expect(visibleClues(item, 2)[1].text).toBe("Pockets");
    expect(visibleClues(item, 3)[2].text).toBe("This brand's bottoms usually cost $30–$60.");
    expect(visibleClues(item, 4)[3].text).toBe("It's between $80 and $160.");
    expect(visibleClues(item, 5)).toHaveLength(4);
  });
});
