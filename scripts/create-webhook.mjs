// Registers this app's webhook endpoint with the shared Stripe sandbox (run once, after deploying).
//   node --env-file=.env.local scripts/create-webhook.mjs https://YOUR-APP.vercel.app
// Prints the signing secret (whsec_...) once: save it as STRIPE_WEBHOOK_SECRET.
import Stripe from "stripe";

const appUrl = (process.argv[2] ?? "").replace(/\/+$/, "");
if (!/^https:\/\/[^/]+$/.test(appUrl)) {
  console.error("Usage: node --env-file=.env.local scripts/create-webhook.mjs https://YOUR-APP.vercel.app");
  console.error("Use your public production URL (not a preview URL).");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpoint = await stripe.webhookEndpoints.create({
  url: `${appUrl}/api/stripe/webhook`,
  connect: true, // direct charges happen on sellers' connected accounts
  enabled_events: ["checkout.session.completed", "account.updated"],
  description: "fb-marketplace-demo",
});

console.log("Webhook endpoint:", endpoint.id, endpoint.url);
console.log("Signing secret:", endpoint.secret);
