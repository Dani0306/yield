"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  SETTLE_OUTCOMES,
  type BetResult,
  type BetStatus,
  type SettleOutcome,
} from "@/types";

const outcomes: Record<
  SettleOutcome,
  { status: BetStatus; result: BetResult | null }
> = {
  draw: { status: "won", result: "draw" },
  home_win: { status: "lost", result: "home_win" },
  away_win: { status: "lost", result: "away_win" },
  void: { status: "void", result: null },
};

// Settles a pending bet. A won bet closes its progression and starts the
// next one, which begins again at 1 unit.
// Server Actions are public endpoints: validate the input, and let RLS
// make sure the bet belongs to the signed-in user.
export const settleBet = async (betId: number, outcome: SettleOutcome) => {
  if (!Number.isInteger(betId) || !SETTLE_OUTCOMES.includes(outcome)) {
    return { error: "Invalid bet or outcome" };
  }

  const supabase = await createClient();
  const { status, result } = outcomes[outcome];

  const { data: bet, error } = await supabase
    .from("bets")
    .update({ status, result })
    .eq("id", betId)
    .eq("status", "pending")
    .select("progression_id, match_date")
    .maybeSingle();

  if (error) return { error: "Couldn't settle the bet" };
  if (!bet) return { error: "Bet not found or already settled" };

  if (status === "won") {
    const { data: progression } = await supabase
      .from("progressions")
      .select("start_date")
      .eq("id", bet.progression_id)
      .single();

    // End on the match date, but never before the progression started.
    const endDate =
      progression && progression.start_date > bet.match_date
        ? progression.start_date
        : bet.match_date;

    const { error: progressionError } = await supabase
      .from("progressions")
      .update({ status: "won", end_date: endDate })
      .eq("id", bet.progression_id);

    if (progressionError)
      return { error: "Bet settled, but the progression wasn't closed" };

    const { error: newProgressionError } = await supabase
      .from("progressions")
      .insert({});

    if (newProgressionError)
      return { error: "Progression won, but the next one wasn't started" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  return { error: null };
};
