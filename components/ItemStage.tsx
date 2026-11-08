"use client";

import { useEffect, useState } from "react";
import { visibleClues } from "@/lib/game/clues";
import { MAX_GUESSES } from "@/lib/game/config";
import { agreementPct, isMinority, simulateCrowd } from "@/lib/game/crowd";
import { formatDate } from "@/lib/game/date";
import { outcomeLineKind, pickHostLine, reactionLine, type HostContext } from "@/lib/game/host";
import { formatPrice, parseGuess } from "@/lib/game/price";
import type { CrowdSplit, GuessRecord, Item, ItemProgress, Tier, Verdict } from "@/lib/game/types";
import { HOST_NAME } from "@/lib/game/config";
import styles from "./game.module.css";
import { ItemImage } from "./ItemImage";

export const TIER_LABELS: Record<Tier, string> = { budget: "Budget", mid: "Mid", bougie: "Bougie" };

function GuessForm({
  guessNumber,
  autoFocus,
  onGuess,
}: {
  guessNumber: number;
  autoFocus: boolean;
  onGuess: (cents: number) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseGuess(value);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setError(null);
    setValue("");
    onGuess(parsed.cents);
  }

  return (
    <form className={styles.guessForm} onSubmit={submit} noValidate>
      <label htmlFor="guess">
        Your price guess{" "}
        <span>
          Guess {guessNumber} of {MAX_GUESSES}
        </span>
      </label>
      <div className={styles.guessRow}>
        <span className={styles.dollar} aria-hidden="true">
          $
        </span>
        <input
          id="guess"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          aria-invalid={error !== null}
          aria-describedby={error ? "guess-error" : undefined}
          onChange={(event) => setValue(event.target.value)}
        />
        <button type="submit" className={styles.primary}>
          Guess
        </button>
      </div>
      {error && (
        <p id="guess-error" role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </form>
  );
}

function GuessHistory({ guesses }: { guesses: GuessRecord[] }) {
  if (guesses.length === 0) return null;
  // Newest first, so the latest feedback sits right under the input.
  const rows = guesses.map((guess, i) => ({ guess, number: i + 1 })).reverse();
  return (
    <ol className={styles.history} aria-label="Your guesses">
      {rows.map(({ guess, number }) => (
        <li key={number} data-outcome={guess.outcome}>
          <span className={styles.historyNumber}>{number}</span>
          <span className={styles.historyPrice}>{formatPrice(guess.cents)}</span>
          <span>
            {guess.outcome === "win" ? (
              "✅ Got it"
            ) : (
              <>
                {guess.outcome === "higher" ? "⬆️ Higher" : "⬇️ Lower"}
                <span className={styles.historyHeat}>{guess.close ? "🔥 Close" : "Far"}</span>
              </>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function PriceReveal({ cents, animate }: { cents: number; animate: boolean }) {
  const [counting] = useState(() => animate && !prefersReducedMotion());
  const [shown, setShown] = useState(counting ? 0 : cents);

  useEffect(() => {
    if (!counting) return;
    const start = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / 800);
      const eased = 1 - (1 - progress) ** 3;
      setShown(progress < 1 ? Math.round((cents * eased) / 100) * 100 : cents);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [counting, cents]);

  return (
    <p className={styles.price}>
      <span aria-hidden="true">{formatPrice(shown)}</span>
      <span className="visually-hidden">{formatPrice(cents)}</span>
    </p>
  );
}

export function CrowdBar({ crowd }: { crowd: CrowdSplit }) {
  return (
    <div>
      <p className={styles.crowdLabel}>
        {crowd.copPct}% COP · {crowd.dropPct}% DROP
      </p>
      <div className={styles.crowdBar} aria-hidden="true">
        <span className={styles.crowdCop} style={{ flexGrow: crowd.copPct }} />
        <span className={styles.crowdDrop} style={{ flexGrow: crowd.dropPct }} />
      </div>
    </div>
  );
}

function VerdictPanel({
  price,
  verdict,
  crowd,
  onVote,
  readOnly,
}: {
  price: string;
  verdict: Verdict | null;
  crowd: CrowdSplit;
  onVote: (verdict: Verdict) => void;
  readOnly: boolean;
}) {
  if (verdict === null) {
    if (readOnly) return null;
    return (
      <div className={styles.verdict}>
        <h3>
          Would you cop it for <strong>{price}</strong>?
        </h3>
        <div className={styles.verdictButtons}>
          <button autoFocus className={styles.cop} onClick={() => onVote("cop")}>
            COP 🛒
          </button>
          <button className={styles.drop} onClick={() => onVote("drop")}>
            DROP 🗑️
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.verdict}>
      <p className={styles.youVoted}>
        You said <strong>{verdict.toUpperCase()}</strong>
      </p>
      <CrowdBar crowd={crowd} />
      {crowd.isDemoCrowd && <p className={styles.note}>demo crowd</p>}
      {isMinority(verdict, crowd) && (
        <p className={styles.minority}>
          Minority report 🧐 — only {agreementPct(verdict, crowd)}% agreed with you.
        </p>
      )}
    </div>
  );
}

export function ItemStage({
  item,
  progress,
  puzzleNumber,
  pool,
  animateReveal,
  autoFocusInput,
  isReview,
  isLast,
  onGuess,
  onVote,
  onNext,
}: {
  item: Item;
  progress: ItemProgress;
  puzzleNumber: number;
  pool: HostContext["pool"];
  animateReveal: boolean;
  autoFocusInput: boolean;
  isReview: boolean;
  isLast: boolean;
  onGuess: (cents: number) => void;
  onVote: (verdict: Verdict) => void;
  onNext: () => void;
}) {
  const wrong = progress.guesses.filter((guess) => guess.outcome !== "win").length;
  const crowd = simulateCrowd(item.id);
  const ctx: HostContext = { puzzleNumber, item, pool, guesses: progress.guesses.length };

  let hostLine = pickHostLine("intro", ctx);
  if (progress.status === "voting") hostLine = pickHostLine(outcomeLineKind(progress), ctx);
  if (progress.verdict) hostLine = reactionLine(progress.verdict, crowd, ctx);

  const clues = visibleClues(item, wrong);
  const price = formatPrice(item.priceCents);

  return (
    <article className={styles.stage}>
      <ItemImage item={item} compact={progress.guesses.length > 0} />

      <div className={styles.stageBody}>
        <p className={styles.kicker}>
          <span aria-hidden="true">{item.categoryEmoji}</span> {TIER_LABELS[item.tier]}
        </p>
        <h2 className={styles.itemName}>{item.name}</h2>
        <p className={styles.brand}>{item.brand}</p>

        <blockquote className={styles.host} key={progress.status}>
          “{hostLine}” <cite>— {HOST_NAME}</cite>
        </blockquote>

        {progress.status === "guessing" ? (
          <GuessForm
            guessNumber={progress.guesses.length + 1}
            autoFocus={autoFocusInput}
            onGuess={onGuess}
          />
        ) : (
          <div className={styles.reveal}>
            <p className={styles.revealLabel}>
              {progress.solved ? "The price" : "The price, since you asked five times"}
            </p>
            <PriceReveal cents={item.priceCents} animate={animateReveal} />
            <p className={styles.note}>
              Full price on {item.retailerName} (US) as of {formatDate(item.priceCheckedAt)}. Prices
              change.
            </p>
            <VerdictPanel
              price={price}
              verdict={progress.verdict}
              crowd={crowd}
              onVote={onVote}
              readOnly={isReview}
            />
            {progress.status === "done" && !isReview && (
              <button autoFocus className={styles.primaryWide} onClick={onNext}>
                {isLast ? "See your results" : "Next item"}
              </button>
            )}
          </div>
        )}

        <GuessHistory guesses={progress.guesses} />

        {progress.status === "guessing" && clues.length > 0 && (
          <dl className={styles.clues}>
            {clues.map((clue) => (
              <div key={clue.label}>
                <dt>{clue.label}</dt>
                <dd>{clue.text}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
