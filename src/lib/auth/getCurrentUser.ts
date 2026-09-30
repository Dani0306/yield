import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";

// The signed-in user: their profile plus the email from Supabase Auth.
// Returns null when nobody is signed in.
export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", claims.sub)
    .maybeSingle();

  if (error) throw new Error("Error getting the user's profile");
  // Every account gets a profile at sign-up, so a missing one is a bug.
  if (!profile) throw new Error("Profile not found");

  return { ...profile, email: claims.email ?? "" };
};
