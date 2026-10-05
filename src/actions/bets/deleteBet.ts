"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Deletes a bet. If it was the winning bet, its progression reopens and the
// empty progression started after the win is removed.
// RLS makes sure only the signed-in user's bets can be deleted.
export const deleteBet = async (betId: number) => {
  if (!Number.isInteger(betId)) return { error: "Invalid bet" };

  const supabase = await createClient();

  const { data: bet, error } = await supabase
    .from("bets")
    .delete()
    .eq("id", betId)
    .select("progression_id, status")
    .maybeSingle();

  if (error) return { error: "Couldn't delete the bet" };
  if (!bet) return { error: "Bet not found" };

  if (bet.status === "won") {
    const { data: active } = await supabase
      .from("progressions")
      .select("id, bets(count)")
      .eq("status", "active");

    const emptyIds = (active ?? [])
      .filter((p) => p.id !== bet.progression_id && p.bets[0]?.count === 0)
      .map((p) => p.id);

    if (emptyIds.length > 0)
      await supabase.from("progressions").delete().in("id", emptyIds);

    await supabase
      .from("progressions")
      .update({ status: "active", end_date: null })
      .eq("id", bet.progression_id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  revalidatePath("/draw-odds");
  return { error: null };
};
