"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "../providers/ModalProvider";
import type { Bet, LiveScore as LiveScoreData } from "@/types";

// "1-0" → "1 – 0".
const scoreText = (score: string) => score.replace("-", " – ");

const labels: Record<LiveScoreData["state"], string> = {
  not_started: "Not started",
  live: "Live",
  finished: "Full time",
  cancelled: "Cancelled",
  not_found: "Live score not found for this match",
  unavailable: "Live score unavailable right now",
};

const buttonClass =
  "shrink-0 cursor-pointer rounded-md border border-black px-3 py-1.5 text-xs text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50";

// The current bet's match once it has kicked off: the score while it runs,
// then the final score with a shortcut to settle. Refreshing asks the server
// again; the API answer is reused for 3 minutes to save the monthly quota.
const LiveScore = ({ bet, live }: { bet: Bet; live: LiveScoreData | null }) => {
  const router = useRouter();
  const { openModal } = useModal();
  const [isRefreshing, startRefresh] = useTransition();

  if (!live || live.state === "not_started") return null;

  const isOver = live.state === "finished" || live.state === "cancelled";
  const label =
    live.state === "live" && live.minute
      ? `Live · ${live.minute}`
      : live.state === "finished" && live.afterExtraTime
        ? "Full time · after extra time"
        : labels[live.state];

  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="flex items-center gap-2 text-xs text-gray-500">
          {live.state === "live" && (
            <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-black" />
          )}
          {label}
        </span>
        {"score" in live && (
          <span className="font-mono text-3xl leading-none tracking-tight text-black tabular-nums sm:text-4xl">
            {scoreText(live.score)}
          </span>
        )}
      </div>

      {isOver ? (
        <button
          type="button"
          onClick={() => openModal("bet", { bet, initialStep: "settle" })}
          className={buttonClass}
        >
          Settle bet
        </button>
      ) : (
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className={buttonClass}
        >
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      )}
    </div>
  );
};

export default LiveScore;
