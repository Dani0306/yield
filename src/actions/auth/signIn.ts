"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const signIn = async (email: string, password: string) => {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  redirect("/dashboard");
};
