import type { DailyPuzzle, Item, Tier } from "@/lib/game/types";

export function makeItem(tier: Tier, priceCents: number, date = "2026-11-08"): Item {
  return {
    id: `${date}-${tier}`,
    tier,
    brand: "Test Brand",
    name: "Test Item",
    categoryEmoji: { budget: "👕", mid: "👖", bougie: "👜" }[tier],
    imageUrl: "placeholder:shirt",
    imageAlt: "A test item",
    priceCents,
    currency: "USD",
    retailerName: "Test Retailer",
    priceCheckedAt: "2026-11-01",
    clues: { material: "Linen", detail: "Pockets", typicalRange: "$30–$60" },
  };
}

export function makePuzzle(date = "2026-11-08"): DailyPuzzle {
  return {
    date,
    items: [
      makeItem("budget", 4000, date),
      makeItem("mid", 12000, date),
      makeItem("bougie", 200000, date),
    ],
  };
}
