import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BetStatus, ResultBet } from "@/types";

// The bets placed from these model results, keyed by result id. Results
// without a bet are left out. Server-only: call it from Server Components.
export const getResultBets = async (
  resultIds: number[],
): Promise<Record<number, ResultBet>> => {
  if (resultIds.length === 0) return {};

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bets")
    .select("id, status, model_result_id")
    .in("model_result_id", resultIds);

  if (error) throw new Error("Error getting the results' bets.");

  return Object.fromEntries(
    data.map((bet) => [
      bet.model_result_id!,
      { id: bet.id, status: bet.status as BetStatus },
    ]),
  );
};
