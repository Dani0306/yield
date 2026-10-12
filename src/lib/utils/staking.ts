// The staking rule: flat stakes. Every bet stakes the same share of the
// bankroll, whatever happened before it. Stakes are never chosen by hand.
// - The stake is a % of the bankroll, set in Settings (1% by default:
//   1.000.000 COP → 10.000 a bet). The bankroll is the budget set in the
//   profile, not the current bank, so the stake only changes when one of
//   the two settings is edited.
// - 1 unit = bankroll / 400 (1.000.000 COP → 2.500 COP), the scale profits
//   in units have always used, so a 1% stake is 4 units.
//
// Until October 2026 stakes followed progressions (×1.5 after each loss,
// back to 1 unit after a win). Those bets keep their progression and
// attempt number as history.

export const UNITS_PER_BANKROLL = 400;
// Same range as the profiles.stake_percent check constraint.
export const STAKE_PERCENT_MAX = 10;

// Money per unit, e.g. 2.500 for a 1.000.000 bankroll.
export const unitValue = (bankroll: number) => bankroll / UNITS_PER_BANKROLL;

// The stake every bet takes: `percent` % of the bankroll, in whole pesos,
// and in units (2 decimals).
export const flatStake = (bankroll: number, percent: number) => {
  const amount = Math.round((bankroll * percent) / 100);
  return {
    units: Math.round(((percent * UNITS_PER_BANKROLL) / 100) * 100) / 100,
    amount,
  };
};
