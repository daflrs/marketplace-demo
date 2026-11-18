"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/**
 * A string remembered in localStorage (e.g. the seller's name), so people only type it once.
 * The server render uses "" and the browser swaps in the saved value without a hydration mismatch.
 */
export function useLocalStorage(key: string) {
  const saved = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key) ?? "";
      } catch {
        return ""; // storage blocked (private mode, etc.)
      }
    },
    () => ""
  );
  const [draft, setDraft] = useState<string | null>(null);

  const setValue = useCallback(
    (value: string) => {
      setDraft(value);
      try {
        localStorage.setItem(key, value);
      } catch {
        // ignore: the value still works for this visit
      }
    },
    [key]
  );

  return [draft ?? saved, setValue] as const;
}
