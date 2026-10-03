// The staking rule. Stakes are never chosen by hand; they follow from how
// many bets the progression has lost so far:
// - 1 unit = bankroll / 400 (1.000.000 COP → 2.500 COP). The bankroll is the
//   budget set in the profile, so the unit only changes when that's edited.
// - The first bet stakes 1 unit; each lost bet raises the next stake 1.5×:
//   1, 1.5, 2.25, 3.375… units. A void (cancelled) bet doesn't count, so the
//   next bet repeats the same stake.
// - A win ends the progression; the next one starts again at 1 unit.

export const UNITS_PER_BANKROLL = 400;
export const STAKE_MULTIPLIER = 1.5;

// Money per unit, e.g. 2.500 for a 1.000.000 bankroll.
export const unitValue = (bankroll: number) => bankroll / UNITS_PER_BANKROLL;

// Stake for the next bet after `losses` lost bets in the progression.
// Units are rounded to 2 decimals (3.375 → 3.38) and the amount to whole
// pesos (8.437,50 → 8.438), both from the exact stake so rounding never
// builds up from one bet to the next.
export const stakeAfterLosses = (losses: number, bankroll: number) => {
  const stake = STAKE_MULTIPLIER ** losses;
  return {
    units: Math.round(stake * 100) / 100,
    amount: Math.round(stake * unitValue(bankroll)),
  };
};
