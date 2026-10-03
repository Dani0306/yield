"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import ErrorScreen from "@/components/layout/error/ErrorScreen";

// Catches errors in every page and in the (dashboard) layout.
// Errors in the root layout itself need a global-error.tsx.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorScreen error={error} retry={retry} />;
}
