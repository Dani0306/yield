import "server-only";

import type { createClient } from "@/lib/supabase/server";
import { getFixturesForDay, getMatchOdds } from "./getMatchOdds";
import { findFixture } from "@/lib/odds/matching";
import { kickOffTime } from "@/lib/utils/results";
import { ODDS_API_BOOKMAKERS } from "@/lib/data/bookmakers";
import type { ModelResult, ResultOddsSummary } from "@/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Finds the result's OddsPapi fixture (once; it's remembered after that),
// fetches every covered bookmaker's prices and stores them, replacing the
// previous ones. Costs one odds request, plus one fixtures request the first
// time a day (the fixture list is cached).
export const collectResultOdds = async (
  supabase: Supabase,
  result: ModelResult,
): Promise<ResultOddsSummary> => {
  const checkedAt = new Date().toISOString();

  let fixtureId = result.odds_fixture_id;
  if (!fixtureId) {
    const fixtures = await getFixturesForDay(result.match_date);
    fixtureId =
      findFixture(
        {
          homeTeam: result.home_team,
          awayTeam: result.away_team,
          kickOff: kickOffTime(result),
        },
        fixtures,
      )?.fixtureId ?? null;
  }

  const prices = fixtureId
    ? await getMatchOdds(fixtureId, Object.keys(ODDS_API_BOOKMAKERS))
    : [];

  const rows = prices
    .filter((p) => ODDS_API_BOOKMAKERS[p.slug])
    .map((p) => ({
      model_result_id: result.id,
      bookmaker: ODDS_API_BOOKMAKERS[p.slug],
      home_odds: p.home,
      draw_odds: p.draw,
      away_odds: p.away,
      price_changed_at: p.changedAt,
      fetched_at: checkedAt,
    }));

  // Replace the stored prices: bookmakers that stopped offering the match
  // disappear instead of showing stale numbers.
  const { error: deleteError } = await supabase
    .from("result_odds")
    .delete()
    .eq("model_result_id", result.id);
  if (deleteError) throw new Error("Couldn't update the stored odds");

  let saved: ResultOddsSummary["odds"] = [];
  if (rows.length > 0) {
    const { data, error } = await supabase
      .from("result_odds")
      .insert(rows)
      .select("*");
    if (error) throw new Error("Couldn't save the odds");
    saved = data;
  }

  await supabase
    .from("model_results")
    .update({ odds_fixture_id: fixtureId, odds_checked_at: checkedAt })
    .eq("id", result.id);

  return {
    checkedAt,
    matched: Boolean(fixtureId),
    odds: saved.sort((a, b) => b.draw_odds - a.draw_odds),
  };
};
