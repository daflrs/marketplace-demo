import { CURRENCY } from "./constants";

const wholeFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: "currency",
  currency: CURRENCY.code,
  maximumFractionDigits: 0,
});
const centsFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: "currency",
  currency: CURRENCY.code,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return Number.isInteger(price) ? wholeFormatter.format(price) : centsFormatter.format(price);
}

/** "just now", "5 minutes ago", "1 hour ago", "3 days ago", then a date. */
export function timeAgo(iso: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 7) return plural(days, "day");
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return plural(weeks, "week");

  return `on ${new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
  return letters.toUpperCase() || "?";
}
