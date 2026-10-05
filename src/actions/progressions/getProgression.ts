import "server-only";

import { createClient } from "@/lib/supabase/server";
import { BET_SELECT, toBet } from "@/lib/utils/bets";
import type { Bet, ProgressionWithStats } from "@/types";

// One progression, found by its number (#1, #2… unique per user), with its
// totals (progression_stats view) and its bets, attempt 1 first. null when
// the user has no progression with that number (RLS limits the search to
// the signed-in user's rows).
export const getProgression = async (
  progressionNumber: number,
): Promise<{ progression: ProgressionWithStats; bets: Bet[] } | null> => {
  const supabase = await createClient();

  const { data: progression, error } = await supabase
    .from("progression_stats")
    .select("*")
    .eq("progression_number", progressionNumber)
    .maybeSingle();

  if (error) throw new Error("Error getting the progression");
  if (!progression) return null;

  // Bets link to the progression's id, which the first query provides.
  const { data: bets, error: betsError } = await supabase
    .from("bets")
    .select(BET_SELECT)
    .eq("progression_id", progression.progression_id!)
    .order("attempt_number", { ascending: true });

  if (betsError) throw new Error("Error getting the progression's bets");

  return {
    // Views type every column as nullable; these come from not-null columns.
    progression: progression as ProgressionWithStats,
    bets: (bets as unknown as Parameters<typeof toBet>[0][]).map(toBet),
  };
};
