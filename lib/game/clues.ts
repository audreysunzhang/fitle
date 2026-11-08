import { formatPrice } from "./price";
import type { Item } from "./types";

const CATEGORY_WORDS: Record<string, string> = {
  "👕": "tops",
  "👖": "bottoms",
  "👗": "dresses",
  "🧥": "coats and jackets",
  "👟": "shoes",
  "👜": "bags",
  "🧢": "hats",
  "💍": "jewelry pieces",
};

export function categoryWord(emoji: string): string {
  return CATEGORY_WORDS[emoji] ?? "pieces";
}

function stepFor(priceCents: number): number {
  if (priceCents < 2_500) return 100;
  if (priceCents < 10_000) return 500;
  if (priceCents < 50_000) return 1_000;
  if (priceCents < 100_000) return 5_000;
  if (priceCents < 500_000) return 10_000;
  return 50_000;
}

/** A band of roughly ±30%, rounded outward so it always contains the price. */
export function rangeHint(priceCents: number): { lowCents: number; highCents: number } {
  const step = stepFor(priceCents);
  return {
    lowCents: Math.floor((priceCents * 7) / (10 * step)) * step,
    highCents: Math.ceil((priceCents * 13) / (10 * step)) * step,
  };
}

export interface Clue {
  label: string;
  text: string;
}

export function visibleClues(item: Item, wrongGuesses: number): Clue[] {
  const { lowCents, highCents } = rangeHint(item.priceCents);
  const all: Clue[] = [
    { label: "Material", text: item.clues.material },
    { label: "Detail", text: item.clues.detail },
    {
      label: "Typical",
      text: `This brand's ${categoryWord(item.categoryEmoji)} usually cost ${item.clues.typicalRange}.`,
    },
    {
      label: "Range",
      text: `It's between ${formatPrice(lowCents)} and ${formatPrice(highCents)}.`,
    },
  ];
  return all.slice(0, Math.max(0, wrongGuesses));
}
