import "server-only";

import { createClient } from "@/lib/supabase/server";
import { BET_SELECT, toBet } from "@/lib/utils/bets";
import type { Bet } from "@/types";

// All of the signed-in user's bets, newest match first. RLS limits the rows
// to the user, so there's no user filter here.
// Not a Server Action ("use server" would expose it as a public endpoint):
// call it from Server Components and pass the result down.
export const getBets = async (): Promise<Bet[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bets")
    .select(BET_SELECT)
    .order("match_date", { ascending: false })
    .order("attempt_number", { ascending: false });

  if (error) throw new Error("Error getting bets");

  // The check constraints guarantee status and result hold these values.
  return (data as unknown as Parameters<typeof toBet>[0][]).map(toBet);
};
