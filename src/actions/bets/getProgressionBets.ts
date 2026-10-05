"use server";

import { createClient } from "@/lib/supabase/server";
import { BET_SELECT, toBet } from "@/lib/utils/bets";
import type { Bet } from "@/types";

// The bets of one progression, attempt 1 first.
// A Server Action, so Client Components can call it (e.g. when a progression
// row is clicked). It's a public endpoint: the id is validated, and RLS only
// returns the signed-in user's bets, so another user's id returns nothing.
export const getProgressionBets = async (
  progressionId: number,
): Promise<{ bets: Bet[]; error: string | null }> => {
  if (!Number.isInteger(progressionId) || progressionId <= 0) {
    return { bets: [], error: "Invalid progression" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bets")
    .select(BET_SELECT)
    .eq("progression_id", progressionId)
    .order("attempt_number", { ascending: true });

  if (error) return { bets: [], error: "Couldn't get the progression's bets" };

  // The check constraints guarantee status and result hold these values.
  return {
    bets: (data as unknown as Parameters<typeof toBet>[0][]).map(toBet),
    error: null,
  };
};
