-- Royal Rose stale order audit.
--
-- READ-ONLY. This script never writes — it surfaces anomalous order rows
-- so an operator can decide what to do. There is no auto-cleanup because
-- a partial mistake here destroys real revenue records.
--
-- Run against the production database:
--   psql "$DATABASE_URL" -f scripts/stale-orders-audit.sql
--
-- Each section prints a header so you can read the output top-down.

\echo === Stale PENDING orders (likely abandoned at Stripe checkout) ===
-- A PENDING order that's older than 24h almost certainly never completed
-- payment. Stripe sessions expire after 24h, so leaving these around is
-- safe but they accumulate and pollute reporting / duplicate-guard logic.
SELECT
  id,
  "createdAt" AS created_at,
  ROUND((EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 86400)::numeric, 1) AS age_days,
  "totalAmount" AS total,
  "recipientEmail" AS recipient_email
FROM "Order"
WHERE status = 'PENDING'
  AND "createdAt" < NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" ASC;

\echo
\echo === PAID orders missing stripeSessionId (pre-fix or dev-mode) ===
-- Before commit 008e31b, the webhook didn't always stamp stripeSessionId
-- on PAID transition. Also true of any order paid via the dev-mode
-- bypass. Worth flagging because Stripe-side reconciliation can't find
-- these by session id.
SELECT
  id,
  "createdAt" AS created_at,
  status,
  "totalAmount" AS total,
  CASE WHEN "stripeSessionId" IS NULL THEN 'missing' ELSE 'present' END AS session_id
FROM "Order"
WHERE status = 'PAID'
  AND "stripeSessionId" IS NULL
ORDER BY "createdAt" DESC;

\echo
\echo === Email-marker backfill candidates ===
-- After commit a07dd3e, orders.server.ts started stamping
-- customerEmailSentAt and adminEmailSentAt. Old PAID orders pre-date
-- those columns so the markers are null. NOT a bug, but if you'd like
-- to dispatch a one-time confirmation email for historical orders you
-- need to enumerate them here first.
SELECT
  id,
  status,
  "createdAt" AS created_at,
  "customerEmailSentAt" IS NULL AS customer_email_missing,
  "adminEmailSentAt" IS NULL AS admin_email_missing
FROM "Order"
WHERE status = 'PAID'
  AND ("customerEmailSentAt" IS NULL OR "adminEmailSentAt" IS NULL)
ORDER BY "createdAt" DESC
LIMIT 50;

\echo
\echo === Orders whose subtotal + deliveryFee disagrees with totalAmount ===
-- Pre-P0-3 fix, deliveryFee defaulted to 0 even when the buyer paid a
-- postcode-based delivery charge. That makes subtotal + fee != total.
-- These are still valid PAID orders (Stripe charged correctly) but the
-- breakdown stored locally is wrong and the new admin detail page will
-- show a yellow warning chip.
SELECT
  o.id,
  o.status,
  o."totalAmount" AS total,
  o."deliveryFee" AS delivery_fee,
  ROUND(SUM(i."unitPrice" * i.quantity)::numeric, 2) AS items_subtotal,
  ROUND((o."totalAmount" - SUM(i."unitPrice" * i.quantity))::numeric, 2) AS implied_delivery
FROM "Order" o
JOIN "OrderItem" i ON i."orderId" = o.id
GROUP BY o.id
HAVING ROUND((SUM(i."unitPrice" * i.quantity) + o."deliveryFee")::numeric, 2)
   <> ROUND(o."totalAmount"::numeric, 2)
ORDER BY o."createdAt" DESC
LIMIT 50;

\echo
\echo === Summary counts ===
SELECT
  (SELECT COUNT(*) FROM "Order" WHERE status = 'PENDING' AND "createdAt" < NOW() - INTERVAL '24 hours') AS stale_pending,
  (SELECT COUNT(*) FROM "Order" WHERE status = 'PAID' AND "stripeSessionId" IS NULL) AS paid_without_session_id,
  (SELECT COUNT(*) FROM "Order" WHERE status = 'PAID' AND "customerEmailSentAt" IS NULL) AS paid_missing_customer_email_marker,
  (SELECT COUNT(*) FROM "Order" WHERE status = 'PAID' AND "adminEmailSentAt" IS NULL) AS paid_missing_admin_email_marker;

-- Suggested manual follow-up (NOT executed by this script):
--
--   1. Stale PENDING — usually safe to mark CANCELLED:
--      UPDATE "Order" SET status = 'CANCELLED'
--      WHERE status = 'PENDING' AND "createdAt" < NOW() - INTERVAL '24 hours';
--
--   2. PAID without stripeSessionId — leave alone unless you can match
--      them to Stripe-side payment_intents and backfill manually.
--
--   3. Missing email markers — only matters if you want to re-send the
--      customer confirmation for historical orders. Cross-reference your
--      SMTP provider's outbound log before triggering.
