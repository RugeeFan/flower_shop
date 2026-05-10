// app/routes/_index.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";

import Hero from "~/components/store/home/Hero";
import BestSell from "~/components/store/home/BestSell";
import CategoryList from "~/components/store/home/CategoryList";
import FollowUs from "~/components/store/home/FollowUs";
import Information from "~/components/store/home/Information";
import Intro from "~/components/store/home/Intro";

import type { ProductListItem } from "~/types/product";
import type { PageContent } from "@prisma/client"; // 假设你用了 Prisma 自动类型

import BackToTop from "~/components/store/BackToTop";

export const meta = () => {
  return [
    { title: "Royal Flower" },
    { name: "description", content: "The Best Flowers In Sydney" },
  ];
};

export async function loader({ }: LoaderFunctionArgs) {
  const [starProducts, banner] = await Promise.all([
    prisma.product.findMany({
      where: {
        categories: {
          some: {
            name: "star",
          },
        },
      },
      include: {
        categories: true,
      },
    }),
    prisma.pageContent.findUnique({
      where: { slug: "home-banner" },
    }),
  ]);

  const transformedProducts: ProductListItem[] = starProducts.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imgUrl: Array.isArray(p.imgUrl) ? p.imgUrl[0] : p.imgUrl,
  }));

  return json({ starProducts: transformedProducts, banner });
}

export default function Index() {
  const { starProducts, banner } = useLoaderData<{
    starProducts: ProductListItem[];
    banner: PageContent;
  }>();

  return (
    <>
      <Hero banner={banner} />
      <BestSell products={starProducts} />
      <CategoryList />
      <Intro />
      <FollowUs />
      <Information />
      <BackToTop />
    </>
  );
}
