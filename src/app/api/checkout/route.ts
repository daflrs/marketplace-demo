import { NextResponse, type NextRequest } from "next/server";
import { getSellerAccount } from "@/lib/payments";
import { APP_TAG, CURRENCY, getStripe, MIN_CHARGE_CENTS, platformFeeFor, RESERVATION_MINUTES, toCents } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { isUuid } from "@/lib/validation";
import { jsonError, NO_STORE, readJsonObject, serverError } from "@/lib/api-response";

type ListingForCheckout = {
  id: string;
  title: string;
  description: string;
  price: number | string;
  image_url: string | null;
  seller_email: string;
  status: string;
  reserved_until: string | null;
  checkout_session_id: string | null;
};

/**
 * POST /api/checkout  { listingId, resumeSessionId? }
 * Reserves the listing for 30 minutes and opens Stripe Checkout as a DIRECT CHARGE on the
 * seller's connected account, with our platform fee as the application fee.
 */
export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  const listingId = body?.listingId;
  const resumeSessionId = typeof body?.resumeSessionId === "string" ? body.resumeSessionId : null;
  if (!isUuid(listingId)) return jsonError(400, "That listing doesn't exist.");

  try {
    const supabase = createAdminClient();
    const stripe = getStripe();

    const { data, error } = await supabase
      .from("listings")
      .select("id, title, description, price, image_url, seller_email, status, reserved_until, checkout_session_id")
      .eq("id", listingId)
      .maybeSingle();
    if (error) throw error;
    const listing = data as ListingForCheckout | null;
    if (!listing) return jsonError(404, "This listing doesn't exist or was removed.");
    if (listing.status === "sold") return jsonError(409, "Sorry, this item has already been sold.");

    const seller = await getSellerAccount(listing.seller_email);
    if (!seller?.charges_enabled) {
      return jsonError(409, "This seller isn't set up to accept online payments yet. Send them a message instead.");
    }

    const amount = toCents(Number(listing.price));
    if (amount < MIN_CHARGE_CENTS) return jsonError(409, "Items under $0.50 can't be bought online.");

    const now = new Date();
    const held = listing.status === "pending" && listing.reserved_until && new Date(listing.reserved_until) > now;

    // Same buyer coming back (e.g. pressed Back in Checkout): reuse their open session.
    if (held && resumeSessionId && resumeSessionId === listing.checkout_session_id) {
      const existing = await stripe.checkout.sessions.retrieve(
        resumeSessionId,
        {},
        { stripeAccount: seller.stripe_account_id }
      );
      if (existing.status === "open" && existing.url) {
        return NextResponse.json({ url: existing.url, sessionId: existing.id }, { headers: NO_STORE });
      }
    }

    // Atomically claim the listing: only succeeds if it's available or its hold has expired.
    const reservedUntil = new Date(now.getTime() + (RESERVATION_MINUTES + 1) * 60_000);
    const { data: claimed, error: claimError } = await supabase
      .from("listings")
      .update({ status: "pending", reserved_until: reservedUntil.toISOString(), checkout_session_id: null })
      .eq("id", listing.id)
      .or(`status.eq.available,and(status.eq.pending,reserved_until.lt."${now.toISOString()}")`)
      .select("id")
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) {
      return jsonError(409, "Someone else is checking out this item right now. Try again in a few minutes.");
    }

    const fee = platformFeeFor(amount);
    const origin = request.nextUrl.origin;
    const description = listing.description.trim().slice(0, 300);

    try {
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: CURRENCY,
                unit_amount: amount,
                product_data: {
                  name: listing.title,
                  ...(description ? { description } : {}),
                  ...(listing.image_url ? { images: [listing.image_url] } : {}),
                },
              },
            },
          ],
          payment_intent_data: {
            application_fee_amount: fee, // the platform's cut
            metadata: { app: APP_TAG, listing_id: listing.id },
          },
          adaptive_pricing: { enabled: false }, // always charge the USD price shown on the listing
          client_reference_id: listing.id,
          metadata: { app: APP_TAG, listing_id: listing.id, platform_fee: String(fee) },
          expires_at: Math.floor(reservedUntil.getTime() / 1000),
          success_url: `${origin}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/item/${listing.id}?checkout=cancelled`,
        },
        { stripeAccount: seller.stripe_account_id } // direct charge on the seller's account
      );

      const { error: saveError } = await supabase
        .from("listings")
        .update({ checkout_session_id: session.id })
        .eq("id", listing.id);
      if (saveError) throw saveError;

      return NextResponse.json({ url: session.url, sessionId: session.id }, { headers: NO_STORE });
    } catch (err) {
      // Couldn't open Checkout: release the hold so the item doesn't get stuck as pending.
      await supabase
        .from("listings")
        .update({ status: "available", reserved_until: null, checkout_session_id: null })
        .eq("id", listing.id)
        .eq("status", "pending");
      throw err;
    }
  } catch (err) {
    return serverError(err, "POST /api/checkout");
  }
}
