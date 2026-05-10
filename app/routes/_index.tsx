// app/routes/_index.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { getInformationBanner } from "~/lib/settings.server";

import Hero from "~/components/store/home/Hero";
import BestSell from "~/components/store/home/BestSell";
import CategoryList from "~/components/store/home/CategoryList";
import FollowUs from "~/components/store/home/FollowUs";
import Information from "~/components/store/home/Information";
import Intro from "~/components/store/home/Intro";

import type { Product } from "~/types/product";
import type { PageContent } from "@prisma/client";

export const meta = () => {
  return [
    { title: "Royal Flower" },
    { name: "description", content: "The Best Flowers In Sydney" },
  ];
};

export async function loader({}: LoaderFunctionArgs) {
  const [starProducts, banner, informationBanner] = await Promise.all([
    prisma.product.findMany({
      where: { categories: { some: { name: "star" } } },
      include: { categories: true },
    }),
    prisma.pageContent.findUnique({
      where: { slug: "home-banner" },
    }),
    getInformationBanner(),
  ]);

  const transformedProducts: Product[] = starProducts.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    imgUrl: Array.isArray(p.imgUrl) ? p.imgUrl[0] : p.imgUrl,
    categories: p.categories.map((c) => ({ id: c.id, name: c.name })),
  }));

  return json({ starProducts: transformedProducts, banner, informationBanner });
}

export default function Index() {
  const { starProducts, banner, informationBanner } = useLoaderData<{
    starProducts: Product[];
    banner: PageContent | null;
    informationBanner: Awaited<ReturnType<typeof getInformationBanner>>;
  }>();

  return (
    <>
      <Hero banner={banner} />
      <BestSell products={starProducts} />
      <CategoryList />
      <Intro />
      <FollowUs />
      <Information banner={informationBanner} />
    </>
  );
}
