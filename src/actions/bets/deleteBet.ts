"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Deletes a bet. A bet from an old progression leaves the progression as it
// ended: progressions are history now, nothing reopens them.
// RLS makes sure only the signed-in user's bets can be deleted.
export const deleteBet = async (betId: number) => {
  if (!Number.isInteger(betId)) return { error: "Invalid bet" };

  const supabase = await createClient();

  const { data: bet, error } = await supabase
    .from("bets")
    .delete()
    .eq("id", betId)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Couldn't delete the bet" };
  if (!bet) return { error: "Bet not found" };

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  revalidatePath("/draw-odds");
  revalidatePath("/progressions");
  return { error: null };
};
