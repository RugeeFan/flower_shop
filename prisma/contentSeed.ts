// prisma/contentSeed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.pageContent.createMany({
    data: [
      {
        slug: "home-banner",
        title: "Fresh Flowers Delivered Daily",
        subtitle: "Sydney & Surrounds",
        content: "Discover our wide selection of premium bouquets delivered straight to your door. Fresh, fast, and fabulous!",
        imageUrl: ["https://example.com/banner.jpg"],
      },
      {
        slug: "home-promotion-bar",
        title: "Mother's Day Sale!",
        subtitle: "20% off all bouquets",
        content: "Celebrate Mother's Day with our special discounts on all flower arrangements. Offer ends soon!",
        imageUrl: [],
      },
      {
        slug: "home-content-section",
        title: "Why Choose Us?",
        subtitle: "",
        content: "At Royal Rose, we pride ourselves on offering the freshest flowers, timely delivery, and exceptional customer service. Your satisfaction is our priority.",
        imageUrl: [],
      },
      {
        slug: "home-feature-1",
        title: "Same-Day Delivery",
        subtitle: "",
        content: "Order before 2 PM and enjoy same-day flower delivery across Sydney and surrounding areas.",
        imageUrl: [],
      },
      {
        slug: "home-feature-2",
        title: "Handcrafted Bouquets",
        subtitle: "",
        content: "Each bouquet is designed by our expert florists with care, love, and attention to detail.",
        imageUrl: [],
      },
    ],
    skipDuplicates: true, // 防止重复插入
  });
}

main()
  .then(async () => {
    console.log("✅ Content seed completed.");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Content seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
