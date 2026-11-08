import { MAX_GUESS_CENTS } from "./config";
import type { GuessRecord } from "./types";

export type ParsedGuess = { ok: true; cents: number } | { ok: false; message: string };

export function parseGuess(raw: string): ParsedGuess {
  const text = raw.trim().replace(/^\$\s*/, "");
  if (text === "") return { ok: false, message: "Enter a price first." };

  const plain = /^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(text) ? text.replaceAll(",", "") : text;
  const match = /^(\d*)(?:\.(\d{1,2}))?$/.exec(plain);
  if (!match || (match[1] === "" && match[2] === undefined)) {
    return {
      ok: false,
      message: "That doesn't look like a price. Try something like 48 or 48.50.",
    };
  }

  const dollars = Number(match[1] || "0");
  const cents = dollars * 100 + Number((match[2] ?? "").padEnd(2, "0") || "0");

  if (cents <= 0) return { ok: false, message: "Nothing here is free, darling. Guess above $0." };
  if (cents > MAX_GUESS_CENTS) {
    return { ok: false, message: "Even couture stops at $100,000. Guess lower." };
  }
  return { ok: true, cents };
}

/** Within 10%, or within $2 so cheap items stay winnable. Integer maths keeps the edges exact. */
export function isWin(guessCents: number, priceCents: number): boolean {
  const diff = Math.abs(guessCents - priceCents);
  return diff * 10 <= priceCents || diff <= 200;
}

export function isClose(guessCents: number, priceCents: number): boolean {
  return Math.abs(guessCents - priceCents) * 4 <= priceCents;
}

export function assessGuess(guessCents: number, priceCents: number): GuessRecord {
  if (isWin(guessCents, priceCents)) {
    return { cents: guessCents, outcome: "win", close: false };
  }
  return {
    cents: guessCents,
    outcome: guessCents < priceCents ? "higher" : "lower",
    close: isClose(guessCents, priceCents),
  };
}

export function formatPrice(cents: number): string {
  const hasCents = cents % 100 !== 0;
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
}

/** "Higher. Close." for the screen-reader live region. */
export function describeGuess(guess: GuessRecord): string {
  if (guess.outcome === "win") return "Correct.";
  const direction = guess.outcome === "higher" ? "Higher." : "Lower.";
  return guess.close ? `${direction} Close.` : direction;
}
