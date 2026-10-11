"use server";

import { createClient } from "@/lib/supabase/server";
import { getBetLiveScore } from "./getBetLiveScore";
import type { LiveScore } from "@/types";

// The live or final score of one of your pending bets, for the Settle bet
// modal. RLS makes sure the bet belongs to the signed-in user.
export const fetchBetScore = async (
  betId: number,
): Promise<LiveScore | null> => {
  if (!Number.isInteger(betId)) return null;

  const supabase = await createClient();
  const { data: bet } = await supabase
    .from("bets")
    .select("id, status, score, match_date, home_team, away_team")
    .eq("id", betId)
    .maybeSingle();

  if (!bet) return null;
  return getBetLiveScore(bet as Parameters<typeof getBetLiveScore>[0]);
};
