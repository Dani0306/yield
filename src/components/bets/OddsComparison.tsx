"use client";

import { useTransition, useState } from "react";
import { refreshResultOdds } from "@/actions/odds/refreshResultOdds";
import { formatShortDate } from "@/lib/utils/fn";
import type { ResultOddsSummary } from "@/types";

type OddsComparisonProps = {
  resultId: number;
  initial: ResultOddsSummary;
  // The bookmaker currently chosen in the form, to highlight its row.
  selectedBookmaker: string;
  onPick: (bookmaker: string, drawOdds: number) => void;
};

// "just now", "12 min ago", "3 h ago", "2 days ago".
const ago = (iso: string) => {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

// Each bookmaker's draw price for the match, best first. Picking a row fills
// the bookmaker and odds in the bet form.
const OddsComparison = ({
  resultId,
  initial,
  selectedBookmaker,
  onPick,
}: OddsComparisonProps) => {
  const [summary, setSummary] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = () =>
    startTransition(async () => {
      setError(null);
      const { odds, error } = await refreshResultOdds(resultId);
      if (error || !odds) return setError(error);
      setSummary(odds);
    });

  const { odds, matched, checkedAt } = summary;
  const best = odds[0]?.draw_odds;

  const emptyMessage = !checkedAt
    ? "Odds haven't been collected for this match yet."
    : !matched
      ? "This match wasn't found on the odds provider."
      : "No bookmaker offers a draw price for this match yet.";

  return (
    <section
      aria-label="Draw odds by bookmaker"
      className="flex flex-col gap-2"
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-xs font-normal text-gray-800">
          Draw odds by bookmaker
        </span>
        <span className="flex items-baseline gap-2 text-xs text-gray-500">
          {checkedAt && <span>Updated {ago(checkedAt)}</span>}
          <button
            type="button"
            onClick={refresh}
            disabled={isPending}
            className="cursor-pointer text-black underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {isPending ? "Refreshing…" : "Refresh"}
          </button>
        </span>
      </div>

      {odds.length === 0 ? (
        <p className="border-y border-gray-200 py-3 text-sm text-gray-500">
          {emptyMessage}
        </p>
      ) : (
        // One chip per bookmaker, scrolling sideways when they don't fit.
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {odds.map((row) => {
            const isBest = row.draw_odds === best;
            const isSelected = row.bookmaker === selectedBookmaker;
            return (
              <li key={row.bookmaker} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onPick(row.bookmaker, row.draw_odds)}
                  aria-pressed={isSelected}
                  title={
                    row.price_changed_at
                      ? `Price moved ${formatShortDate(row.price_changed_at)}`
                      : undefined
                  }
                  className={`flex cursor-pointer items-baseline gap-2 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : `text-gray-700 border-black`
                  }`}
                >
                  <span>
                    {row.bookmaker}
                    {/* The best price is marked in words, not only by its border. */}
                    {isBest && <span className="sr-only"> (best price)</span>}
                  </span>
                  <span
                    className={`font-mono font-medium tabular-nums ${isSelected ? "text-white" : "text-black"}`}
                  >
                    {row.draw_odds.toFixed(2)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="text-xs text-red-700">{error}</p>}
    </section>
  );
};

export default OddsComparison;
