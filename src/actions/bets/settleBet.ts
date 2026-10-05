"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { outcomeFromScore, parseScore, resultLabels } from "@/lib/utils/bets";
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
  void: { status: "void", result: "void" },
};

// Settles a pending bet with its outcome and final score ("1-1"). The score
// is required unless the bet is void, and must agree with the outcome.
// A won bet closes its progression and starts the next one, which begins
// again at 1 unit.
// Server Actions are public endpoints: validate the input, and let RLS
// make sure the bet belongs to the signed-in user.
export const settleBet = async (
  betId: number,
  outcome: SettleOutcome,
  scoreText?: string,
) => {
  if (!Number.isInteger(betId) || !SETTLE_OUTCOMES.includes(outcome)) {
    return { error: "Invalid bet or outcome" };
  }

  const hasScore = typeof scoreText === "string" && scoreText.trim() !== "";
  const score = hasScore ? parseScore(scoreText) : null;
  if (hasScore && !score) return { error: "Write the score like 1-1" };
  if (outcome !== "void" && !score) return { error: "Add the final score" };
  if (outcome !== "void" && score && outcomeFromScore(score) !== outcome)
    return {
      error: `A ${score.text} score doesn't match "${resultLabels[outcome]}"`,
    };

  const supabase = await createClient();
  const { status, result } = outcomes[outcome];

  const { data: bet, error } = await supabase
    .from("bets")
    .update({ status, result, score: score?.text ?? null })
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
  revalidatePath("/draw-odds");
  return { error: null };
};
