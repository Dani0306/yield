"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ModelResultKey } from "@/types";

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

// Selects (added = true) or deselects (added = false) one model result.
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

  const { error } = await supabase
    .from("model_results")
    .update({ added })
    .eq("match_date", key.match_date)
    .eq("home_team", key.home_team)
    .eq("away_team", key.away_team)
    .eq("scraped_at", key.scraped_at);

  if (error) throw new Error(error.message);

  revalidatePath("/draw-odds");
};
