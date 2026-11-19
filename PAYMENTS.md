# Payments (Stripe Connect)

Sellers connect Stripe, and buyers pay with **Buy now**. The payment goes to the seller, and the marketplace keeps a platform fee. Everything runs in Stripe's sandbox (test mode).

## Flow

1. **Seller onboarding:** on **Get paid** (`/sell/payouts`), the seller enters their listing email and clicks **Connect with Stripe**.
   - `POST /api/stripe/connect` creates a Standard-style connected account (full Stripe Dashboard), saves `email → stripe_account_id` in `seller_accounts`, and returns an Account Link to Stripe's hosted onboarding.
   - On return, the page re-checks the account with Stripe (`GET /api/stripe/account`). The `account.updated` webhook also keeps it in sync.
   - When `charges_enabled` is true, every listing with that email gets `buy_now_enabled = true`.
2. **Buy now:** `POST /api/checkout`:
   - **Atomically reserves** the listing for 30 minutes (`status = 'pending'`), so two buyers can't pay for the same item.
   - Creates a Checkout Session as a **direct charge on the seller's connected account** (`stripeAccount` option) with `application_fee_amount` = the platform fee (10% by default, `PLATFORM_FEE_PERCENT`).
   - Includes the item photo and description in Checkout, and always charges USD (adaptive pricing off).
   - If the buyer clicks Back in Checkout, `POST /api/checkout/cancel` expires the session and releases the hold right away.
3. **Webhook confirmation:** `POST /api/stripe/webhook` (registered with `connect: true`):
   - verifies the signature with `STRIPE_WEBHOOK_SECRET`
   - on `checkout.session.completed`: records the order in `orders` (idempotent via a unique `stripe_session_id`) and marks the listing **Sold**
   - on `account.updated`: syncs the seller's status
   - ignores events that aren't ours (the sandbox is shared) and still returns 200
4. **Success page:** `/orders/success?session_id=…` shows the item, the amount and the receipt email, and polls `GET /api/orders/[sessionId]` until the webhook has confirmed the order.
5. **Seller earnings:** **Get paid → Your sales** lists each sale as *paid · platform fee · you earned*.

## Listing states

| Status | Card badge | Listing page |
| --- | --- | --- |
| available + seller connected | "Buy now" | **Buy now · $price** |
| available, seller not connected | none | "Seller hasn't set up online payments yet" + message form |
| pending (someone in Checkout, ≤ 30 min) | "Pending" | "Someone is checking out" (the buyer themselves sees **Continue checkout**) |
| sold | "Sold" (photo greyed) | "This item has been sold" (message form hidden) |

Items under $0.50 (Stripe's minimum), including free items, can't use Buy now.

## Security

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only (no `NEXT_PUBLIC_`) and never committed.
- Webhook requests are rejected unless the Stripe signature matches the raw request body.
- `seller_accounts` and `orders` have RLS on and no public access. Only the API routes (service role) read them.
- Prices come from the database, never from the browser, so buyers can't change the amount.
- Every Checkout Session carries `metadata.app`, and the webhook ignores other candidates' events.

## Setup

1. Run the Stripe section at the end of `supabase-schema.sql`.
2. Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` and `PLATFORM_FEE_PERCENT` to `.env.local` and Vercel.
3. **Local webhooks:** `stripe listen --api-key YOUR_SECRET_KEY --events checkout.session.completed,account.updated --forward-connect-to localhost:3000/api/stripe/webhook` (newer Stripe CLI versions require `--events`), then put the printed `whsec_…` in `.env.local` as `STRIPE_WEBHOOK_SECRET`.
4. **Production webhook (after deploying):**
   ```bash
   node --env-file=.env.local scripts/create-webhook.mjs https://YOUR-APP.vercel.app
   ```
   Save the printed `whsec_…` as `STRIPE_WEBHOOK_SECRET` in Vercel, then redeploy.

## Testing

- **Onboarding:** use [Stripe's Connect test data](https://docs.stripe.com/connect/testing), e.g. SMS code `000000`, routing `110000000`, account `000123456789`.
- **Payment:** card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
