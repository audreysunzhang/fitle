export type Tier = "budget" | "mid" | "bougie";
export type Verdict = "cop" | "drop";

export type HostLineKind =
  "intro" | "firstGuessWin" | "win" | "lose" | "copReaction" | "dropReaction" | "minorityReaction";

export interface Item {
  id: string;
  tier: Tier;
  brand: string;
  name: string;
  categoryEmoji: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit?: string;
  priceCents: number;
  currency: "USD";
  retailerName: string;
  priceCheckedAt: string;
  productUrl?: string;
  isSponsored?: boolean;
  clues: {
    material: string;
    detail: string;
    typicalRange: string;
  };
  host?: Partial<Record<HostLineKind, string>>;
  stylistVerdicts?: { name: string; handle?: string; verdict: Verdict; note?: string }[];
}

export interface DailyPuzzle {
  date: string;
  items: [Item, Item, Item];
  theme?: string;
}

export interface GuessRecord {
  cents: number;
  outcome: "win" | "higher" | "lower";
  close: boolean;
}

export interface ItemProgress {
  itemId: string;
  priceCents: number;
  guesses: GuessRecord[];
  status: "guessing" | "voting" | "done";
  solved: boolean;
  verdict: Verdict | null;
}

export interface DayProgress {
  date: string;
  puzzleNumber: number;
  items: ItemProgress[];
  /** 0–2 is the item being played; 3 is the end-of-day summary. */
  currentIndex: number;
}

export interface AppState {
  playerId: string;
  seenHowTo: boolean;
  days: Record<string, DayProgress>;
}

export interface CrowdSplit {
  copPct: number;
  dropPct: number;
  isDemoCrowd: boolean;
}
