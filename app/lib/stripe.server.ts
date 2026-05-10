import Stripe from "stripe";

// Stripe client + dev-mode switch.
//
// Two modes, picked automatically based on STRIPE_SECRET_KEY:
//   1. DEV MODE  — key empty or contains "placeholder". The checkout API
//                  bypasses Stripe entirely (no network call, no charge),
//                  marks orders PAID immediately, prints details to console,
//                  sends notification email, and redirects to the dev success
//                  page. See api.create-checkout-session.tsx.
//   2. REAL MODE — any other value. The checkout API creates a real Stripe
//                  Checkout Session, the user pays, and the webhook
//                  (api.stripe-webhook.tsx) flips the order to PAID.
//
// To switch back to real Stripe, just set STRIPE_SECRET_KEY to a real
// sk_live_... or sk_test_... value. No code changes needed.
//
// Production safety: if NODE_ENV=production and the key is a placeholder,
// we throw at module load so a misconfigured deploy fails fast instead of
// silently bypassing payments.

const KEY = process.env.STRIPE_SECRET_KEY ?? "";

export const isStripeDevMode = (): boolean =>
  KEY === "" || KEY.includes("placeholder");

if (process.env.NODE_ENV === "production" && isStripeDevMode()) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing or a placeholder in production. " +
      "Set a real Stripe key (sk_live_... or sk_test_...) before deploying.",
  );
}

// In dev mode the client is constructed but never called.
export const stripe = new Stripe(KEY || "sk_test_placeholder", {
  apiVersion: "2025-03-31.basil",
});
