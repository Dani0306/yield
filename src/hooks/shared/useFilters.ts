"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    ({ type, value }: { type: string; value: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = searchParams.get(type) ?? "";

      if (current === value) return;

      if (!value) {
        params.delete(type);
      } else {
        params.set(type, value);
      }

      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;

      router.replace(url);
    },
    [router, pathname, searchParams],
  );

  const hasFilter = useCallback(
    ({ type, value }: { type: string; value: string }) =>
      searchParams.get(type) === value,
    [searchParams],
  );

  const clearFilter = useCallback(
    ({ type }: { type: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(type);
      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      router.replace(url);
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    router.replace(pathname);
  }, [router, pathname]);

  const getAll = useCallback((): Record<string, string> => {
    return Object.fromEntries(searchParams.entries());
  }, [searchParams]);

  const hasAnyFilter = useCallback((): boolean => {
    return searchParams.size > 0;
  }, [searchParams]);

  return {
    setFilter,
    hasFilter,
    clearFilter,
    clearAll,
    getAll,
    hasAnyFilter,
  };
}
