// Server-side payment logic shared by the API routes and the webhook.
import type Stripe from "stripe";
import { createAdminClient } from "./supabase";
import { getStripe } from "./stripe";
import type { OrderSummary, Sale, SellerAccountStatus } from "./types";

type SellerAccountRow = {
  email: string;
  stripe_account_id: string;
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
};

export async function getSellerAccount(email: string): Promise<SellerAccountRow | null> {
  const { data, error } = await createAdminClient()
    .from("seller_accounts")
    .select("email, stripe_account_id, details_submitted, charges_enabled, payouts_enabled")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return data as SellerAccountRow | null;
}

/**
 * Save a Stripe account's latest status and switch Buy Now on/off for all of that seller's listings.
 * Called after onboarding returns and from the account.updated webhook.
 */
export async function syncAccountStatus(account: Stripe.Account): Promise<SellerAccountRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("seller_accounts")
    .update({
      details_submitted: Boolean(account.details_submitted),
      charges_enabled: Boolean(account.charges_enabled),
      payouts_enabled: Boolean(account.payouts_enabled),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", account.id)
    .select("email, stripe_account_id, details_submitted, charges_enabled, payouts_enabled")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null; // not one of our sellers (shared sandbox)

  const row = data as SellerAccountRow;
  const { error: listingsError } = await supabase
    .from("listings")
    .update({ buy_now_enabled: row.charges_enabled })
    .eq("seller_email", row.email);
  if (listingsError) throw listingsError;

  return row;
}

export async function getSellerStatus(email: string): Promise<SellerAccountStatus> {
  let row = await getSellerAccount(email);

  // Refresh from Stripe so the page is accurate even if a webhook hasn't arrived yet.
  if (row) {
    const account = await getStripe().accounts.retrieve(row.stripe_account_id);
    row = (await syncAccountStatus(account)) ?? row;
  }

  const { count, error } = await createAdminClient()
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_email", email)
    .eq("buy_now_enabled", true)
    .neq("status", "sold");
  if (error) throw error;

  return {
    email,
    connected: Boolean(row),
    stripeAccountId: row?.stripe_account_id ?? null,
    detailsSubmitted: row?.details_submitted ?? false,
    chargesEnabled: row?.charges_enabled ?? false,
    payoutsEnabled: row?.payouts_enabled ?? false,
    buyNowListings: count ?? 0,
  };
}

export async function getSales(email: string): Promise<Sale[]> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select("id, listing_id, listing_title, buyer_email, amount_total, application_fee_amount, currency, created_at")
    .eq("seller_email", email)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Sale[];
}

/**
 * Record a paid Checkout Session as an order and mark the listing sold.
 * Safe to call more than once for the same session (Stripe retries webhooks).
 */
export async function fulfillCheckout(session: Stripe.Checkout.Session, stripeAccountId: string): Promise<"recorded" | "ignored"> {
  const listingId = session.metadata?.listing_id;
  if (!listingId) return "ignored";

  const supabase = createAdminClient();
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, title, seller_email")
    .eq("id", listingId)
    .maybeSingle();
  if (listingError) throw listingError;
  if (!listing) return "ignored"; // not our listing

  // The real platform fee, as charged on the PaymentIntent.
  let applicationFee = Number(session.metadata?.platform_fee ?? 0);
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (paymentIntentId) {
    const pi = await getStripe().paymentIntents.retrieve(paymentIntentId, {}, { stripeAccount: stripeAccountId });
    applicationFee = pi.application_fee_amount ?? applicationFee;
  }

  const { error: orderError } = await supabase.from("orders").upsert(
    {
      listing_id: listing.id,
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId ?? null,
      stripe_account_id: stripeAccountId,
      seller_email: listing.seller_email,
      buyer_email: session.customer_details?.email ?? null,
      listing_title: listing.title,
      amount_total: session.amount_total ?? 0,
      application_fee_amount: applicationFee,
      currency: session.currency ?? "usd",
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true }
  );
  if (orderError) throw orderError;

  const { error: soldError } = await supabase
    .from("listings")
    .update({ status: "sold", sold_at: new Date().toISOString(), reserved_until: null })
    .eq("id", listing.id);
  if (soldError) throw soldError;

  return "recorded";
}

/** What the success page shows: the saved order, or Stripe's view while the webhook is on its way. */
export async function getOrderSummary(sessionId: string): Promise<OrderSummary | null> {
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, listing_id, listing_title, buyer_email, amount_total, application_fee_amount, currency")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (error) throw error;

  const listingFor = async (column: "id" | "checkout_session_id", value: string) => {
    const { data, error: e } = await supabase
      .from("listings")
      .select("id, title, image_url, seller_name, seller_email")
      .eq(column, value)
      .maybeSingle();
    if (e) throw e;
    return data as { id: string; title: string; image_url: string | null; seller_name: string; seller_email: string } | null;
  };

  if (order) {
    const listing = order.listing_id ? await listingFor("id", order.listing_id) : null;
    return {
      state: "confirmed",
      orderId: order.id,
      amountTotal: order.amount_total,
      platformFee: order.application_fee_amount,
      currency: order.currency,
      buyerEmail: order.buyer_email,
      listing: listing
        ? { id: listing.id, title: listing.title, image_url: listing.image_url, seller_name: listing.seller_name }
        : { id: order.listing_id ?? "", title: order.listing_title, image_url: null, seller_name: "the seller" },
    };
  }

  // No order yet: look up the checkout through the listing it's holding.
  const listing = await listingFor("checkout_session_id", sessionId);
  if (!listing) return null;
  const seller = await getSellerAccount(listing.seller_email);
  if (!seller) return null;

  const session = await getStripe().checkout.sessions.retrieve(sessionId, {}, { stripeAccount: seller.stripe_account_id });
  return {
    state: session.payment_status === "paid" ? "processing" : "unpaid",
    orderId: null,
    amountTotal: session.amount_total ?? 0,
    platformFee: Number(session.metadata?.platform_fee ?? 0),
    currency: session.currency ?? "usd",
    buyerEmail: session.customer_details?.email ?? null,
    listing: { id: listing.id, title: listing.title, image_url: listing.image_url, seller_name: listing.seller_name },
  };
}
