// app/routes/api.search-products.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  if (!q || q.trim() === "") {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: q,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      imgUrl: true,
    },
    take: 10,
  });

  return new Response(JSON.stringify(products), {
    headers: { "Content-Type": "application/json" },
  });
};
