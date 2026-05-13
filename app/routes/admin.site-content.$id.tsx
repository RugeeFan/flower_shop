// app/routes/admin.site-content.$id.tsx
//
// Per-slug typed editor. The single Form posts back here and the action
// branches on slug to assemble the right shape (title/subtitle/content +
// imageUrl[] + Json data) for the DB. UI dispatches to a typed editor per
// slug; unknown slugs get a generic title/subtitle/content + dynamic image
// slots fallback.

import { ActionFunctionArgs, LoaderFunctionArgs, redirect, json } from "@remix-run/node";
import { Form, useLoaderData, useNavigate, useActionData } from "@remix-run/react";
import { useState } from "react";
import { prisma } from "~/lib/prisma.server";
import { useTranslation } from "react-i18next";
import ImageUploadField from "~/components/admin/ImageUploadField";
import { isValidImageUrl } from "~/lib/upload.server";
import {
  getMeta,
  type HomeBannerData,
  type PromotionBarData,
  type HomeInformationData,
} from "~/lib/site-content";

export async function loader({ params }: LoaderFunctionArgs) {
  const content = await prisma.pageContent.findUnique({
    where: { id: Number(params.id) },
  });

  if (!content) {
    throw new Response("Not Found", { status: 404 });
  }

  return { content, meta: getMeta(content.slug) ?? null };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const slug = formData.get("__slug")?.toString() ?? "";

  const title = formData.get("title")?.toString() ?? "";
  const subtitle = formData.get("subtitle")?.toString() ?? "";
  const content = formData.get("content")?.toString() ?? "";

  const rawImages = formData.getAll("imageUrl")
    .map((v) => v.toString().trim())
    .filter(Boolean);
  const bad = rawImages.find((u) => !isValidImageUrl(u));
  if (bad) {
    return json({ error: `图片路径无效：${bad}` }, { status: 400 });
  }

  // Build `data` JSON depending on slug. Unknown slugs save no data.
  let data: unknown = null;
  if (slug === "home-banner") {
    const primaryLabel = formData.get("primaryCtaLabel")?.toString().trim() ?? "";
    const primaryHref = formData.get("primaryCtaHref")?.toString().trim() ?? "";
    const secondaryLabel = formData.get("secondaryCtaLabel")?.toString().trim() ?? "";
    const secondaryHref = formData.get("secondaryCtaHref")?.toString().trim() ?? "";
    const banner: HomeBannerData = {};
    if (primaryLabel || primaryHref) {
      banner.primaryCta = { label: primaryLabel, href: primaryHref };
    }
    if (secondaryLabel || secondaryHref) {
      banner.secondaryCta = { label: secondaryLabel, href: secondaryHref };
    }
    data = banner;
  } else if (slug === "home-promotion-bar") {
    const enabled = formData.get("enabled") === "on";
    const promo: PromotionBarData = { enabled };
    data = promo;
  } else if (slug === "home-information") {
    const showLogo = formData.get("showLogo") === "on";
    const info: HomeInformationData = { showLogo };
    data = info;
  }

  await prisma.pageContent.update({
    where: { id: Number(params.id) },
    data: {
      title,
      subtitle,
      content,
      imageUrl: rawImages,
      data: (data ?? undefined) as object | undefined,
    },
  });

  return redirect("/admin/site-content");
}

type Slot = { key: string; url: string };
const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// ─── UI primitives ───────────────────────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1">
      <label className="block text-sm font-medium text-gray-800">{children}</label>
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function TextField({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      name={name}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function ImageSlotList({ initial }: { initial: string[] }) {
  const [slots, setSlots] = useState<Slot[]>(() =>
    (initial.length > 0 ? initial : [""]).map((u) => ({ key: newKey(), url: u })),
  );
  return (
    <div className="space-y-3">
      {slots.map((slot) => (
        <div key={slot.key} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
          <div className="flex-1">
            <ImageUploadField name="imageUrl" kind="content" defaultValue={slot.url} />
          </div>
          {slots.length > 1 && (
            <button
              type="button"
              onClick={() => setSlots((s) => s.filter((x) => x.key !== slot.key))}
              className="border border-red-300 text-red-600 hover:bg-red-50 text-sm px-3 py-2 rounded sm:self-start"
            >
              删除
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setSlots((s) => [...s, { key: newKey(), url: "" }])}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        + 添加图片
      </button>
    </div>
  );
}

// ─── Per-slug typed editors ──────────────────────────────────────────────────

function HomeBannerEditor({
  content,
}: {
  content: {
    title: string | null;
    subtitle: string | null;
    content: string | null;
    imageUrl: string[];
    data: unknown;
  };
}) {
  const d = (content.data ?? {}) as HomeBannerData;
  const primary = d.primaryCta ?? { label: "", href: "" };
  const secondary = d.secondaryCta ?? { label: "", href: "" };

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel hint="小号大写副标题，如 SYDNEY & SURROUNDS">小标题 (eyebrow)</FieldLabel>
        <TextField
          name="subtitle"
          defaultValue={content.subtitle ?? ""}
          placeholder="SYDNEY & SURROUNDS"
        />
      </div>

      <div>
        <FieldLabel hint="Hero 大标题，衬线字体。如 Mothers Day Off">主标题 (headline)</FieldLabel>
        <TextField
          name="content"
          defaultValue={content.content ?? ""}
          placeholder="Mothers Day Off"
        />
      </div>

      <div>
        <FieldLabel hint="标题下方的小段说明文字">辅助文案 (supporting)</FieldLabel>
        <textarea
          name="title"
          rows={2}
          defaultValue={content.title ?? ""}
          placeholder="Fresh Flowers Delivered Daily"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="border border-gray-200 rounded-md p-4 space-y-4 bg-gray-50">
        <div className="text-sm font-semibold text-gray-700">主按钮</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>按钮文字</FieldLabel>
            <TextField
              name="primaryCtaLabel"
              defaultValue={primary.label}
              placeholder="Shop the collection"
            />
          </div>
          <div>
            <FieldLabel>链接</FieldLabel>
            <TextField
              name="primaryCtaHref"
              defaultValue={primary.href}
              placeholder="/products"
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-md p-4 space-y-4 bg-gray-50">
        <div className="text-sm font-semibold text-gray-700">次按钮（文字链接）</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>按钮文字</FieldLabel>
            <TextField
              name="secondaryCtaLabel"
              defaultValue={secondary.label}
              placeholder="Our story"
            />
          </div>
          <div>
            <FieldLabel>链接</FieldLabel>
            <TextField
              name="secondaryCtaHref"
              defaultValue={secondary.href}
              placeholder="/about"
            />
          </div>
        </div>
      </div>

      <div>
        <FieldLabel hint="可以上传多张做轮播；只想要一张就留一个槽位。">背景图 / 轮播图</FieldLabel>
        <ImageSlotList initial={content.imageUrl} />
      </div>
    </div>
  );
}

function PromotionBarEditor({
  content,
}: {
  content: {
    title: string | null;
    subtitle: string | null;
    content: string | null;
    imageUrl: string[];
    data: unknown;
  };
}) {
  const d = (content.data ?? {}) as PromotionBarData;
  // Default to true if null/undefined (matches "show" semantic).
  const enabledDefault = d.enabled !== false;
  return (
    <div className="space-y-6">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={enabledDefault}
          className="h-4 w-4 accent-charcoal"
        />
        <span className="text-sm text-gray-800">在首页显示滚动条</span>
      </label>

      <div>
        <FieldLabel hint="滚动 marquee 第 1 段。空着不显示。">文案行 1</FieldLabel>
        <TextField
          name="title"
          defaultValue={content.title ?? ""}
          placeholder="Same-day delivery across Sydney"
        />
      </div>
      <div>
        <FieldLabel hint="滚动 marquee 第 2 段。空着不显示。">文案行 2</FieldLabel>
        <TextField
          name="subtitle"
          defaultValue={content.subtitle ?? ""}
          placeholder="Mon — Sat. Order before 2 PM."
        />
      </div>
      <div>
        <FieldLabel hint="滚动 marquee 第 3 段。空着不显示。">文案行 3</FieldLabel>
        <TextField
          name="content"
          defaultValue={content.content ?? ""}
          placeholder="Free pickup at Parramatta & Gordon"
        />
      </div>
    </div>
  );
}

function HomeInformationEditor({
  content,
}: {
  content: {
    title: string | null;
    subtitle: string | null;
    content: string | null;
    imageUrl: string[];
    data: unknown;
  };
}) {
  const d = (content.data ?? {}) as HomeInformationData;
  return (
    <div className="space-y-6">
      <div>
        <FieldLabel hint="首页底部分屏区的背景大图。一张就够，多张会按顺序保留但只显示第一张。">背景图</FieldLabel>
        <ImageSlotList initial={content.imageUrl} />
      </div>
      <div>
        <FieldLabel hint="衬线大标题，比如季节促销主题">主标题</FieldLabel>
        <TextField name="title" defaultValue={content.title ?? ""} placeholder="A note from the studio" />
      </div>
      <div>
        <FieldLabel hint="主标题下方的小段说明">副标题</FieldLabel>
        <TextField name="subtitle" defaultValue={content.subtitle ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="showLogo"
          defaultChecked={!!d.showLogo}
          className="h-4 w-4 accent-charcoal"
        />
        <span>在文字区上方显示店铺 Logo</span>
      </label>
    </div>
  );
}

function GenericEditor({
  content,
}: {
  content: {
    title: string | null;
    subtitle: string | null;
    content: string | null;
    imageUrl: string[];
  };
}) {
  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>标题</FieldLabel>
        <TextField name="title" defaultValue={content.title ?? ""} />
      </div>
      <div>
        <FieldLabel>副标题</FieldLabel>
        <TextField name="subtitle" defaultValue={content.subtitle ?? ""} />
      </div>
      <div>
        <FieldLabel>正文</FieldLabel>
        <textarea
          name="content"
          rows={4}
          defaultValue={content.content ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <FieldLabel>图片</FieldLabel>
        <ImageSlotList initial={content.imageUrl} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditSiteContent() {
  const { content, meta } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const { t } = useTranslation("admin");

  const renderEditor = () => {
    switch (content.slug) {
      case "home-banner":
        return <HomeBannerEditor content={content} />;
      case "home-promotion-bar":
        return <PromotionBarEditor content={content} />;
      case "home-information":
        return <HomeInformationEditor content={content} />;
      default:
        return <GenericEditor content={content} />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
          {meta?.area === "homepage" ? "Homepage" : "Site content"} · {content.slug}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {meta?.label ?? content.slug}
        </h1>
        {meta?.description && (
          <p className="text-sm text-gray-600 mt-1">{meta.description}</p>
        )}
      </div>

      {actionData && "error" in actionData && actionData.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-6">
        <input type="hidden" name="__slug" value={content.slug} />

        {renderEditor()}

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t("save")}
          </button>
        </div>
      </Form>
    </div>
  );
}
