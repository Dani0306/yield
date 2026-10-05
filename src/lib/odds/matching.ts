// Finds the OddsPapi fixture for one of your model results. The two sources
// don't share an id and write team names differently ("Sportivo Barracas"
// vs "CS Barracas", "Quindio" vs "Deportes Quindio"), so a fixture matches
// when it kicks off within a few minutes of the result AND both teams share
// a meaningful word with the result's teams.

export type OddsFixture = {
  fixtureId: string;
  startTime: string;
  participant1Name: string;
  participant2Name: string;
  tournamentName?: string;
  categoryName?: string;
};

// Kick-offs further apart than this are different games.
const KICK_OFF_TOLERANCE_MS = 15 * 60_000;

// Words that say nothing about which club it is.
const FILLER = new Set([
  "fc",
  "cf",
  "sc",
  "cs",
  "cd",
  "ca",
  "ac",
  "afc",
  "afbc",
  "se",
  "club",
  "de",
  "del",
  "la",
  "el",
  "los",
  "the",
  "deportivo",
  "deportes",
  "deportiva",
  "atletico",
  "atl",
  "sportivo",
  "def",
  "defensores",
  "jrs",
  "juniors",
  "reserve",
  "reserves",
  "women",
]);

// "Atl. Tucumán" → {"tucuman"}; "Newell's Old Boys" → {"newells", "old", "boys"}.
export const teamWords = (name: string) =>
  new Set(
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/'/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((word) => word.length > 2 && !FILLER.has(word)),
  );

const shareWord = (a: Set<string>, b: Set<string>) =>
  [...a].some((word) => b.has(word));

// Reserve and women's teams play under the same club names; the model only
// rates first teams, so those fixtures never match.
const isSideTeam = (fixture: OddsFixture) =>
  /reserve|women|u\d{2}/i.test(
    `${fixture.participant1Name} ${fixture.participant2Name} ${fixture.tournamentName ?? ""}`,
  );

// The fixture for a match kicking off at `kickOff` (ms) between these teams,
// or null when none matches confidently. With several candidates, the one
// closest in time wins.
export const findFixture = (
  match: { homeTeam: string; awayTeam: string; kickOff: number },
  fixtures: OddsFixture[],
): OddsFixture | null => {
  const home = teamWords(match.homeTeam);
  const away = teamWords(match.awayTeam);
  if (home.size === 0 || away.size === 0) return null;

  const candidates = fixtures
    .filter((fixture) => !isSideTeam(fixture))
    .map((fixture) => ({
      fixture,
      gap: Math.abs(Date.parse(fixture.startTime) - match.kickOff),
    }))
    .filter(
      ({ fixture, gap }) =>
        gap <= KICK_OFF_TOLERANCE_MS &&
        shareWord(home, teamWords(fixture.participant1Name)) &&
        shareWord(away, teamWords(fixture.participant2Name)),
    )
    .sort((a, b) => a.gap - b.gap);

  return candidates[0]?.fixture ?? null;
};
