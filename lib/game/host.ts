import { agreementPct, isMinority } from "./crowd";
import { hash } from "./hash";
import { formatPrice } from "./price";
import type { CrowdSplit, HostLineKind, Item, ItemProgress, Verdict } from "./types";

export type HostPool = Record<HostLineKind, string[]>;

export interface HostContext {
  puzzleNumber: number;
  item: Item;
  pool: HostPool;
  guesses?: number;
  vars?: Record<string, string>;
}

export function pickHostLine(kind: HostLineKind, ctx: HostContext): string {
  const { item, pool, puzzleNumber } = ctx;
  const options = pool[kind];
  const template =
    item.host?.[kind] ?? options[hash(`${puzzleNumber}:${item.id}:${kind}`) % options.length];

  const vars: Record<string, string> = {
    brand: item.brand,
    item: item.name,
    price: formatPrice(item.priceCents),
    guesses: String(ctx.guesses ?? 0),
    ...ctx.vars,
  };
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => vars[name] ?? whole);
}

export function outcomeLineKind(progress: ItemProgress): HostLineKind {
  if (!progress.solved) return "lose";
  return progress.guesses.length === 1 ? "firstGuessWin" : "win";
}

export function reactionLine(verdict: Verdict, crowd: CrowdSplit, ctx: HostContext): string {
  if (isMinority(verdict, crowd)) {
    return pickHostLine("minorityReaction", {
      ...ctx,
      vars: {
        voted: verdict === "cop" ? "copped" : "dropped",
        otherVoted: verdict === "cop" ? "dropped" : "copped",
        otherPct: String(100 - agreementPct(verdict, crowd)),
      },
    });
  }
  return pickHostLine(verdict === "cop" ? "copReaction" : "dropReaction", ctx);
}
