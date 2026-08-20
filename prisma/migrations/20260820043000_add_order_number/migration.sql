-- Add human-facing order number (RR-YYYYMMDD-NN, Sydney date + per-day seq).
-- Backfill existing orders from their createdAt before making it NOT NULL.

ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;

WITH numbered AS (
  SELECT
    id,
    'RR-'
      || to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Australia/Sydney', 'YYYYMMDD')
      || '-'
      || lpad(
           (row_number() OVER (
              PARTITION BY to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Australia/Sydney', 'YYYYMMDD')
              ORDER BY "createdAt", id
           ))::text,
           2, '0'
         ) AS new_number
  FROM "Order"
)
UPDATE "Order" o
SET "orderNumber" = n.new_number
FROM numbered n
WHERE o.id = n.id;

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
