import { signOut } from "@/actions/auth/signOut";
import { useTransition } from "react";

export const useSignOut = () => {
  const [isPending, startTransition] = useTransition();

  const signOutFn = () => {
    startTransition(async () => {
      try {
        await signOut();
      } catch (err) {
        console.log(err);
      }
    });
  };

  return { isPending, signOutFn };
};
