"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { collectResultOdds } from "@/actions/odds/collectResultOdds";
import type { ModelResultKey } from "@/types";

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

// Selects (added = true) or deselects (added = false) one model result.
// Selecting also collects the match's bookmaker odds from OddsPapi; if that
// fails the selection still stands (the odds can be refreshed later).
// The table has no id, so the row is found by its unique key: date, teams
// and scrape time. Matching on fewer columns would change other rows too.
export const setResultAdded = async (key: ModelResultKey, added: boolean) => {
  if (
    !isText(key?.match_date) ||
    !isText(key.home_team) ||
    !isText(key.away_team) ||
    !isText(key.scraped_at) ||
    typeof added !== "boolean"
  )
    throw new Error("Invalid result");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No user found");

  const { data: updated, error } = await supabase
    .from("model_results")
    .update({ added })
    .eq("match_date", key.match_date)
    .eq("home_team", key.home_team)
    .eq("away_team", key.away_team)
    .eq("scraped_at", key.scraped_at)
    .select("*");

  if (error) throw new Error(error.message);

  if (added) {
    for (const result of updated) {
      try {
        await collectResultOdds(supabase, result);
      } catch (err) {
        console.error("Couldn't collect odds for result", result.id, err);
      }
    }
  }

  // The dashboard's next-event countdown is built from the selected results.
  revalidatePath("/draw-odds");
  revalidatePath("/dashboard");
};
