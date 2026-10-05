"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { stakeAfterLosses } from "@/lib/utils/staking";
import { BOOKMAKERS } from "@/lib/data/bookmakers";
import type { CreateBetInput } from "@/types";

const isNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

const isTeam = (name: unknown): name is string =>
  typeof name === "string" &&
  name.trim().length > 0 &&
  name.trim().length <= 100;

// Mirrors the table's check constraints, so the user gets a clear message
// instead of a database error. Returns null when the input is valid.
const validate = (input: CreateBetInput): string | null => {
  if (!isTeam(input.home_team) || !isTeam(input.away_team))
    return "Enter both teams";
  if (
    input.home_team.trim().toLowerCase() ===
    input.away_team.trim().toLowerCase()
  )
    return "Home and away teams must be different";
  if (
    typeof input.match_date !== "string" ||
    Number.isNaN(Date.parse(input.match_date))
  )
    return "Enter a valid match date";
  if (!(BOOKMAKERS as readonly string[]).includes(input.bookmaker))
    return "Choose a bookmaker";
  if (!isNumber(input.odds) || input.odds <= 1)
    return "Odds must be greater than 1";
  if (
    !isNumber(input.draw_percentage) ||
    input.draw_percentage < 0 ||
    input.draw_percentage > 100
  )
    return "Draw estimate must be between 0 and 100";
  if (
    input.model_result_id !== undefined &&
    (!Number.isInteger(input.model_result_id) || input.model_result_id <= 0)
  )
    return "Invalid result";
  return null;
};

// Adds a bet as the next attempt of the active progression, or starts a new
// progression when there's none. A progression runs one bet at a time: the
// next stake depends on the last result, so a pending bet must be settled first.
// Stake and amount come from the staking rule (attempt number + bankroll),
// never from the input. RLS and the column defaults set user_id to the
// signed-in user.
export const createBet = async (
  input: CreateBetInput,
): Promise<{ betId: number | null; error: string | null }> => {
  const invalid = validate(input);
  if (invalid) return { betId: null, error: invalid };

  const supabase = await createClient();
  const matchDate = new Date(input.match_date).toISOString();

  // The bankroll sets the unit value (bankroll / 400).
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("total_budget")
    .single();

  if (profileError)
    return { betId: null, error: "Couldn't load your bankroll" };
  if (profile.total_budget <= 0)
    return { betId: null, error: "Set your bankroll before adding bets" };

  // The latest active progression, if any.
  const { data: active, error: activeError } = await supabase
    .from("progressions")
    .select("id")
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError)
    return { betId: null, error: "Couldn't load your progression" };

  let progressionId = active?.id;
  let attemptNumber = 1;
  let losses = 0;

  if (progressionId) {
    const { data: progressionBets, error: lastBetError } = await supabase
      .from("bets")
      .select("attempt_number, status")
      .eq("progression_id", progressionId)
      .order("attempt_number", { ascending: false });

    const lastBet = progressionBets?.[0];

    if (lastBetError)
      return { betId: null, error: "Couldn't load your progression" };
    if (lastBet?.status === "pending")
      return {
        betId: null,
        error: "Settle the pending bet before adding the next one",
      };

    attemptNumber = (lastBet?.attempt_number ?? 0) + 1;
    // Only lost bets raise the stake; void ones repeat it.
    losses = progressionBets.filter((bet) => bet.status === "lost").length;
  } else {
    // No active progression: this bet starts a new one.
    const { data: created, error: createError } = await supabase
      .from("progressions")
      .insert({ start_date: matchDate })
      .select("id")
      .single();

    if (createError)
      return { betId: null, error: "Couldn't start a new progression" };
    progressionId = created.id;
  }

  const { units, amount } = stakeAfterLosses(losses, profile.total_budget);

  const { data: bet, error } = await supabase
    .from("bets")
    .insert({
      progression_id: progressionId,
      attempt_number: attemptNumber,
      match_date: matchDate,
      home_team: input.home_team.trim(),
      away_team: input.away_team.trim(),
      odds: input.odds,
      stake: units,
      amount,
      draw_percentage: input.draw_percentage,
      bookmaker: input.bookmaker,
      model_result_id: input.model_result_id ?? null,
    })
    .select("id")
    .single();

  if (error) {
    // unique (model_result_id): this result already has a bet.
    if (error.code === "23505" && error.message.includes("model_result_id"))
      return { betId: null, error: "You've already bet on this result" };
    // unique (progression_id, attempt_number): another save got there first.
    if (error.code === "23505")
      return {
        betId: null,
        error: "This attempt was just added. Refresh and try again",
      };
    return { betId: null, error: "Couldn't save the bet" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  revalidatePath("/draw-odds");
  return { betId: bet.id, error: null };
};
