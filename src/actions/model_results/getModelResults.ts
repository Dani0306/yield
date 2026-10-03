"use server";

import { createClient } from "@/lib/supabase/server";
import type { ModelResult } from "@/types";

// The model's draw candidates, latest match day first and, within a day,
// highest draw estimate first.
// A Server Action, so Client Components can call it too. RLS only lets
// signed-in users read the table, so a visitor gets an error, not the data.
export const getModelResults = async (
  filter?: string,
): Promise<ModelResult[]> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not found.");

  let query = supabase
    .from("model_results")
    .select("*")
    .order("match_date", { ascending: false })
    .order("draw_percentage", { ascending: false });

  // A result is in one list only: "selected" shows the added ones, the
  // default list the rest.
  query = query.eq("added", filter === "selected");

  const { data, error } = await query;

  if (error) throw new Error("Error getting model results.");

  return data;
};
