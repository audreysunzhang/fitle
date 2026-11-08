import { describe, expect, it } from "vitest";
import { createDay, submitGuess } from "@/lib/game/reducer";
import { loadState, saveState, type StorageLike } from "@/lib/game/storage";
import { makePuzzle } from "./fixtures";

const KEY = "copordrop:v1";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage: StorageLike = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
  return { storage, data };
}

describe("storage", () => {
  it("creates and persists a player id under the versioned key", () => {
    const { storage, data } = fakeStorage();
    const state = loadState(storage);
    expect(state.playerId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.parse(data.get(KEY)!).playerId).toBe(state.playerId);
    expect(loadState(storage).playerId).toBe(state.playerId);
  });

  it.each([
    ["invalid JSON", "{nope"],
    ["the wrong shape", '{"playerId":5}'],
    ["null", "null"],
    ["a malformed day", '{"playerId":"a","seenHowTo":true,"days":{"x":{"date":"x"}}}'],
  ])("recovers from %s", (_label, raw) => {
    const { storage } = fakeStorage({ [KEY]: raw });
    expect(loadState(storage)).toMatchObject({ seenHowTo: false, days: {} });
  });

  it("resumes mid-game exactly", () => {
    const { storage } = fakeStorage();
    const state = loadState(storage);
    const day = submitGuess(createDay(makePuzzle(), 1), 100);
    saveState(storage, { ...state, days: { [day.date]: day } });
    expect(loadState(storage).days[day.date]).toEqual(day);
  });

  it("survives storage that throws", () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadState(storage).days).toEqual({});
  });
});
