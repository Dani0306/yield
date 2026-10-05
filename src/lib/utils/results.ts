import type { ModelResult } from "@/types";
import { kickOff } from "./fn";

// How long a selected match blocks the schedule: 1 h 59 min from kick-off.
export const MATCH_WINDOW_MS = (60 + 59) * 60 * 1000;

// Kick-off as a timestamp. Times are Colombian (UTC−5 all year).
export const kickOffTime = (r: ModelResult) =>
  Date.parse(`${kickOff(r)}:00-05:00`);

// The selected match that blocks this result, if any: one whose kick-off is
// within 1:59 of this one's, before or after. That means this match would
// still be running when the selected one starts, or would start before the
// selected one finishes. Selected results are never blocked.
export const findClash = (
  result: ModelResult,
  selected: ModelResult[],
): ModelResult | null => {
  if (result.added) return null;
  const start = kickOffTime(result);
  return (
    selected.find(
      (s) =>
        s.id !== result.id &&
        Math.abs(kickOffTime(s) - start) <= MATCH_WINDOW_MS,
    ) ?? null
  );
};
