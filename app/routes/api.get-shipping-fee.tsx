// app/routes/api.get-shipping-fee.tsx
// Frontend quote endpoint. Returns the same numbers the checkout API will
// charge through Stripe, so the summary on /checkout matches the receipt.

import { json } from "@remix-run/node";
import { calculateDeliveryFee } from "~/lib/delivery.server";
import { DELIVERY_WINDOWS, type DeliveryWindowKey } from "~/lib/delivery";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const postcode = url.searchParams.get("postcode");
  const windowParam = url.searchParams.get("deliveryWindow") ?? "RESIDENTIAL";

  if (!postcode) {
    return json({ error: "Missing postcode" }, { status: 400 });
  }
  if (!(windowParam in DELIVERY_WINDOWS)) {
    return json({ error: "Invalid delivery window" }, { status: 400 });
  }

  const result = await calculateDeliveryFee({
    deliveryType: "DELIVERY",
    postcode,
    deliveryWindow: windowParam as DeliveryWindowKey,
  });

  if (!result.ok) {
    const status = result.code === "UNSUPPORTED_POSTCODE" ? 404 : 400;
    return json({ error: result.error, code: result.code }, { status });
  }

  return json({
    suburb: result.zoneSuburb,
    zoneFee: result.zoneFee,
    windowSurcharge: result.windowSurcharge,
    total: result.total,
    // legacy field: older clients read `price` as the total quote
    price: result.total,
  });
}
