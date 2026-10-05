import "server-only";

import type { OddsFixture } from "@/lib/odds/matching";

// OddsPapi requests. Server-only: the key never reaches the browser.
// Free tier: 250 requests a month, so fixtures are cached and odds are only
// fetched for results you select (or refresh).

const BASE_URL = "https://api.oddspapi.io/v4/";
// Cloudflare in front of the API rejects some default client signatures.
const HEADERS = { "User-Agent": "yield-app/1.0", Accept: "application/json" };

// Soccer, and the "Full Time Result" (1X2) market with its outcome ids.
const SOCCER = 10;
const MARKET_1X2 = "101";
const OUTCOME = { home: "101", draw: "102", away: "103" } as const;

// A day's fixture list barely changes: reuse it for 6 hours, so selecting
// several results on the same day costs one fixtures request.
const FIXTURES_CACHE_SECONDS = 6 * 60 * 60;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async <T>(
  path: string,
  params: Record<string, string | number>,
  cache: RequestInit & { next?: { revalidate?: number; tags?: string[] } },
): Promise<T> => {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error("ODDS_API_KEY is not set");

  const query = new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(params).map(([name, value]) => [name, String(value)]),
    ),
    apiKey: key,
  });
  const url = `${BASE_URL}${path}?${query}`;

  // The API enforces a short cooldown between calls; one retry covers it.
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      ...cache,
      headers: HEADERS,
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 429 && attempt === 0) {
      await wait(2_100);
      continue;
    }
    if (!res.ok) throw new Error(`Odds API ${path} ${res.status}`);
    return (await res.json()) as T;
  }
  throw new Error(`Odds API ${path} is rate limited`);
};

// Every soccer fixture between two ISO times (under 10 days apart).
export const getFixtures = (from: string, to: string) =>
  request<OddsFixture[]>(
    "fixtures",
    { sportId: SOCCER, from, to },
    { next: { revalidate: FIXTURES_CACHE_SECONDS, tags: ["odds-fixtures"] } },
  );

// The fixtures for a Colombian calendar day ("2026-10-05" runs from 05:00 UTC
// to 05:00 UTC the next day).
export const getFixturesForDay = (date: string) => {
  const from = new Date(`${date}T05:00:00Z`);
  const to = new Date(from.getTime() + 24 * 60 * 60_000);
  return getFixtures(from.toISOString(), to.toISOString());
};

type ApiPrice = { price: number; active: boolean; changedAt?: string | null };
type ApiOdds = {
  bookmakerOdds?: Record<
    string,
    {
      bookmakerIsActive?: boolean;
      suspended?: boolean;
      markets?: Record<
        string,
        {
          marketActive?: boolean;
          outcomes?: Record<string, { players?: Record<string, ApiPrice> }>;
        }
      >;
    }
  >;
};

export type BookmakerPrices = {
  slug: string;
  home: number | null;
  draw: number;
  away: number | null;
  changedAt: string | null;
};

// The 1X2 prices each bookmaker offers for one fixture. Bookmakers without
// an active draw price are left out. Always fresh (never cached).
export const getMatchOdds = async (
  fixtureId: string,
  bookmakers: string[],
): Promise<BookmakerPrices[]> => {
  const data = await request<ApiOdds>(
    "odds",
    { fixtureId, bookmakers: bookmakers.join(",") },
    { cache: "no-store" },
  );

  const prices: BookmakerPrices[] = [];
  for (const [slug, book] of Object.entries(data.bookmakerOdds ?? {})) {
    if (book.bookmakerIsActive === false || book.suspended) continue;
    const market = book.markets?.[MARKET_1X2];
    if (!market || market.marketActive === false) continue;

    const price = (outcome: string) => {
      const p = market.outcomes?.[outcome]?.players?.["0"];
      return p && p.active !== false && p.price > 1 ? p : null;
    };
    const draw = price(OUTCOME.draw);
    if (!draw) continue;

    prices.push({
      slug,
      home: price(OUTCOME.home)?.price ?? null,
      draw: draw.price,
      away: price(OUTCOME.away)?.price ?? null,
      changedAt: draw.changedAt ?? null,
    });
  }
  return prices;
};
