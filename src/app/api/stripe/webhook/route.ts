import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { fulfillCheckout, syncAccountStatus } from "@/lib/payments";
import { APP_TAG, getStripe } from "@/lib/stripe";

/**
 * POST /api/stripe/webhook
 * Registered with connect: true, so it receives events from sellers' connected accounts.
 * - checkout.session.completed → record the order and mark the listing Sold
 * - account.updated            → turn Buy Now on/off for that seller's listings
 *
 * The sandbox is shared with other candidates: anything that isn't ours gets a 200 and is ignored.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  // The signature is computed over the exact raw body, so read it as text (never JSON).
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.warn("[webhook] Signature check failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.metadata?.app !== APP_TAG || !event.account) break; // not ours
        if (session.payment_status !== "paid") break; // (card payments are paid immediately)
        const result = await fulfillCheckout(session, event.account);
        console.info(`[webhook] checkout ${session.id}: ${result}`);
        break;
      }
      case "account.updated": {
        const synced = await syncAccountStatus(event.data.object);
        if (synced) console.info(`[webhook] account ${synced.stripe_account_id} synced`);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // Returning 500 makes Stripe retry later. Safe, because fulfilment is idempotent.
    console.error(`[webhook] Failed to handle ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
