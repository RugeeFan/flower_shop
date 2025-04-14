import { PrismaClient } from "../generated/prisma";
import productsData from "./products.json";

const prisma = new PrismaClient();

async function main() {
  for (const product of productsData) {
    const { name, price, description, imageUrl, categories } = product;

    const numericPrice = parseFloat(price.replace("$", ""));

    // 先处理分类
    const categoryConnect = categories.map((cat: string) => ({
      where: { name: cat },
      create: { name: cat },
    }));

    await prisma.product.create({
      data: {
        name,
        price: numericPrice,
        description,
        imgUrl: imageUrl,
        categories: {
          connectOrCreate: categoryConnect,
        },
      },
    });

    console.log(`✅ Created: ${name}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
