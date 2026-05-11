#!/usr/bin/env -S node --experimental-strip-types
/* eslint-disable no-console */
/**
 * uploads-prune — list (or delete) orphaned files under uploads/.
 *
 * An orphan = a file under uploads/ that no row in the database references
 * via Product.imgUrl, PageContent.imageUrl, or SiteSetting.value (parsed
 * JSON, look for imageUrl). External (http/https) URLs are ignored;
 * only `/uploads/...` paths count as references.
 *
 * Usage:
 *
 *   # Dry run (default) — just print what would be removed:
 *   npx tsx scripts/uploads-prune.ts
 *
 *   # Actually delete:
 *   npx tsx scripts/uploads-prune.ts --delete
 *
 *   # Only consider files older than N days (default 0 = all):
 *   MIN_AGE_DAYS=7 npx tsx scripts/uploads-prune.ts
 *
 *   # Use a different uploads root (default ./uploads):
 *   UPLOADS_DIR=/opt/royalrose/uploads npx tsx scripts/uploads-prune.ts
 *
 * Designed to be safe to run on production:
 *   * defaults to dry-run
 *   * never touches anything outside the resolved uploads root
 *   * skips files modified in the last MIN_AGE_DAYS (avoids killing a
 *     freshly-uploaded image whose row hasn't been saved yet)
 *   * exits 0 even if no orphans found
 */

import { PrismaClient } from "@prisma/client";
import { readdir, stat, unlink } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? "./uploads");
const DRY_RUN = !process.argv.includes("--delete");
const MIN_AGE_DAYS = Number(process.env.MIN_AGE_DAYS ?? 0);
const MIN_AGE_MS = MIN_AGE_DAYS * 24 * 60 * 60 * 1000;

const prisma = new PrismaClient();

async function listReferenced(): Promise<Set<string>> {
  const refs = new Set<string>();
  const add = (raw: unknown) => {
    if (typeof raw !== "string") return;
    const v = raw.trim();
    if (v.startsWith("/uploads/")) refs.add(v);
  };

  // Product.imgUrl — String
  for (const p of await prisma.product.findMany({ select: { imgUrl: true } })) {
    add(p.imgUrl);
  }

  // PageContent.imageUrl — String[]
  for (const c of await prisma.pageContent.findMany({
    select: { imageUrl: true },
  })) {
    if (Array.isArray(c.imageUrl)) c.imageUrl.forEach(add);
  }

  // SiteSetting.value — JSON-encoded objects which may carry an `imageUrl`
  for (const s of await prisma.siteSetting.findMany({
    select: { value: true },
  })) {
    try {
      const parsed = JSON.parse(s.value);
      if (parsed && typeof parsed === "object") {
        const maybe = (parsed as Record<string, unknown>).imageUrl;
        if (Array.isArray(maybe)) maybe.forEach(add);
        else add(maybe);
      }
    } catch {
      /* ignore non-JSON site_setting rows */
    }
  }

  return refs;
}

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (ent.name.startsWith(".")) continue; // skip .gitkeep, .gitignore
    const full = join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(full);
    else if (ent.isFile()) yield full;
  }
}

async function main() {
  console.log(`uploads-prune — root: ${UPLOADS_DIR}`);
  console.log(`mode: ${DRY_RUN ? "DRY RUN (no deletions)" : "DELETE"}`);
  if (MIN_AGE_DAYS > 0) {
    console.log(`min-age filter: skip files modified within ${MIN_AGE_DAYS} days`);
  }
  console.log();

  const referenced = await listReferenced();
  console.log(`referenced /uploads/ paths in DB: ${referenced.size}`);

  const now = Date.now();
  const orphans: { absPath: string; rel: string; bytes: number; ageDays: number }[] = [];
  let totalFiles = 0;

  for await (const absPath of walk(UPLOADS_DIR)) {
    // Defense in depth — never act outside UPLOADS_DIR.
    if (!absPath.startsWith(UPLOADS_DIR + sep) && absPath !== UPLOADS_DIR) {
      continue;
    }
    totalFiles++;
    const rel = "/" + relative(resolve(UPLOADS_DIR, ".."), absPath);
    // rel is like "/uploads/products/2026-05-11/abc.webp" if UPLOADS_DIR is
    // <project>/uploads. We need to ensure the public URL representation
    // matches what the upload pipeline stores.
    const publicUrl =
      "/" + relative(resolve(UPLOADS_DIR, ".."), absPath).split(sep).join("/");
    if (referenced.has(publicUrl)) continue;

    const st = await stat(absPath);
    const ageMs = now - st.mtimeMs;
    if (MIN_AGE_MS > 0 && ageMs < MIN_AGE_MS) {
      continue;
    }
    orphans.push({
      absPath,
      rel: publicUrl,
      bytes: st.size,
      ageDays: ageMs / (24 * 60 * 60 * 1000),
    });
  }

  console.log(`files on disk:                   ${totalFiles}`);
  console.log(`orphans (not referenced in DB):  ${orphans.length}`);
  console.log();

  if (orphans.length === 0) {
    console.log("nothing to do.");
    await prisma.$disconnect();
    return;
  }

  // Sort biggest first to show worst offenders.
  orphans.sort((a, b) => b.bytes - a.bytes);

  let totalBytes = 0;
  for (const o of orphans) {
    totalBytes += o.bytes;
    const kb = (o.bytes / 1024).toFixed(1);
    console.log(`  ${o.rel}  (${kb} KB, ${o.ageDays.toFixed(1)}d old)`);
  }
  console.log();
  console.log(`total: ${orphans.length} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

  if (DRY_RUN) {
    console.log();
    console.log("(dry run — re-run with --delete to remove these files)");
    await prisma.$disconnect();
    return;
  }

  console.log();
  console.log("deleting...");
  let deleted = 0;
  for (const o of orphans) {
    try {
      await unlink(o.absPath);
      deleted++;
    } catch (err) {
      console.error(`  failed: ${o.rel} — ${(err as Error).message}`);
    }
  }
  console.log(`deleted ${deleted} / ${orphans.length} files.`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("uploads-prune failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
