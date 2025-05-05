// shippingZoneSeed.ts
import 'dotenv/config'; // 👈 加在最顶部
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const raw = await fs.readFile(path.join(__dirname, 'shippingzone_renamed.json'), 'utf-8');
  const data = JSON.parse(raw);

  const entries = Object.entries(data);

  for (const [postcode, zones] of entries) {
    for (const zone of zones as any[]) {
      await prisma.shippingZone.create({
        data: {
          suburb: zone.suburb,
          postcode: postcode,
          km: parseFloat(zone.km),
          small: parseFloat(zone.small),
          medium: parseFloat(zone.medium),
          large: parseFloat(zone.large),
        },
      });
    }
  }

  console.log('✅ Shipping zones seeded.');
}

main()
  .catch((err) => {
    console.error('❌ Error seeding shipping zones:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
