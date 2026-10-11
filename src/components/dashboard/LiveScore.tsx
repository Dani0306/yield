"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "../providers/ModalProvider";
import { matchPhase, matchPhaseLabel } from "@/lib/utils/match-clock";
import type { Bet, LiveScore as LiveScoreData } from "@/types";

// Once the 90 are up, ask the server for the final score this often, and
// give up after this long past kick-off (a reload still asks again).
const CHECK_EVERY_MS = 3 * 60_000;
const STOP_CHECKING_AFTER_MS = 150 * 60_000;

// "1-0" → "1 – 0".
const scoreText = (score: string) => score.replace("-", " – ");

const buttonClass =
  "shrink-0 cursor-pointer rounded-md border border-black px-3 py-1.5 text-xs text-black transition-colors hover:bg-gray-100";

// The current bet's match once it kicks off. While it runs: the minute,
// worked out from the kick-off time (no live data). After the 90: "Extra
// time" until the scores API says it's over, then the final score with a
// shortcut to settle.
const LiveScore = ({ bet, live }: { bet: Bet; live: LiveScoreData | null }) => {
  const router = useRouter();
  const { openModal } = useModal();
  // null until mounted, so server and browser render the same.
  const [now, setNow] = useState<number | null>(null);

  const kickOff = Date.parse(bet.match_date);
  const phase = now === null ? null : matchPhase(kickOff, now);
  const isOver = live?.state === "finished" || live?.state === "cancelled";
  const isWaiting =
    phase?.phase === "extra_time" &&
    !isOver &&
    live?.state !== "not_found";

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 10_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  // After the 90: check now, then every few minutes until the final score.
  // The server reuses the API answer for 3 minutes, so this stays cheap.
  useEffect(() => {
    if (!isWaiting) return;
    const check = () => {
      if (Date.now() - kickOff < STOP_CHECKING_AFTER_MS) router.refresh();
    };
    check();
    const id = setInterval(check, CHECK_EVERY_MS);
    return () => clearInterval(id);
  }, [isWaiting, kickOff, router]);

  if (!live || !phase) return null;
  if (!isOver && phase.phase === "not_started") return null;

  const settleButton = (
    <button
      type="button"
      onClick={() => openModal("bet", { bet, initialStep: "settle" })}
      className={buttonClass}
    >
      Settle bet
    </button>
  );

  if (live.state === "finished" || live.state === "cancelled")
    return (
      <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs text-gray-500">
            {live.state === "cancelled"
              ? "Cancelled"
              : live.afterExtraTime
                ? "Full time · after extra time"
                : "Full time"}
          </span>
          {live.state === "finished" && (
            <span className="font-mono text-3xl leading-none tracking-tight text-black tabular-nums sm:text-4xl">
              {scoreText(live.score)}
            </span>
          )}
        </div>
        {settleButton}
      </div>
    );

  // The API couldn't find the match, so the score has to be typed.
  const notFound = phase.phase === "extra_time" && live.state === "not_found";

  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-black" />
          In play
        </span>
        <span className="font-mono text-3xl leading-none tracking-tight text-black tabular-nums sm:text-4xl">
          {matchPhaseLabel(phase)}
        </span>
        <span className="text-xs text-gray-500">
          {notFound
            ? "Final score not found: settle it by hand"
            : "The score shows when the match ends"}
        </span>
      </div>
      {notFound && settleButton}
    </div>
  );
};

export default LiveScore;
