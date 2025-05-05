// app/routes/api.get-shipping-fee.tsx
import { json } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const postcode = url.searchParams.get("postcode");

  if (!postcode) {
    return json({ error: "缺少 postcode 参数" }, { status: 400 });
  }

  const zones = await prisma.shippingZone.findMany({
    where: { postcode },
  });

  if (zones.length === 0) {
    return json({ error: "找不到对应邮编" }, { status: 404 });
  }

  // 默认选第一条记录作为代表
  const zone = zones[0];

  return json({
    suburb: zone.suburb,
    price: parseFloat(zone.small.toFixed(2)), // 你可以根据条件选择 small / medium / large
  });
}
