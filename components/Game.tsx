"use client";

import { useEffect, useState } from "react";
import lines from "@/content/host/lines.json";
import { agreementPct, simulateCrowd } from "@/lib/game/crowd";
import { formatDate, localDateKey, puzzleNumber } from "@/lib/game/date";
import { MAX_GUESSES } from "@/lib/game/config";
import type { HostPool } from "@/lib/game/host";
import { describeGuess, formatPrice } from "@/lib/game/price";
import {
  advance,
  castVote,
  createDay,
  resumeDay,
  submitGuess,
  SUMMARY_INDEX,
} from "@/lib/game/reducer";
import { loadState, saveState, type StorageLike } from "@/lib/game/storage";
import type { AppState, DailyPuzzle, DayProgress, Verdict } from "@/lib/game/types";
import styles from "./game.module.css";
import { HowToModal } from "./HowToModal";
import { ItemStage, TIER_LABELS } from "./ItemStage";
import { StatsModal } from "./StatsModal";
import { Summary } from "./Summary";

const pool = lines as HostPool;

const memory = new Map<string, string>();
const memoryStorage: StorageLike = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => void memory.set(key, value),
};

function getStorage(): StorageLike {
  try {
    return window.localStorage ?? memoryStorage;
  } catch {
    return memoryStorage;
  }
}

type Screen = "loading" | "error" | "nodrop" | "ready";
type Dialog = "howto" | "stats" | null;

export function Game() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [app, setApp] = useState<AppState | null>(null);
  const [today, setToday] = useState("");
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [animateReveal, setAnimateReveal] = useState(false);
  const [justAdvanced, setJustAdvanced] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const date = localDateKey(new Date());
      const stored = loadState(getStorage());
      let response: Response;
      try {
        response = await fetch(`/puzzles/${date}`);
      } catch {
        if (!cancelled) setScreen("error");
        return;
      }
      if (cancelled) return;

      setToday(date);
      if (!stored.seenHowTo) setDialog("howto");

      if (response.status === 404) {
        setApp(stored);
        setScreen("nodrop");
        return;
      }
      if (!response.ok) {
        setScreen("error");
        return;
      }

      const loaded = (await response.json()) as DailyPuzzle;
      if (cancelled) return;
      const previous = stored.days[date];
      const matches = previous?.items.every((item, i) => item.itemId === loaded.items[i].id);
      const day = previous && matches ? resumeDay(previous) : createDay(loaded, puzzleNumber(date));
      const next = { ...stored, days: { ...stored.days, [date]: day } };
      saveState(getStorage(), next);
      setApp(next);
      setPuzzle(loaded);
      setScreen("ready");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const day = app?.days[today];

  function commit(next: AppState) {
    saveState(getStorage(), next);
    setApp(next);
  }

  function commitDay(nextDay: DayProgress) {
    if (app) commit({ ...app, days: { ...app.days, [today]: nextDay } });
  }

  function closeDialog() {
    if (app && !app.seenHowTo) commit({ ...app, seenHowTo: true });
    setDialog(null);
  }

  function handleGuess(cents: number) {
    if (!day || !puzzle) return;
    const index = day.currentIndex;
    const nextDay = submitGuess(day, cents);
    const progress = nextDay.items[index];
    const guess = progress.guesses[progress.guesses.length - 1];
    const price = formatPrice(puzzle.items[index].priceCents);
    const prefix = `Guess ${progress.guesses.length}: ${describeGuess(guess)}`;
    setJustAdvanced(false);

    if (progress.status === "voting") {
      setAnimateReveal(true);
      setAnnouncement(`${prefix} The price is ${price}. Cop or drop?`);
    } else {
      const left = MAX_GUESSES - progress.guesses.length;
      setAnnouncement(`${prefix} ${left} ${left === 1 ? "guess" : "guesses"} left.`);
    }
    commitDay(nextDay);
  }

  function handleVote(verdict: Verdict) {
    if (!day || !puzzle) return;
    const crowd = simulateCrowd(puzzle.items[day.currentIndex].id);
    setAnnouncement(`You said ${verdict}. ${agreementPct(verdict, crowd)}% agreed with you.`);
    commitDay(castVote(day, verdict));
  }

  function handleNext() {
    if (!day) return;
    setAnimateReveal(false);
    setJustAdvanced(true);
    commitDay(advance(day));
  }

  const dateLabel = today ? formatDate(today) : "";
  const issue = screen === "ready" && day ? `No. ${day.puzzleNumber} · ${dateLabel}` : dateLabel;
  const showing = reviewIndex ?? day?.currentIndex ?? 0;

  return (
    <>
      <header className={styles.masthead}>
        <p className={styles.issue}>{issue || " "}</p>
        <h1>
          Cop <em>or</em> Drop
        </h1>
        <nav className={styles.mastNav} aria-label="Game menu">
          <button className={styles.textButton} onClick={() => setDialog("howto")}>
            How to play
          </button>
          <button className={styles.textButton} onClick={() => setDialog("stats")} disabled={!app}>
            Stats
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <div className="visually-hidden" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>

        {screen === "loading" && <p className={styles.status}>Steaming today&apos;s drop…</p>}

        {screen === "error" && (
          <div className={styles.status}>
            <h2>The courier got lost.</h2>
            <p>We couldn&apos;t fetch today&apos;s drop.</p>
            <button className={styles.primary} onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        )}

        {screen === "nodrop" && (
          <div className={styles.status}>
            <h2>No drop today 💅</h2>
            <p>The rails are empty. An archive of past drops is on its way.</p>
          </div>
        )}

        {screen === "ready" && day && puzzle && (
          <>
            <ol className={styles.steps} aria-label="Progress">
              {puzzle.items.map((item, i) => {
                const done = day.items[i].status === "done";
                const active = showing === i;
                return (
                  <li key={item.id}>
                    <button
                      className={styles.step}
                      data-active={active}
                      data-done={done}
                      disabled={!done && i !== day.currentIndex}
                      aria-current={active ? "step" : undefined}
                      onClick={() => setReviewIndex(i === day.currentIndex ? null : i)}
                    >
                      <span aria-hidden="true">{item.categoryEmoji}</span> {TIER_LABELS[item.tier]}
                      {done && <span className="visually-hidden"> (finished)</span>}
                    </button>
                  </li>
                );
              })}
            </ol>

            {showing === SUMMARY_INDEX ? (
              <Summary
                day={day}
                items={puzzle.items}
                today={today}
                onStats={() => setDialog("stats")}
                onReview={setReviewIndex}
              />
            ) : (
              <ItemStage
                key={showing}
                item={puzzle.items[showing]}
                progress={day.items[showing]}
                puzzleNumber={day.puzzleNumber}
                pool={pool}
                animateReveal={animateReveal && reviewIndex === null}
                autoFocusInput={justAdvanced}
                isReview={reviewIndex !== null && reviewIndex !== day.currentIndex}
                isLast={showing === 2}
                onGuess={handleGuess}
                onVote={handleVote}
                onNext={handleNext}
              />
            )}

            {reviewIndex !== null && reviewIndex !== day.currentIndex && (
              <button className={styles.textButton} onClick={() => setReviewIndex(null)}>
                ← Back to {day.currentIndex === SUMMARY_INDEX ? "results" : "today's item"}
              </button>
            )}
          </>
        )}
      </main>

      {dialog === "howto" && <HowToModal onClose={closeDialog} />}
      {dialog === "stats" && app && (
        <StatsModal days={app.days} today={today} onClose={closeDialog} />
      )}
    </>
  );
}
