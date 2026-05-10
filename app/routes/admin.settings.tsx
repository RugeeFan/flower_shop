import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth.server";
import { getInformationBanner, setInformationBanner } from "~/lib/settings.server";
import ImageUploadField from "~/components/admin/ImageUploadField";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const banner = await getInformationBanner();
  return json({ banner });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const imageUrl = String(form.get("imageUrl") || "").trim();
  const title = String(form.get("title") || "").trim();
  const subtitle = String(form.get("subtitle") || "").trim();
  const showLogo = form.get("showLogo") === "on";

  if (!imageUrl) {
    return json({ error: "图片 URL 不能为空" }, { status: 400 });
  }
  // Accept either:
  //   (a) an absolute http(s) URL, e.g. https://cdn.example.com/foo.jpg
  //   (b) a same-origin relative path written by the upload pipeline,
  //       e.g. /uploads/settings/2026-05-11/abc.webp
  // Reject everything else — including javascript:/data:/file: schemes,
  // and relative paths containing traversal segments or off-list extensions.
  // The /uploads/* splat route also blocks bad paths at serve time;
  // this is defense in depth so the DB never holds garbage either.
  const REL_UPLOAD_RE =
    /^\/uploads\/(products|content|settings)\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(webp|jpg|jpeg|png)$/;
  if (imageUrl.startsWith("/")) {
    if (!REL_UPLOAD_RE.test(imageUrl)) {
      return json({ error: "图片路径无效" }, { status: 400 });
    }
  } else {
    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      return json({ error: "图片 URL 格式无效" }, { status: 400 });
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return json({ error: "图片 URL 必须为 http/https" }, { status: 400 });
    }
  }

  await setInformationBanner({ imageUrl, title, subtitle, showLogo });
  return redirect("/admin/settings?saved=1");
}

export default function AdminSettingsPage() {
  const { banner } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const submitting = nav.state !== "idle";
  const saved =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("saved") === "1";

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">站点设置</h1>
      <p className="text-gray-600 mb-6">
        编辑首页底部 banner 的背景图与文字（与首页 Hero 区一致的可视化区块）。
      </p>

      {actionData && "error" in actionData && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {actionData.error}
        </div>
      )}
      {saved && !actionData && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          设置已保存
        </div>
      )}

      <Form method="post" className="space-y-5 bg-white border rounded-lg p-6">
        <ImageUploadField
          name="imageUrl"
          kind="settings"
          label="背景图片 URL *"
          defaultValue={banner.imageUrl}
          required
        />

        <div>
          <label className="block font-medium mb-1">主标题</label>
          <input
            name="title"
            defaultValue={banner.title}
            placeholder="留空则不显示"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">副标题</label>
          <input
            name="subtitle"
            defaultValue={banner.subtitle}
            placeholder="留空则不显示"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="showLogo"
            defaultChecked={banner.showLogo}
          />
          <span>显示店铺 Logo</span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "保存中..." : "保存"}
        </button>
      </Form>
    </div>
  );
}
