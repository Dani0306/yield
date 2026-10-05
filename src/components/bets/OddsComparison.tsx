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
        <ul className="flex flex-col border-t border-gray-200">
          {odds.map((row) => {
            const isBest = row.draw_odds === best;
            const isSelected = row.bookmaker === selectedBookmaker;
            return (
              <li key={row.bookmaker} className="border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => onPick(row.bookmaker, row.draw_odds)}
                  aria-pressed={isSelected}
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 px-2 py-2 text-left transition-colors hover:bg-gray-50 ${isSelected ? "bg-gray-100 hover:bg-gray-100" : ""}`}
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span
                      className={`truncate text-sm ${isBest ? "font-medium text-black" : "text-gray-800"}`}
                    >
                      {row.bookmaker}
                    </span>
                    {isBest && (
                      <span className="text-[11px] tracking-wide text-black uppercase">
                        Best
                      </span>
                    )}
                    {row.price_changed_at && (
                      <span className="hidden text-xs text-gray-400 sm:inline">
                        moved {formatShortDate(row.price_changed_at)}
                      </span>
                    )}
                  </span>
                  <span
                    className={`font-mono text-sm ${isBest ? "font-medium text-black" : "text-gray-600"}`}
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
