// app/routes/admin.site-content._index.tsx
//
// Card list grouped by area (Homepage / Other). Each card surfaces the
// human label + description (from CONTENT_BLOCKS catalogue), the current
// title preview, last-updated timestamp, and an Edit button. Rows whose
// slug isn't in the catalogue fall into "Other" with a fallback label.

import { LoaderFunctionArgs, type SerializeFrom } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { CONTENT_BLOCKS, type ContentBlockMeta } from "~/lib/site-content";

export async function loader({}: LoaderFunctionArgs) {
  const contents = await prisma.pageContent.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return { contents };
}

type Row = SerializeFrom<typeof loader>["contents"][number];

function rowMeta(slug: string): ContentBlockMeta {
  const found = CONTENT_BLOCKS.find((c) => c.slug === slug);
  if (found) return found;
  return {
    slug,
    area: "other",
    label: slug,
    description: "未在目录里登记的内容块。",
  };
}

function Card({ row }: { row: Row }) {
  const meta = rowMeta(row.slug);
  const preview =
    row.title?.trim() ||
    row.subtitle?.trim() ||
    row.content?.trim() ||
    "（暂无文案）";
  const imageCount = row.imageUrl?.length ?? 0;
  return (
    <Link
      to={`/admin/site-content/${row.id}`}
      className="block border border-gray-200 rounded-lg p-4 sm:p-5 hover:border-blue-400 hover:shadow-sm transition bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
            {row.slug}
          </div>
          <div className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">
            {meta.label}
          </div>
          {meta.description && (
            <p className="text-sm text-gray-600 mt-1 leading-snug">
              {meta.description}
            </p>
          )}
        </div>
        <span className="shrink-0 text-blue-600 text-sm font-medium">
          编辑 →
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="truncate max-w-[260px] sm:max-w-[420px]">
          <span className="text-gray-400">当前：</span>
          {preview}
        </span>
        {imageCount > 0 && (
          <span className="text-gray-400">{imageCount} 张图</span>
        )}
        <span className="text-gray-400 ml-auto">
          {new Date(row.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}

export default function SiteContentAdminPage() {
  const { contents } = useLoaderData<typeof loader>();

  const homepage = contents.filter((c) => rowMeta(c.slug).area === "homepage");
  const other = contents.filter((c) => rowMeta(c.slug).area !== "homepage");

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">站点设置 · 内容</h1>
        <p className="text-sm text-gray-600 mt-1">
          管理首页与站点上可编辑的文案块、图片、链接。点任意卡片进入编辑。
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          首页板块
        </h2>
        {homepage.length === 0 ? (
          <p className="text-sm text-gray-500">暂无首页内容块。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homepage.map((row) => (
              <Card key={row.id} row={row} />
            ))}
          </div>
        )}
      </section>

      {other.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
            其他
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {other.map((row) => (
              <Card key={row.id} row={row} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
