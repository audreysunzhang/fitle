import { STORAGE_KEY } from "./config";
import type { AppState, DayProgress } from "./types";

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function newPlayerId(): string {
  const c = globalThis.crypto;
  // randomUUID only exists in secure contexts, which a phone on a dev LAN URL isn't.
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isDay(value: unknown): value is DayProgress {
  const day = value as DayProgress;
  return (
    typeof day === "object" &&
    day !== null &&
    typeof day.date === "string" &&
    typeof day.puzzleNumber === "number" &&
    typeof day.currentIndex === "number" &&
    Array.isArray(day.items) &&
    day.items.length === 3 &&
    day.items.every(
      (item) =>
        typeof item?.priceCents === "number" &&
        Array.isArray(item.guesses) &&
        ["guessing", "voting", "done"].includes(item.status) &&
        (item.status === "guessing" || item.guesses.length > 0),
    )
  );
}

function isAppState(value: unknown): value is AppState {
  const state = value as AppState;
  return (
    typeof state === "object" &&
    state !== null &&
    typeof state.playerId === "string" &&
    typeof state.seenHowTo === "boolean" &&
    typeof state.days === "object" &&
    state.days !== null &&
    Object.values(state.days).every(isDay)
  );
}

function freshState(): AppState {
  return { playerId: newPlayerId(), seenHowTo: false, days: {} };
}

export function saveState(storage: StorageLike, state: AppState): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Full or blocked storage shouldn't stop the game; progress just won't persist.
  }
}

/** Missing or corrupted data resets to a fresh state rather than crashing. */
export function loadState(storage: StorageLike): AppState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (isAppState(parsed)) return parsed;
    }
  } catch {
    // Fall through to a reset.
  }
  const state = freshState();
  saveState(storage, state);
  return state;
}
