"use client";

import { useEffect, useState } from "react";
import { formatCountdown, localDateKey, msUntilLocalMidnight } from "@/lib/game/date";

export function Countdown({ today }: { today: string }) {
  const [remaining, setRemaining] = useState(() => msUntilLocalMidnight(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (localDateKey(now) !== today) window.location.reload();
      else setRemaining(msUntilLocalMidnight(now));
    }, 1000);
    return () => clearInterval(timer);
  }, [today]);

  return <span role="timer">{formatCountdown(remaining)}</span>;
}
