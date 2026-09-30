import { signIn } from "@/actions/auth/signIn";
import { useState, useTransition } from "react";

export const useSignIn = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const signInUser = (email: string, password: string) => {
    setError(null);
    startTransition(async () => {
      const result = await signIn(email, password);
      if (result?.error) setError(result.error);
    });
  };

  return { isPending, error, signInUser };
};
