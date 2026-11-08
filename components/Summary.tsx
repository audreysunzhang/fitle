"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_GUESSES, SITE_URL } from "@/lib/game/config";
import { simulateCrowd } from "@/lib/game/crowd";
import { formatPrice } from "@/lib/game/price";
import { buildShareText } from "@/lib/game/share";
import type { DayProgress, Item } from "@/lib/game/types";
import { Countdown } from "./Countdown";
import styles from "./game.module.css";
import { CrowdBar } from "./ItemStage";

function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
}

export function Summary({
  day,
  items,
  today,
  onStats,
  onReview,
}: {
  day: DayProgress;
  items: readonly Item[];
  today: string;
  onStats: () => void;
  onReview: (index: number) => void;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const heading = useRef<HTMLHeadingElement>(null);
  const text = buildShareText(day, items, SITE_URL);

  useEffect(() => heading.current?.focus(), []);

  async function share() {
    if (isMobile() && typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <section className={styles.summary}>
      <h2 ref={heading} tabIndex={-1}>
        Today&apos;s verdicts
      </h2>
      <ul className={styles.summaryList}>
        {items.map((item, i) => {
          const progress = day.items[i];
          return (
            <li key={item.id}>
              <div className={styles.summaryTop}>
                <div>
                  <p className={styles.kicker}>
                    <span aria-hidden="true">{item.categoryEmoji}</span> {item.brand}
                  </p>
                  <button className={styles.summaryName} onClick={() => onReview(i)}>
                    {item.name}
                  </button>
                </div>
                <p className={styles.summaryPrice}>{formatPrice(item.priceCents)}</p>
              </div>
              <p className={styles.summaryMeta}>
                {progress.solved
                  ? `${progress.guesses.length}/${MAX_GUESSES}`
                  : `❌ X/${MAX_GUESSES}`}
                {" · You said "}
                <strong>{progress.verdict?.toUpperCase()}</strong>
              </p>
              <CrowdBar crowd={simulateCrowd(item.id)} />
            </li>
          );
        })}
      </ul>
      <p className={styles.note}>demo crowd</p>

      <div className={styles.summaryActions}>
        <button className={styles.primaryWide} onClick={share}>
          Share
        </button>
        <button className={styles.secondaryWide} onClick={onStats}>
          Stats
        </button>
      </div>
      <p role="status" className={styles.note}>
        {status === "copied" && "Copied. Go start something in the group chat."}
      </p>
      {status === "failed" && (
        <label className={styles.shareFallback}>
          Your browser blocked copying. Here&apos;s your card:
          <textarea readOnly rows={5} value={text} />
        </label>
      )}

      <p className={styles.next}>
        Next drop in <Countdown today={today} />
      </p>
    </section>
  );
}
