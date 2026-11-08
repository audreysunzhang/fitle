import { addDays, isDateKey } from "../game/date";

export interface ContentFile {
  /** File name without its directory, e.g. "2026-11-08.json". */
  name: string;
  data: unknown;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

const TIER_ORDER = ["budget", "mid", "bougie"];
const filled = (value: unknown) => typeof value === "string" && value.trim() !== "";

export function validateContent(files: ContentFile[], today: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const dates = new Set<string>();

  for (const { name, data } of files) {
    const fail = (message: string) => errors.push(`${name}: ${message}`);
    const date = name.replace(/\.json$/, "");
    const puzzle = data as { date?: unknown; items?: unknown };

    if (!isDateKey(date)) fail("file name must be a date like 2026-11-08.json");
    dates.add(date);
    if (puzzle?.date !== date) fail(`date field must match the file name (${date})`);

    if (!Array.isArray(puzzle?.items) || puzzle.items.length !== 3) {
      fail("must have exactly 3 items");
      continue;
    }

    puzzle.items.forEach((raw, index) => {
      const item = raw as Record<string, unknown> & { clues?: Record<string, unknown> };
      const label = `item ${index + 1} (${String(item?.id ?? "no id")})`;

      if (item?.tier !== TIER_ORDER[index]) {
        fail(`${label}: tier must be ${TIER_ORDER[index]} (order is budget, mid, bougie)`);
      }
      if (!filled(item?.id)) {
        fail(`${label}: missing id`);
      } else if (seenIds.has(item.id as string)) {
        fail(`${label}: duplicate item id`);
      } else {
        seenIds.add(item.id as string);
      }
      if (!Number.isInteger(item?.priceCents) || (item.priceCents as number) <= 0) {
        fail(`${label}: priceCents must be a whole number above 0`);
      }
      for (const clue of ["material", "detail", "typicalRange"]) {
        if (!filled(item?.clues?.[clue])) fail(`${label}: missing clue "${clue}"`);
      }
      for (const field of [
        "brand",
        "name",
        "categoryEmoji",
        "imageUrl",
        "imageAlt",
        "retailerName",
        "priceCheckedAt",
      ]) {
        if (!filled(item?.[field])) fail(`${label}: missing ${field}`);
      }
    });
  }

  for (let offset = 0; offset < 14; offset++) {
    const date = addDays(today, offset);
    if (!dates.has(date)) warnings.push(`No puzzle for ${date}`);
  }

  return { errors, warnings };
}
