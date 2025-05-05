import { json } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";

export async function loader() {
  const products = await prisma.product.findMany({
    where: {
      categories: {
        some: {
          name: "add-on", // 这里是categories中有一个category.name是"add-on"
        },
      },
    },
    take: 3,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      price: true,
      imgUrl: true,
    },
  });

  return json(products);
}
