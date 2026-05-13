/**
 * One-shot migration: download every external image URL referenced from the
 * database and rewrite the row to point at a local /uploads/.../migrated/ path.
 *
 * Tables migrated:
 *   - Product.imgUrl   (single string)
 *   - PageContent.imageUrl[]  (array)
 *
 * Behaviour:
 *   - Idempotent: rows already on /uploads/... are skipped.
 *   - Each remote image runs through the same sharp pipeline as live uploads
 *     (rotate+strip EXIF, max 2400px, webp@82). Output filename is a 24-char
 *     sha256 prefix of the processed bytes — identical images dedupe naturally.
 *   - Failures keep the original URL. No data loss.
 *
 * Run:
 *   npx tsx scripts/migrate-images-local.ts
 */

import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const prisma = new PrismaClient();
const UPLOADS_ROOT = resolve(process.cwd(), "uploads");
const MIGRATED_SUBDIR = "migrated";

function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

async function downloadAndStore(
  kind: "products" | "content",
  remoteUrl: string,
): Promise<string | null> {
  let buf: Buffer;
  try {
    const resp = await fetch(remoteUrl, { redirect: "follow" });
    if (!resp.ok) {
      console.warn(`  ✗ HTTP ${resp.status} ${remoteUrl}`);
      return null;
    }
    buf = Buffer.from(await resp.arrayBuffer());
  } catch (err) {
    console.warn(`  ✗ fetch ${remoteUrl}:`, err instanceof Error ? err.message : err);
    return null;
  }

  let processed: Buffer;
  try {
    processed = await sharp(buf)
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch (err) {
    console.warn(`  ✗ sharp ${remoteUrl}:`, err instanceof Error ? err.message : err);
    return null;
  }

  const hex = createHash("sha256").update(processed).digest("hex").slice(0, 24);
  const relDir = `${kind}/${MIGRATED_SUBDIR}`;
  const absDir = resolve(UPLOADS_ROOT, relDir);
  await mkdir(absDir, { recursive: true });
  const filename = `${hex}.webp`;
  const absPath = resolve(absDir, filename);
  try {
    await stat(absPath);
  } catch {
    await writeFile(absPath, processed);
  }
  return `/uploads/${relDir}/${filename}`;
}

async function migrateProducts() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, imgUrl: true },
  });
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  console.log(`\n[products] ${products.length} rows`);
  for (const p of products) {
    if (!isExternal(p.imgUrl)) {
      skipped++;
      continue;
    }
    const newUrl = await downloadAndStore("products", p.imgUrl);
    if (!newUrl) {
      failed++;
      continue;
    }
    await prisma.product.update({
      where: { id: p.id },
      data: { imgUrl: newUrl },
    });
    migrated++;
    console.log(`  ✓ ${p.name.slice(0, 40)} → ${newUrl}`);
  }
  console.log(`[products] migrated=${migrated} skipped=${skipped} failed=${failed}`);
}

async function migrateContent() {
  const rows = await prisma.pageContent.findMany({
    select: { id: true, slug: true, imageUrl: true },
  });
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  console.log(`\n[page-content] ${rows.length} rows`);
  for (const r of rows) {
    if (!r.imageUrl || r.imageUrl.length === 0) continue;
    const newArr: string[] = [];
    let rowChanged = false;
    for (const u of r.imageUrl) {
      if (!isExternal(u)) {
        newArr.push(u);
        skipped++;
        continue;
      }
      const newUrl = await downloadAndStore("content", u);
      if (!newUrl) {
        newArr.push(u);
        failed++;
        continue;
      }
      newArr.push(newUrl);
      rowChanged = true;
      migrated++;
      console.log(`  ✓ ${r.slug}: → ${newUrl}`);
    }
    if (rowChanged) {
      await prisma.pageContent.update({
        where: { id: r.id },
        data: { imageUrl: newArr },
      });
    }
  }
  console.log(`[page-content] migrated=${migrated} skipped=${skipped} failed=${failed}`);
}

async function main() {
  await migrateProducts();
  await migrateContent();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
