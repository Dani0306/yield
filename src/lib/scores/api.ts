import "server-only";

import { teamWords } from "./teams";
import { parseScore } from "@/lib/utils/bets";
import type { LiveScore } from "@/types";

// Free API Live Football Data (RapidAPI). Server-only: the key never reaches
// the browser.
// Free plan: 100 requests a month, so it's only asked once a match may have
// ended, and every answer is reused (see the cache times below).
//
// Two steps: search finds the match's id, then the status endpoint says
// whether it's over and the final score. Search can't do both: its status
// lags hours behind (a finished match still reads "not started").

const HOST = "free-api-live-football-data.p.rapidapi.com";

// A match's id never changes, so one search lasts the whole match.
const SEARCH_CACHE_SECONDS = 24 * 60 * 60;
// Short, so a finished match shows up within a minute of the next check.
const STATUS_CACHE_SECONDS = 60;

// Kick-offs further apart than this are different games.
const KICK_OFF_TOLERANCE_MS = 60 * 60_000;

type ApiMatch = {
  type: string;
  id: string;
  matchDate: string;
  homeTeamName: string;
  awayTeamName: string;
};

type ApiStatus = {
  started?: boolean;
  finished?: boolean;
  cancelled?: boolean;
  scoreStr?: string;
  reason?: { short?: string };
};

const request = async <T>(
  path: string,
  params: Record<string, string>,
  revalidate: number,
): Promise<T> => {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY is not set");

  const res = await fetch(
    `https://${HOST}/${path}?${new URLSearchParams(params)}`,
    {
      headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": key },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate, tags: ["live-scores"] },
    },
  );
  if (!res.ok) throw new Error(`Live scores API ${path} ${res.status}`);
  return (await res.json()) as T;
};

// Matches (and teams, leagues…) whose names contain `query`.
const searchMatches = async (query: string): Promise<ApiMatch[]> => {
  const body = await request<{ response?: { suggestions?: ApiMatch[] } }>(
    "football-matches-search",
    { search: query },
    SEARCH_CACHE_SECONDS,
  );
  return (body.response?.suggestions ?? []).filter((s) => s.type === "match");
};

const getMatchStatus = async (eventId: string): Promise<ApiStatus> => {
  const body = await request<{ response?: { status?: ApiStatus } }>(
    "football-get-match-status",
    { eventid: eventId },
    STATUS_CACHE_SECONDS,
  );
  return body.response?.status ?? {};
};

const shareWord = (a: Set<string>, b: Set<string>) =>
  [...a].some((word) => b.has(word));

// The API's spelling differs from yours ("Ghaz Al Shamal" vs "Ghaz Al-Shamal
// SC"), so a match is found by kick-off time plus a shared word per team.
const findMatch = (
  match: { homeTeam: string; awayTeam: string; kickOff: number },
  candidates: ApiMatch[],
) => {
  const home = teamWords(match.homeTeam);
  const away = teamWords(match.awayTeam);

  return candidates
    .map((candidate) => ({
      candidate,
      gap: Math.abs(Date.parse(candidate.matchDate) - match.kickOff),
    }))
    .filter(
      ({ candidate, gap }) =>
        gap <= KICK_OFF_TOLERANCE_MS &&
        shareWord(home, teamWords(candidate.homeTeamName)) &&
        shareWord(away, teamWords(candidate.awayTeamName)),
    )
    .sort((a, b) => a.gap - b.gap)[0]?.candidate;
};

const toLiveScore = (status: ApiStatus): LiveScore => {
  if (status.cancelled) return { state: "cancelled" };
  if (!status.started) return { state: "not_started" };
  if (!status.finished) return { state: "in_play" };

  const score = status.scoreStr ? parseScore(status.scoreStr) : null;
  if (!score) return { state: "unavailable" };

  return {
    state: "finished",
    score: score.text,
    // 1X2 bets settle on 90 minutes; a score after extra time or
    // penalties needs a look before it's used.
    afterExtraTime: /aet|pen|ap/i.test(status.reason?.short ?? ""),
  };
};

// The state (and final score) of the match these teams play at `kickOff`
// (ms). Searches by the home team and, only when that finds nothing, by the
// away team.
export const findLiveScore = async (match: {
  homeTeam: string;
  awayTeam: string;
  kickOff: number;
}): Promise<LiveScore> => {
  const found =
    findMatch(match, await searchMatches(match.homeTeam)) ??
    findMatch(match, await searchMatches(match.awayTeam));
  if (!found) return { state: "not_found" };

  return toLiveScore(await getMatchStatus(found.id));
};
