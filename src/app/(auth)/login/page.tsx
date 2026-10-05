"use client";

import Input from "@/components/ui/Input";
import Loader from "@/components/ui/Loader";
import Logo from "@/components/ui/Logo";
import PageButton from "@/components/ui/PageButton";
import { useSignIn } from "@/hooks/auth/useSignIn";
import { Lock, User } from "lucide-react";
import { useState } from "react";
export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const { signInUser, error, isPending } = useSignIn();

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    signInUser(email, password);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center px-6">
      <form
        className="flex w-full max-w-85 flex-col space-y-2 items-center"
        onSubmit={handleSubmit}
      >
        <Logo size="md" />
        {isPending ? (
          <div className="mt-5">
            <Loader label="Signing in ..." />
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-3 w-full max-w-85">
              <Input
                icon={User}
                value={email}
                setValue={setEmail}
                name="email"
                label="Email"
                type="email"
              />
              <Input
                icon={Lock}
                value={password}
                setValue={setPassword}
                name="password"
                label="Password"
                type="password"
              />

              {error && (
                <p role="alert" className="text-xs font-light text-red-600">
                  {error}
                </p>
              )}

              <PageButton text="Sign In" fullWidth className="mt-3" />
            </div>
          </>
        )}
      </form>
    </div>
  );
}
