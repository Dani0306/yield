import "server-only";

import { teamWords } from "@/lib/odds/matching";
import { parseScore } from "@/lib/utils/bets";
import type { LiveScore } from "@/types";

// Free API Live Football Data (RapidAPI). Server-only: the key never reaches
// the browser.
// Free plan: 100 requests a month, so one search request answers everything
// (match, status and score) and its answer is reused for a few minutes.

const HOST = "free-api-live-football-data.p.rapidapi.com";
const CACHE_SECONDS = 3 * 60;

// Kick-offs further apart than this are different games.
const KICK_OFF_TOLERANCE_MS = 60 * 60_000;

type ApiMatch = {
  type: string;
  id: string;
  matchDate: string;
  homeTeamName: string;
  awayTeamName: string;
  status?: {
    started?: boolean;
    finished?: boolean;
    cancelled?: boolean;
    scoreStr?: string;
    liveTime?: { short?: string };
    reason?: { short?: string };
  };
};

// Matches (and teams, leagues…) whose names contain `query`.
const searchMatches = async (query: string): Promise<ApiMatch[]> => {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY is not set");

  const res = await fetch(
    `https://${HOST}/football-matches-search?${new URLSearchParams({ search: query })}`,
    {
      headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": key },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: CACHE_SECONDS, tags: ["live-scores"] },
    },
  );
  if (!res.ok) throw new Error(`Live scores API ${res.status}`);

  const body = (await res.json()) as {
    response?: { suggestions?: ApiMatch[] };
  };
  return (body.response?.suggestions ?? []).filter((s) => s.type === "match");
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

const toLiveScore = ({ status = {} }: ApiMatch): LiveScore => {
  if (status.cancelled) return { state: "cancelled" };
  if (!status.started) return { state: "not_started" };

  const score = status.scoreStr ? parseScore(status.scoreStr) : null;
  if (!score) return { state: "unavailable" };

  if (status.finished)
    return {
      state: "finished",
      score: score.text,
      // 1X2 bets settle on 90 minutes; a score after extra time or
      // penalties needs a look before it's used.
      afterExtraTime: /aet|pen|ap/i.test(status.reason?.short ?? ""),
    };

  // The clock comes with invisible direction marks ("63‎’‎").
  const minute = status.liveTime?.short?.replace(/[‎‏]/g, "");
  return { state: "live", score: score.text, minute: minute || null };
};

// The live state of the match these teams play at `kickOff` (ms). Searches
// by the home team and, only when that finds nothing, by the away team.
export const findLiveScore = async (match: {
  homeTeam: string;
  awayTeam: string;
  kickOff: number;
}): Promise<LiveScore> => {
  const found =
    findMatch(match, await searchMatches(match.homeTeam)) ??
    findMatch(match, await searchMatches(match.awayTeam));

  return found ? toLiveScore(found) : { state: "not_found" };
};
