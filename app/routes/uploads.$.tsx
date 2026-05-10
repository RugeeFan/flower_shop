import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname } from "node:path";
import { Readable } from "node:stream";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  resolveUploadPath,
  SERVABLE_EXTENSIONS,
} from "~/lib/upload.server";

// GET /uploads/<...> — static serve for user-uploaded images.
//
// Security:
//   * Path goes through resolveUploadPath() which rejects traversal segments
//     and verifies the resolved absolute path lives inside UPLOADS_ROOT.
//   * Extension whitelist (.webp/.jpg/.jpeg/.png) — anything else returns 404
//     even if the file exists, so a stray .env or .ts under uploads/ would
//     never leak.
//   * Strong cache headers: filenames carry random hex so cache-immutable is safe.
//
// Note: this is route-level serve. Future optimization is to let Nginx serve
// /uploads/ directly via `alias`, bypassing Node entirely.

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const splat = params["*"];
  if (!splat) {
    return new Response("Not Found", { status: 404 });
  }

  // Reject anything not in our extension whitelist.
  const ext = extname(splat).toLowerCase();
  const contentType = SERVABLE_EXTENSIONS[ext];
  if (!contentType) {
    return new Response("Not Found", { status: 404 });
  }

  // Resolve + path-traversal check.
  const absPath = resolveUploadPath(splat);
  if (!absPath) {
    return new Response("Not Found", { status: 404 });
  }

  // Stat file. If missing or not a regular file, 404.
  let fileStat;
  try {
    fileStat = await stat(absPath);
  } catch {
    return new Response("Not Found", { status: 404 });
  }
  if (!fileStat.isFile()) {
    return new Response("Not Found", { status: 404 });
  }

  // Stream it. Convert Node Readable -> Web ReadableStream explicitly so
  // the Response body is a documented, supported type — avoids relying on
  // Remix's accidental tolerance of Node streams in BodyInit.
  const nodeStream = createReadStream(absPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileStat.size),
      // Filenames are random hex → content is immutable per URL.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
