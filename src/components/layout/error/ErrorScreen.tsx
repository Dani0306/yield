"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import PageButton from "@/components/ui/PageButton";

type ErrorScreenProps = {
  error: Error & { digest?: string };
  // Re-renders the failed page. Without it the "Try again" button is hidden.
  retry?: () => void;
};

// Full-page error state: the error's message, its reference (digest) when
// the error came from the server, and ways to recover.
const ErrorScreen = ({ error, retry }: ErrorScreenProps) => {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-black">
      <header className="flex items-center border-b border-gray-200 px-6 py-5">
        <Link href="/" aria-label="Yield home">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="flex w-full max-w-xl flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-red-700" />
              <span className="font-mono text-xs tracking-wide text-gray-600 uppercase">
                Error
              </span>
            </div>
            <h1 className="font-display text-5xl leading-none tracking-tight sm:text-6xl">
              Something went wrong.
            </h1>
            <p className="text-[15px] leading-relaxed font-light text-gray-600">
              This page couldn&apos;t load. Try again, or head back to the
              dashboard.
            </p>
          </div>

          <section
            aria-label="Error details"
            className="rounded-md border border-gray-200"
          >
            <div className="flex flex-col gap-2 px-5 py-4">
              <span className="text-xs text-gray-500">Message</span>
              <p className="font-mono text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap text-red-700">
                {error.message || "Unknown error"}
              </p>
            </div>
            {error.digest && (
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-t border-gray-200 px-5 py-3">
                <span className="text-xs text-gray-500">Reference</span>
                <span className="font-mono text-xs text-gray-700">
                  {error.digest}
                </span>
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-2">
            {retry && (
              <PageButton
                text="Try again"
                onClick={retry}
                className="min-h-11 rounded-md px-5 font-normal"
              />
            )}
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center rounded-md border border-gray-300 px-5 text-sm transition-colors hover:bg-gray-100"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>

      {error.digest && (
        <footer className="border-t border-gray-200 px-6 py-5 text-xs text-gray-500">
          If this keeps happening, the reference above helps track it down.
        </footer>
      )}
    </div>
  );
};

export default ErrorScreen;
