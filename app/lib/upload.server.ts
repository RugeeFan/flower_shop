import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

// ─── Configuration ────────────────────────────────────────────────────────
//
// IMAGE upload pipeline. Conservative by design:
//   * Only jpg / jpeg / png / webp accepted (svg/gif/avif rejected)
//   * Max 8 MB raw upload (enforced upstream by the multipart handler)
//   * Server-side magic-byte sniff — never trust client mime/extension
//   * Max decoded size 6000×6000 to defeat pixel bombs
//   * EXIF stripped (sharp.withMetadata({}) by default removes everything)
//   * Output normalized to WebP for size + consistency
//   * Filename re-generated server-side from random hex (12 bytes)
//   * Final disk path is resolved + verified to start under uploadsRoot

export const UPLOAD_KINDS = ["products", "content", "settings"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

// uploads/ lives next to package.json — bind-mounted in production.
const UPLOADS_ROOT = resolve(process.cwd(), "uploads");

export class UploadError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "UploadError";
  }
}

// ─── Magic byte sniff ─────────────────────────────────────────────────────
// Don't trust client-sent mime; sniff first few bytes.
// JPEG: FF D8 FF
// PNG : 89 50 4E 47 0D 0A 1A 0A
// WebP: bytes 0..3 "RIFF",  bytes 8..11 "WEBP"

function sniffMime(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────

export interface SavedImage {
  /** Public relative URL, e.g. "/uploads/products/2026-05-11/abc123.webp" */
  url: string;
  mime: "image/webp";
  bytes: number;
  width: number;
  height: number;
}

/**
 * Validate, normalize and persist an image upload to disk under uploads/<kind>/<date>/<hex>.webp.
 * Always outputs WebP, regardless of input format. EXIF is stripped.
 *
 * Throws `UploadError` for any rejected input — never writes a partial file.
 */
export async function saveImageUpload(
  buffer: Buffer,
  kind: UploadKind,
): Promise<SavedImage> {
  // 1. Kind whitelist (defense in depth — route also enforces)
  if (!UPLOAD_KINDS.includes(kind)) {
    throw new UploadError("Invalid upload kind", "INVALID_KIND");
  }

  // 2. Size check (route enforces upstream too)
  if (buffer.length === 0) {
    throw new UploadError("Empty file", "EMPTY");
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new UploadError("File exceeds 8 MB", "TOO_LARGE");
  }

  // 3. Magic-byte sniff. Reject anything that isn't jpeg/png/webp.
  //    SVG, GIF, AVIF, and everything else falls through to null and is rejected.
  const sniffed = sniffMime(buffer);
  if (!sniffed) {
    throw new UploadError(
      "Unsupported image format. Use JPEG, PNG, or WebP.",
      "UNSUPPORTED_FORMAT",
    );
  }

  // 4. Decode + normalize via sharp. sharp validates the image is real.
  //    pixelLimit guards against decompression bombs.
  let pipeline: sharp.Sharp;
  try {
    pipeline = sharp(buffer, {
      // pixelLimit default is ~268M; tighten further for safety.
      limitInputPixels: 50_000_000,
      failOn: "truncated",
    });
  } catch {
    throw new UploadError("Could not parse image", "DECODE_FAILED");
  }

  let metadata: sharp.Metadata;
  try {
    metadata = await pipeline.metadata();
  } catch {
    throw new UploadError("Could not read image metadata", "DECODE_FAILED");
  }

  if (!metadata.width || !metadata.height) {
    throw new UploadError("Image has no dimensions", "DECODE_FAILED");
  }
  if (metadata.width > 6000 || metadata.height > 6000) {
    throw new UploadError(
      "Image dimensions exceed 6000×6000",
      "TOO_LARGE_DIMENSIONS",
    );
  }

  // 5. Process: rotate (respect orientation), strip metadata, cap to 2400px,
  //    output as WebP at quality 82 (visually lossless for product photos).
  const processed = await pipeline
    .rotate() // applies + removes EXIF orientation tag
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  // 6. Build safe destination path:
  //    uploads/<kind>/<YYYY-MM-DD>/<24-hex>.webp
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const hex = randomBytes(12).toString("hex"); // 24 chars, ~96 bits entropy
  const filename = `${hex}.webp`;
  const relDir = join(kind, today); // products/2026-05-11
  const absDir = resolve(UPLOADS_ROOT, relDir);

  // 7. Path-traversal defense: normalized absolute path MUST start with
  //    UPLOADS_ROOT + path separator. If kind/date ever contained "..",
  //    resolve() would walk out — we reject.
  if (!absDir.startsWith(UPLOADS_ROOT + "/") && absDir !== UPLOADS_ROOT) {
    throw new UploadError("Path resolution escaped uploads root", "PATH_ESCAPE");
  }

  await mkdir(absDir, { recursive: true });

  const absPath = resolve(absDir, filename);
  if (!absPath.startsWith(UPLOADS_ROOT + "/")) {
    throw new UploadError("Path resolution escaped uploads root", "PATH_ESCAPE");
  }

  await writeFile(absPath, processed.data);

  // 8. Return relative URL — DB stores this as-is, frontend renders it via
  //    same-origin <img src>.
  const publicUrl = `/uploads/${relDir}/${filename}`;

  return {
    url: publicUrl,
    mime: "image/webp",
    bytes: processed.info.size,
    width: processed.info.width,
    height: processed.info.height,
  };
}

/**
 * Resolve a public /uploads/... URL to an absolute disk path,
 * verifying it stays inside UPLOADS_ROOT. Used by the static-serve route.
 *
 * Returns null if the URL is malformed or escapes the root.
 */
export function resolveUploadPath(publicPath: string): string | null {
  // publicPath is everything after /uploads/, e.g. "products/2026-05-11/abc.webp"
  if (!publicPath || publicPath.includes("\0")) return null;

  // Reject any explicit traversal segments
  const segments = publicPath.split("/");
  if (segments.some((s) => s === "" || s === "." || s === "..")) return null;

  const abs = resolve(UPLOADS_ROOT, publicPath);
  if (!abs.startsWith(UPLOADS_ROOT + "/")) return null;
  return abs;
}

/**
 * Whitelist of file extensions we'll serve back via the /uploads/ route.
 * Even though we only WRITE .webp, accept jpg/png to be future-proof
 * with externally-shipped uploads (e.g. backup restores).
 */
export const SERVABLE_EXTENSIONS: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/**
 * Accepts either a same-origin upload path or an absolute http(s) URL.
 * Rejects javascript:/data:/file:, traversal segments, off-list extensions.
 * Used by admin routes that store imgUrl strings in the DB.
 */
const REL_UPLOAD_RE =
  /^\/uploads\/(products|content|settings)\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(webp|jpg|jpeg|png)$/;
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return REL_UPLOAD_RE.test(url);
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
