"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProfileUpdate } from "@/types";

export type ProfileInput = {
  first_name?: string;
  last_name?: string;
  username?: string;
  total_budget?: number;
};

const NAME_MAX = 50;
const USERNAME = /^[a-z0-9_.]{3,30}$/;
// numeric(12,2): up to 9.999.999.999,99.
const BUDGET_MAX = 9_999_999_999;

// Trimmed text, or null when empty (clears the field).
const clean = (text: string) => text.trim() || null;

// Updates the signed-in user's profile. Only the fields passed change.
// A public endpoint like every Server Action: inputs are validated, and the
// row is the caller's own (their id from the session, plus RLS).
export const updateProfile = async (
  input: ProfileInput,
): Promise<{ error: string | null }> => {
  const update: ProfileUpdate = {};

  for (const key of ["first_name", "last_name"] as const) {
    const value = input[key];
    if (value === undefined) continue;
    if (typeof value !== "string" || value.trim().length > NAME_MAX)
      return { error: `Names can be up to ${NAME_MAX} characters` };
    update[key] = clean(value);
  }

  if (input.username !== undefined) {
    if (typeof input.username !== "string")
      return { error: "Invalid username" };
    const username = input.username.trim().toLowerCase();
    if (username && !USERNAME.test(username))
      return {
        error:
          "Usernames are 3–30 characters: letters, numbers, dots and underscores",
      };
    update.username = username || null;
  }

  if (input.total_budget !== undefined) {
    const budget = input.total_budget;
    if (typeof budget !== "number" || !Number.isFinite(budget) || budget <= 0)
      return { error: "Your bankroll must be greater than 0" };
    if (budget > BUDGET_MAX) return { error: "That bankroll is too large" };
    update.total_budget = Math.round(budget);
  }

  if (Object.keys(update).length === 0) return { error: null };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "You're signed out. Sign in and try again" };

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId);

  if (error) {
    // unique (username)
    if (error.code === "23505") return { error: "That username is taken" };
    return { error: "Couldn't save your changes" };
  }

  // Names show in the sidebar, the bankroll drives stakes and dashboard
  // figures: refresh every page.
  revalidatePath("/", "layout");
  return { error: null };
};
