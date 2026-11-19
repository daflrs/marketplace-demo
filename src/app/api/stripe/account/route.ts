import { NextResponse, type NextRequest } from "next/server";
import { getSales, getSellerStatus } from "@/lib/payments";
import { platformFeePercent } from "@/lib/stripe";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { jsonError, NO_STORE, serverError } from "@/lib/api-response";

/**
 * GET /api/stripe/account?email=seller@example.com
 * The seller's Stripe status (refreshed from Stripe) and their sales with platform fees.
 * No accounts in this demo, so the listing email is the lookup key (as the brief allows).
 */
export async function GET(request: NextRequest) {
  const email = normalizeEmail(request.nextUrl.searchParams.get("email"));
  if (!isValidEmail(email)) return jsonError(400, "Enter a valid email.");

  try {
    const [status, sales] = await Promise.all([getSellerStatus(email), getSales(email)]);
    return NextResponse.json({ status, sales, feePercent: platformFeePercent() }, { headers: NO_STORE });
  } catch (err) {
    return serverError(err, "GET /api/stripe/account");
  }
}
