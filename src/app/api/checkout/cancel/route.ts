import { NextResponse, type NextRequest } from "next/server";
import { getSellerAccount } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { isUuid } from "@/lib/validation";
import { jsonError, NO_STORE, readJsonObject, serverError } from "@/lib/api-response";

/**
 * POST /api/checkout/cancel  { listingId, sessionId }
 * The buyer left Checkout: expire their session and release the 30-minute hold right away.
 * Only the browser that started the checkout knows the session ID.
 */
export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  const listingId = body?.listingId;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  if (!isUuid(listingId) || !sessionId) return jsonError(400, "Missing checkout details.");

  try {
    const supabase = createAdminClient();
    const { data: listing, error } = await supabase
      .from("listings")
      .select("id, seller_email, status, checkout_session_id")
      .eq("id", listingId)
      .maybeSingle();
    if (error) throw error;

    if (!listing || listing.status !== "pending" || listing.checkout_session_id !== sessionId) {
      return NextResponse.json({ released: false }, { headers: NO_STORE });
    }

    const seller = await getSellerAccount(listing.seller_email);
    if (seller) {
      try {
        await getStripe().checkout.sessions.expire(sessionId, {}, { stripeAccount: seller.stripe_account_id });
      } catch (err) {
        // Already completed or expired: if it was paid, the webhook will mark the item sold.
        console.warn("[checkout] Couldn't expire session:", err);
        return NextResponse.json({ released: false }, { headers: NO_STORE });
      }
    }

    const { error: releaseError } = await supabase
      .from("listings")
      .update({ status: "available", reserved_until: null, checkout_session_id: null })
      .eq("id", listingId)
      .eq("status", "pending")
      .eq("checkout_session_id", sessionId);
    if (releaseError) throw releaseError;

    return NextResponse.json({ released: true }, { headers: NO_STORE });
  } catch (err) {
    return serverError(err, "POST /api/checkout/cancel");
  }
}
