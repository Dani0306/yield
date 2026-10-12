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
// At flat stakes a result changes nothing else: the next bet's stake is the
// same either way.
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
    .select("id")
    .maybeSingle();

  if (error) return { error: "Couldn't settle the bet" };
  if (!bet) return { error: "Bet not found or already settled" };

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  revalidatePath("/draw-odds");
  return { error: null };
};
