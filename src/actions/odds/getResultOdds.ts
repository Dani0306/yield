import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ResultOddsSummary } from "@/types";

// The stored bookmaker odds for these results, best draw price first, keyed
// by result id. Results never checked have checkedAt: null.
export const getResultOdds = async (
  resultIds: number[],
): Promise<Record<number, ResultOddsSummary>> => {
  if (resultIds.length === 0) return {};

  const supabase = await createClient();
  const [results, odds] = await Promise.all([
    supabase
      .from("model_results")
      .select("id, odds_fixture_id, odds_checked_at")
      .in("id", resultIds),
    supabase
      .from("result_odds")
      .select("*")
      .in("model_result_id", resultIds)
      .order("draw_odds", { ascending: false }),
  ]);

  if (results.error || odds.error) throw new Error("Error getting the odds");

  return Object.fromEntries(
    results.data.map((r) => [
      r.id,
      {
        checkedAt: r.odds_checked_at,
        matched: Boolean(r.odds_fixture_id),
        odds: odds.data.filter((o) => o.model_result_id === r.id),
      },
    ]),
  );
};
