import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProgressionWithStats } from "@/types";

// The signed-in user's progressions with their totals (progression_stats
// view), newest first. The view respects RLS, so only the user's rows return.
export const getProgressions = async (): Promise<ProgressionWithStats[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("progression_stats")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) throw new Error("Error getting progressions");

  // Views type every column as nullable, but these come from not-null
  // columns and coalesced sums.
  return data as ProgressionWithStats[];
};
