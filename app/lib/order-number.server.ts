// Human-facing order numbers: RR-YYYYMMDD-NN, where the date is the shop's
// local (Sydney) date and NN is a per-day sequence starting at 01.
//
// Uniqueness is enforced by the DB unique index on Order.orderNumber. Two
// concurrent checkouts can race to the same candidate number, so callers
// create the order inside `withOrderNumberRetry`, which regenerates and
// retries on a unique-constraint violation.

import { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.server";

const SYDNEY_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Australia/Sydney",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function sydneyDateStamp(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD; strip the dashes.
  return SYDNEY_DATE.format(date).replaceAll("-", "");
}

export async function nextOrderNumber(): Promise<string> {
  const prefix = `RR-${sydneyDateStamp()}-`;
  // Numeric max, not lexicographic — "-100" sorts before "-99" as a string.
  const todays = await prisma.order.findMany({
    where: { orderNumber: { startsWith: prefix } },
    select: { orderNumber: true },
  });
  const lastSeq = todays.reduce((max, o) => {
    const n = parseInt(o.orderNumber.slice(prefix.length), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `${prefix}${String(lastSeq + 1).padStart(2, "0")}`;
}

export async function withOrderNumberRetry<T>(
  create: (orderNumber: string) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const orderNumber = await nextOrderNumber();
    try {
      return await create(orderNumber);
    } catch (err) {
      const isOrderNumberCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        (err.meta?.target as string[] | undefined)?.includes("orderNumber");
      if (!isOrderNumberCollision || attempt >= 5) throw err;
    }
  }
}
