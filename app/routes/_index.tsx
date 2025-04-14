import { MetaFunction } from "@remix-run/node";

import BestSell from "~/components/store/home/BestSell";
import CategoryList from "~/components/store/home/CategoryList";
import FollowUs from "~/components/store/home/FollowUs";
import Hero from "~/components/store/home/Hero";
import Information from "~/components/store/home/Information";
import Intro from "~/components/store/home/Intro";

export const meta: MetaFunction = () => {
  return [
    { title: "Royal Flower" },
    { name: "description", content: "The Best Flowers In Sydney" },
  ];
};

export default function Index() {
  return (
    <>
      <Hero />
      <BestSell />
      <CategoryList />
      <Intro />
      <FollowUs />
      <Information />
    </>
  );
}
