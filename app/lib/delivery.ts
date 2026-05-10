// Shared constants + helpers for delivery / pickup options.
// Imported by both server (API) and client (checkout form).

export const PRIORITY_DELIVERY_FEE = 30;

export const PICKUP_LOCATIONS = {
  PARRAMATTA: {
    label: "Parramatta",
    address:
      "Parramatta Square, Shop 4.09, Building 4/12 Darcy St, Parramatta NSW 2150",
    note: "Underground, opposite Parramatta Train Station entrance",
  },
  GORDON: {
    label: "Gordon",
    address: "7a/802-808 Pacific Hwy, Gordon NSW 2072",
    note: "",
  },
} as const;

export type PickupLocationKey = keyof typeof PICKUP_LOCATIONS;

export const PICKUP_TIME_SLOTS = {
  SLOT_8_11: { label: "8:00 AM – 11:00 AM", startHour: 8, endHour: 11 },
  SLOT_11_14: { label: "11:00 AM – 2:00 PM", startHour: 11, endHour: 14 },
  SLOT_14_18: { label: "2:00 PM – 6:00 PM", startHour: 14, endHour: 18 },
} as const;

export type PickupTimeSlotKey = keyof typeof PICKUP_TIME_SLOTS;

export const DELIVERY_WINDOWS = {
  RESIDENTIAL: { label: "Residential (9:00 AM – 6:00 PM)", surcharge: 0 },
  BUSINESS_SCHOOL: { label: "Business / School (9:00 AM – 4:00 PM)", surcharge: 0 },
  PRIORITY: {
    label: `Priority Delivery (within 4 hours) +$${PRIORITY_DELIVERY_FEE}`,
    surcharge: PRIORITY_DELIVERY_FEE,
  },
} as const;

export type DeliveryWindowKey = keyof typeof DELIVERY_WINDOWS;

// "Orders placed after 6:00 PM are available from 11:00 AM next day"
// Returns whether the pickup slot start is in the allowed window relative to `now`.
export function isPickupSlotAvailable(
  pickupDateISO: string, // YYYY-MM-DD
  slot: PickupTimeSlotKey,
  now: Date = new Date(),
): boolean {
  const [y, m, d] = pickupDateISO.split("-").map(Number);
  if (!y || !m || !d) return false;
  const slotStart = new Date(y, m - 1, d, PICKUP_TIME_SLOTS[slot].startHour, 0, 0, 0);

  const sixPmToday = new Date(now);
  sixPmToday.setHours(18, 0, 0, 0);

  if (now >= sixPmToday) {
    // After 6pm: earliest = tomorrow 11:00
    const elevenAmTomorrow = new Date(sixPmToday);
    elevenAmTomorrow.setDate(elevenAmTomorrow.getDate() + 1);
    elevenAmTomorrow.setHours(11, 0, 0, 0);
    return slotStart >= elevenAmTomorrow;
  }
  return slotStart > now;
}

export function deliverySurcharge(window: DeliveryWindowKey): number {
  return DELIVERY_WINDOWS[window].surcharge;
}
