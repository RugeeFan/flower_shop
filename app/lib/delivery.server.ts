// Server-only delivery fee calculation. Single source of truth used by:
//   - /api/create-checkout-session (order totalAmount + Stripe line items)
//   - /api/get-shipping-fee (frontend display while filling the form)
// Keeping one path prevents the historical bug where the postcode-based
// ShippingZone fee never reached Stripe and customers were undercharged.

import { prisma } from "~/lib/prisma.server";
import {
  DELIVERY_WINDOWS,
  type DeliveryWindowKey,
} from "~/lib/delivery";

// Markup applied on top of ShippingZone.medium when quoting a customer.
// Was previously hard-coded in api.get-shipping-fee.tsx; centralised here
// so checkout and the quote endpoint cannot diverge.
const ZONE_MARKUP = 1.1;

export type CalcInput =
  | { deliveryType: "PICKUP" }
  | {
      deliveryType: "DELIVERY";
      postcode: string;
      deliveryWindow: DeliveryWindowKey;
    };

export type CalcResult =
  | {
      ok: true;
      total: number;
      zoneFee: number;
      windowSurcharge: number;
      zoneSuburb: string | null;
    }
  | {
      ok: false;
      error: string;
      code: "UNSUPPORTED_POSTCODE" | "INVALID_WINDOW";
    };

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function calculateDeliveryFee(input: CalcInput): Promise<CalcResult> {
  if (input.deliveryType === "PICKUP") {
    return { ok: true, total: 0, zoneFee: 0, windowSurcharge: 0, zoneSuburb: null };
  }

  if (!(input.deliveryWindow in DELIVERY_WINDOWS)) {
    return { ok: false, error: "Invalid delivery window", code: "INVALID_WINDOW" };
  }
  const windowSurcharge = DELIVERY_WINDOWS[input.deliveryWindow].surcharge;

  const normalised = input.postcode.trim();
  const zone = await prisma.shippingZone.findFirst({
    where: { postcode: normalised },
  });
  if (!zone) {
    return {
      ok: false,
      error: `We don't deliver to postcode ${normalised} yet.`,
      code: "UNSUPPORTED_POSTCODE",
    };
  }

  const zoneFee = round2(zone.medium * ZONE_MARKUP);
  return {
    ok: true,
    total: round2(zoneFee + windowSurcharge),
    zoneFee,
    windowSurcharge,
    zoneSuburb: zone.suburb,
  };
}
