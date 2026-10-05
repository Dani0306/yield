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

// OddsPapi slug → your bookmaker, for the ones OddsPapi covers. BetPlay and
// Rushbet are their Colombian sites; the others are the bookmakers' main
// sites, whose prices can differ slightly from what you see in Colombia.
// Not on OddsPapi: YaJuego, Wplay, Sportium, Luckia (and Codere/Betfair
// only as their Spanish site and exchange, so they're left out).
export const ODDS_API_BOOKMAKERS: Record<string, Bookmaker> = {
  betplay: "BetPlay",
  "rushbet.co": "Rushbet",
  betsson: "Betsson",
  betano: "Betano",
  bwin: "Bwin",
  stake: "Stake",
  mozzartbet: "Mozzartbet",
};
