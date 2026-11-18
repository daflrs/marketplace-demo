"use client";

import { useSyncExternalStore } from "react";

// A shared clock that ticks every 30s so "5 minutes ago" labels stay fresh.
// Date.now() only runs in the browser (inside subscribe/tick), never during render,
// which keeps Next.js prerendering (cacheComponents) happy. The server snapshot is 0.
let now = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function tick() {
  now = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    tick();
    timer = setInterval(tick, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Current time in ms, or 0 before the page has hydrated. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now, () => 0);
}
