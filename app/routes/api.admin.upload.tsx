import {
  json,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  MaxPartSizeExceededError,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { requireAdmin } from "~/lib/auth.server";
import {
  saveImageUpload,
  UPLOAD_KINDS,
  MAX_UPLOAD_BYTES,
  UploadError,
  type UploadKind,
} from "~/lib/upload.server";

// POST /api/admin/upload
//   multipart/form-data
//     file: <binary> (required)
//     kind: "products" | "content" | "settings" (required)
//
// Returns 200 { url, mime, bytes, width, height }
//      or 4xx { error, code }

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1. Auth — same gate as every other admin route. Throws redirect if not admin.
  await requireAdmin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed", code: "METHOD" }, { status: 405 });
  }

  // 2. Multipart parse with strict size cap. Anything over 8 MB throws
  //    MaxPartSizeExceededError before we even see the buffer.
  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: MAX_UPLOAD_BYTES,
  });

  let formData: FormData;
  try {
    formData = await unstable_parseMultipartFormData(request, uploadHandler);
  } catch (err) {
    if (err instanceof MaxPartSizeExceededError) {
      return json(
        { error: "File exceeds 8 MB limit", code: "TOO_LARGE" },
        { status: 413 },
      );
    }
    return json(
      { error: "Could not parse upload", code: "PARSE" },
      { status: 400 },
    );
  }

  // 3. Validate kind
  const rawKind = formData.get("kind");
  const kind = typeof rawKind === "string" ? rawKind : "";
  if (!UPLOAD_KINDS.includes(kind as UploadKind)) {
    return json(
      { error: "Invalid or missing 'kind' field", code: "INVALID_KIND" },
      { status: 400 },
    );
  }

  // 4. Pull file. With memory handler, file becomes a `File` (Web API).
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return json(
      { error: "Missing 'file' field", code: "MISSING_FILE" },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 5. Hand off to the validator/processor. saveImageUpload throws UploadError
  //    for any rejection — magic-byte sniff, sharp decode, dimension cap, etc.
  try {
    const saved = await saveImageUpload(buffer, kind as UploadKind);
    return json(saved, { status: 200 });
  } catch (err) {
    if (err instanceof UploadError) {
      return json({ error: err.message, code: err.code }, { status: 400 });
    }
    console.error("[upload] unexpected error:", err);
    return json(
      { error: "Upload failed", code: "INTERNAL" },
      { status: 500 },
    );
  }
};

// Block accidental GETs — /api/admin/upload is action-only.
export const loader = () => {
  return json({ error: "Method not allowed", code: "METHOD" }, { status: 405 });
};
