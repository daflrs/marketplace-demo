"use client";

import { useNow } from "@/hooks/use-now";
import { timeAgo } from "@/lib/format";

/** "Listed 5 minutes ago". Rendered in the browser so it never freezes into a prerendered page. */
export function TimeAgo({ iso, prefix = "" }: { iso: string; prefix?: string }) {
  const now = useNow();

  if (!now) {
    // Before hydration: keep the space reserved so the layout doesn't jump.
    return <span className="invisible">{prefix}just now</span>;
  }
  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString()}>
      {prefix}
      {timeAgo(iso, now)}
    </time>
  );
}
