import { useRef, useState, useEffect } from "react";

interface ImageUploadFieldProps {
  /** Form field name — what the action will read via formData.get(name). */
  name: string;
  /** "products" / "content" / "settings" — chooses upload destination subdir. */
  kind: "products" | "content" | "settings";
  /** Initial URL (e.g. existing imgUrl when editing). */
  defaultValue?: string;
  /** Required form field — submits empty if no URL. */
  required?: boolean;
  /** Optional label shown above the field. */
  label?: string;
  /** Override the whole input row class for layout. */
  className?: string;
  /** Allow manually pasting a remote URL (default true). */
  allowManualUrl?: boolean;
}

/**
 * Image upload + URL field. Uploads via /api/admin/upload, then writes the
 * returned relative URL back into the URL input so the surrounding <Form>
 * submits as if the admin had pasted it manually.
 *
 * Backwards-compatible with existing data — the URL input still accepts any
 * external URL (Cloudinary, etc.).
 */
export default function ImageUploadField({
  name,
  kind,
  defaultValue = "",
  required = false,
  label,
  className,
  allowManualUrl = true,
}: ImageUploadFieldProps) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep state in sync if defaultValue changes (e.g. switching edit target).
  useEffect(() => {
    setUrl(defaultValue);
  }, [defaultValue]);

  const handleFile = async (file: File) => {
    setError(null);

    // Client-side guards (server still re-checks).
    if (file.size > 8 * 1024 * 1024) {
      setError("File exceeds 8 MB.");
      return;
    }
    const allowedClient = ["image/jpeg", "image/png", "image/webp"];
    if (file.type && !allowedClient.includes(file.type)) {
      setError("Use JPEG, PNG, or WebP.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as
        | { url: string; mime: string; bytes: number }
        | { error: string; code: string };
      if (!res.ok || !("url" in data)) {
        setError("error" in data ? data.error : "Upload failed.");
        return;
      }
      setUrl(data.url);
    } catch (err) {
      setError("Network error during upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onPickClick = () => fileInputRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
  };

  return (
    <div className={className ?? "space-y-3"}>
      {label && <label className="block font-medium">{label}</label>}

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          name={name}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required={required}
          readOnly={!allowManualUrl}
          placeholder="/uploads/... or https://..."
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={onPickClick}
          disabled={uploading}
          className="inline-flex items-center justify-center gap-2 border border-charcoal text-charcoal hover:bg-charcoal hover:text-bone disabled:opacity-50 px-4 py-2 text-[12px] font-medium uppercase tracking-eyebrow transition-colors"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {error && (
        <p className="text-[12px] text-red-600">
          {error}
        </p>
      )}

      {/* Preview */}
      {url && (
        <div className="border border-border bg-cream/40 p-3 inline-flex items-center gap-3 max-w-full">
          <img
            src={url}
            alt="Preview"
            className="w-20 h-20 object-cover bg-white"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="text-[12px] text-ink-muted break-all min-w-0">
            {url}
          </div>
        </div>
      )}

      <p className="text-[11px] text-ink-muted">
        JPEG / PNG / WebP. Max 8 MB. Stored under <code>/uploads/{kind}/</code>.
        Pasting an external URL still works.
      </p>
    </div>
  );
}
