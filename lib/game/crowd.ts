import { hash } from "./hash";
import type { CrowdSplit, Verdict } from "./types";

/** DEMO DATA: a seeded stand-in for real votes. Phase 2 replaces this with aggregated results. */
export function simulateCrowd(itemId: string): CrowdSplit {
  const copPct = 12 + (hash(`crowd:${itemId}`) % 77); // 12–88
  return { copPct, dropPct: 100 - copPct, isDemoCrowd: true };
}

export function agreementPct(verdict: Verdict, crowd: CrowdSplit): number {
  return verdict === "cop" ? crowd.copPct : crowd.dropPct;
}

export function isMinority(verdict: Verdict, crowd: CrowdSplit): boolean {
  return agreementPct(verdict, crowd) < 30;
}
