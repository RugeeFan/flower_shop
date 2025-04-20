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
import Header from "~/components/store/header";
import Footer from "~/components/store/footer";

export const meta = () => {
  return [
    { title: "Royal Flower" },
    { name: "description", content: "The Best Flowers In Sydney" },
  ];
};

export async function loader({ }: LoaderFunctionArgs) {
  const starProducts = await prisma.product.findMany({
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
  });

  const transformedProducts: ProductListItem[] = starProducts.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imgUrl: Array.isArray(p.imgUrl) ? p.imgUrl[0] : p.imgUrl, // 取第一张图片
  }));

  return json({ starProducts: transformedProducts });
}

export default function Index() {
  const { starProducts } = useLoaderData<{ starProducts: ProductListItem[] }>();

  return (
    <>
      {/* <Header /> */}
      <Hero />
      <BestSell products={starProducts} />
      <CategoryList />
      <Intro />
      <FollowUs />
      <Information />
      {/* <Footer /> */}
    </>
  );
}
