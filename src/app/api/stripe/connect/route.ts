import { NextResponse, type NextRequest } from "next/server";
import { getSellerAccount } from "@/lib/payments";
import { APP_TAG, getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { jsonError, NO_STORE, readJsonObject, serverError } from "@/lib/api-response";

/**
 * POST /api/stripe/connect  { email }
 * Creates (or reuses) the seller's Stripe connected account, saves its ID in Supabase,
 * and returns a one-time link to Stripe's hosted onboarding.
 */
export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  const email = normalizeEmail(body?.email);
  if (!isValidEmail(email)) {
    return jsonError(400, "Enter the email you use on your listings.", { email: "Enter a valid email." });
  }

  try {
    const stripe = getStripe();
    let accountId = (await getSellerAccount(email))?.stripe_account_id;

    if (!accountId) {
      // A Standard-style account: the seller gets their own full Stripe Dashboard,
      // pays Stripe's fees and handles refunds/disputes. This pairs with direct charges.
      const metadata = { seller_email: email, app: APP_TAG };
      let account;
      try {
        account = await stripe.accounts.create({
          email,
          controller: {
            stripe_dashboard: { type: "full" },
            fees: { payer: "account" },
            losses: { payments: "stripe" },
            requirement_collection: "stripe",
          },
          metadata,
        });
      } catch (err) {
        // Older platform setups only accept the classic account type.
        console.warn("[connect] controller-based account failed, retrying as type=standard:", err);
        account = await stripe.accounts.create({ type: "standard", email, metadata });
      }
      accountId = account.id;

      const { error } = await createAdminClient()
        .from("seller_accounts")
        .insert({ email, stripe_account_id: accountId });
      if (error) throw error;
    }

    const origin = request.nextUrl.origin;
    const back = `${origin}/sell/payouts?email=${encodeURIComponent(email)}`;
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${back}&refresh=1`, // link expired or reloaded: we make a fresh one
      return_url: `${back}&returned=1`,
    });

    return NextResponse.json({ url: link.url }, { headers: NO_STORE });
  } catch (err) {
    return serverError(err, "POST /api/stripe/connect");
  }
}
