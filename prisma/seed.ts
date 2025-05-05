import { PrismaClient } from '@prisma/client';
import productsData from "./products.json";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const adminEmail = "admin@123.com";
const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
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
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash("admin123", 10),
        name: "Default Admin",
        isAdmin: true,
      },
    });

    console.log("✅ Default admin created. Email: admin@flowershop.com / Password: admin123");
  } else {
    console.log("ℹ️ Admin already exists. Skipped creating default admin.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
