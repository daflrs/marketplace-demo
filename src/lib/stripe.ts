// Stripe client and payment settings. Server-only: STRIPE_SECRET_KEY never reaches the browser.
import Stripe from "stripe";
import { ConfigError } from "./supabase";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new ConfigError("The server is missing the STRIPE_SECRET_KEY environment variable.");
  stripe ??= new Stripe(key);
  return stripe;
}

/**
 * Tag on every Checkout Session we create. The sandbox is shared with other candidates,
 * so the webhook ignores sessions without it.
 */
export const APP_TAG = "fb-marketplace-demo";

export const CURRENCY = "usd";

/** Stripe's minimum charge in USD is $0.50. Free or cheaper items can't use Buy Now. */
export const MIN_CHARGE_CENTS = 50;

/** Checkout holds a listing for 30 minutes (Stripe's minimum session lifetime). */
export const RESERVATION_MINUTES = 30;

export function platformFeePercent(): number {
  const raw = Number(process.env.PLATFORM_FEE_PERCENT ?? 10);
  return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 50) : 10;
}

/** Platform fee in cents, e.g. 10% of $120.00 = 1200. */
export function platformFeeFor(amountCents: number): number {
  return Math.round((amountCents * platformFeePercent()) / 100);
}

export const toCents = (price: number) => Math.round(price * 100);
