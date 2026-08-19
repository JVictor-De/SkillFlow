"use client";

import { useCallback, useState } from "react";

import { friendlyMessage } from "@/lib/errors";

interface AsyncState<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
}

export function useAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
) {
  const [state, setState] = useState<AsyncState<TResult>>({
    loading: false,
    data: null,
    error: null,
  });

  const run = useCallback(
    async (...args: TArgs) => {
      setState({ loading: true, data: null, error: null });
      try {
        const data = await fn(...args);
        setState({ loading: false, data, error: null });
        return data;
      } catch (error) {
        setState({ loading: false, data: null, error: friendlyMessage(error) });
        throw error;
      }
    },
    [fn],
  );

  return { ...state, run, reset: () => setState({ loading: false, data: null, error: null }) };
}
