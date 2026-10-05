"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { collectResultOdds } from "./collectResultOdds";
import type { ResultOddsSummary } from "@/types";

// Fetches fresh bookmaker odds for one result (the "Refresh" button).
// Costs one odds request against the OddsPapi quota.
export const refreshResultOdds = async (
  resultId: number,
): Promise<{ odds: ResultOddsSummary | null; error: string | null }> => {
  if (!Number.isInteger(resultId) || resultId <= 0)
    return { odds: null, error: "Invalid result" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { odds: null, error: "You're signed out" };

  const { data: result, error } = await supabase
    .from("model_results")
    .select("*")
    .eq("id", resultId)
    .maybeSingle();
  if (error || !result) return { odds: null, error: "Result not found" };

  try {
    const odds = await collectResultOdds(supabase, result);
    revalidatePath("/draw-odds");
    return { odds, error: null };
  } catch (err) {
    console.error(err);
    return {
      odds: null,
      error: "Couldn't get odds right now. Try again later",
    };
  }
};
