import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { validateContent, type ContentFile } from "@/lib/content/validate";
import { addDays } from "@/lib/game/date";
import { makePuzzle } from "./fixtures";

const TODAY = "2026-11-08";
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const file = (date = TODAY): ContentFile => ({ name: `${date}.json`, data: makePuzzle(date) });
const errorsFor = (mutate: (p: ReturnType<typeof makePuzzle>) => void) => {
  const data = clone(makePuzzle());
  mutate(data);
  return validateContent([{ name: `${TODAY}.json`, data }], TODAY).errors;
};

describe("validateContent", () => {
  it("passes a good puzzle", () => {
    expect(validateContent([file()], TODAY).errors).toEqual([]);
  });
  it("requires exactly three items", () => {
    expect(errorsFor((p) => void p.items.pop()).join()).toMatch(/exactly 3/);
  });
  it("requires tier order", () => {
    expect(errorsFor((p) => p.items.reverse()).join()).toMatch(/tier must be budget/);
  });
  it.each([0, -100])("rejects priceCents of %i", (price) => {
    expect(errorsFor((p) => (p.items[0].priceCents = price)).join()).toMatch(/priceCents/);
  });
  it.each(["material", "detail", "typicalRange"] as const)("requires clue %s", (clue) => {
    expect(errorsFor((p) => (p.items[1].clues[clue] = "")).join()).toMatch(clue);
  });
  it("requires imageAlt", () => {
    expect(errorsFor((p) => (p.items[2].imageAlt = "")).join()).toMatch(/imageAlt/);
  });
  it("catches duplicate ids, within and across files", () => {
    expect(errorsFor((p) => (p.items[1].id = p.items[0].id)).join()).toMatch(/duplicate/);
    const copy: ContentFile = {
      name: "2026-11-09.json",
      data: { ...makePuzzle(), date: "2026-11-09" },
    };
    expect(validateContent([file(), copy], TODAY).errors.join()).toMatch(/duplicate/);
  });
  it("warns but does not fail on missing upcoming days", () => {
    const result = validateContent([file()], TODAY);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(13);
    expect(result.warnings[0]).toContain(addDays(TODAY, 1));
  });
  it("accepts the shipped sample content", () => {
    const dir = "content/puzzles";
    const files = readdirSync(dir).map((name) => ({
      name,
      data: JSON.parse(readFileSync(`${dir}/${name}`, "utf8")),
    }));
    expect(files.length).toBeGreaterThanOrEqual(3);
    expect(validateContent(files, TODAY).errors).toEqual([]);
  });
});
