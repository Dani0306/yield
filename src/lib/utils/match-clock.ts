// A match's clock worked out from its kick-off time alone, with no live data:
// 45 minutes, a 15-minute half-time, 45 more. Real matches add stoppage
// time, so the minute is an estimate.

const MINUTE_MS = 60_000;
const HALF = 45;
const HALF_TIME_BREAK = 15;

// Minutes after kick-off when the 90 are up (half-time included). From here
// the match can end any moment, so this is when the final score is looked up.
export const FULL_TIME_AFTER_MINUTES = 2 * HALF + HALF_TIME_BREAK;

export type MatchPhase =
  | { phase: "not_started" }
  | { phase: "first_half" | "second_half"; minute: number }
  | { phase: "half_time" }
  | { phase: "extra_time" };

export const matchPhase = (kickOff: number, now: number): MatchPhase => {
  const elapsed = (now - kickOff) / MINUTE_MS;
  if (elapsed < 0) return { phase: "not_started" };
  if (elapsed < HALF)
    return { phase: "first_half", minute: Math.floor(elapsed) + 1 };
  if (elapsed < HALF + HALF_TIME_BREAK) return { phase: "half_time" };
  if (elapsed < FULL_TIME_AFTER_MINUTES)
    return {
      phase: "second_half",
      minute: Math.floor(elapsed - HALF_TIME_BREAK) + 1,
    };
  return { phase: "extra_time" };
};

// "23’", "Half-time", "Extra time".
export const matchPhaseLabel = (phase: MatchPhase) => {
  switch (phase.phase) {
    case "not_started":
      return "Not started";
    case "first_half":
    case "second_half":
      return `${phase.minute}’`;
    case "half_time":
      return "Half-time";
    case "extra_time":
      return "Extra time";
  }
};
