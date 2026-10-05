// Bookmakers a bet can be placed with (the options in the new bet form).
// Add or remove names here; the database only requires a non-empty name.
export const BOOKMAKERS = [
  "BetPlay",
  "Betsson",
  "YaJuego",
  "Wplay",
  "Codere",
  "Sportium",
  "Bwin",
  "Stake",
  "Betano",
  "Rushbet",
  "Betfair",
  "Luckia",
  "Mozzartbet",
] as const;

export type Bookmaker = (typeof BOOKMAKERS)[number];
