import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = process.argv[2] ?? "admin@flower.shop";
const password = process.argv[3] ?? "admin123";

async function main() {
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, isAdmin: true },
    create: {
      email,
      password: hashed,
      isAdmin: true,
      name: "Admin",
    },
  });
  console.log(`✅ Admin ready: ${user.email} (id=${user.id})`);
  console.log(`   password: ${password}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
