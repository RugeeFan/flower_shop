// Admin shipping-zone management.
// Read-only list + per-row inline edit of small/medium/large prices.
// Search by postcode prefix or suburb substring. No delete; the dataset
// of ~620 rows is reference data and the prune story would be
// substantially riskier than the value it'd add.

import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useSearchParams, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { prisma } from "~/lib/prisma.server";
import { requireAdmin } from "~/lib/auth.server";

const PAGE_SIZE = 50;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAdmin(request);
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const rawPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);

  const where = q
    ? {
        OR: [
          { postcode: { startsWith: q } },
          { suburb: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const total = await prisma.shippingZone.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Number.isFinite(rawPage) ? Math.min(Math.max(1, rawPage), pageCount) : 1;

  const zones = await prisma.shippingZone.findMany({
    where,
    orderBy: [{ postcode: "asc" }, { suburb: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return json({ zones, q, total, page, pageCount });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireAdmin(request);
  const form = await request.formData();
  const id = Number(form.get("id"));
  const small = Number(form.get("small"));
  const medium = Number(form.get("medium"));
  const large = Number(form.get("large"));

  if (!Number.isFinite(id) || id <= 0) {
    return json({ error: "Invalid zone id" }, { status: 400 });
  }
  for (const [k, v] of [
    ["small", small],
    ["medium", medium],
    ["large", large],
  ] as const) {
    if (!Number.isFinite(v) || v < 0 || v > 10000) {
      return json({ error: `Invalid ${k} price` }, { status: 400 });
    }
  }

  await prisma.shippingZone.update({
    where: { id },
    data: { small, medium, large },
  });

  // Preserve search/page so the admin lands back where they were.
  const url = new URL(request.url);
  const back = `/admin/shipping-zones?${url.searchParams.toString()}`;
  return redirect(back);
};

export default function ShippingZonesPage() {
  const { zones, q, total, page, pageCount } = useLoaderData<typeof loader>();
  const [params] = useSearchParams();
  const nav = useNavigation();
  const submitting = nav.state !== "idle";

  // Track which row's edit form is open so the bulk list stays compact.
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="p-2 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">运费管理</h1>
      <p className="text-sm text-gray-600 mb-6">
        共 {total} 条邮编。修改 small / medium / large 后保存，结账金额会立即使用新价格。
      </p>

      <Form method="get" className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="搜索 postcode 或 suburb，例如 2000 或 Sydney"
          className="flex-1 min-w-[200px] border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-black"
        >
          搜索
        </button>
        {q && (
          <a
            href="/admin/shipping-zones"
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
          >
            清除
          </a>
        )}
      </Form>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Postcode</th>
              <th className="px-3 py-2">Suburb</th>
              <th className="px-3 py-2 text-right">Small</th>
              <th className="px-3 py-2 text-right">Medium</th>
              <th className="px-3 py-2 text-right">Large</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id} className="border-t">
                {editingId === z.id ? (
                  <td colSpan={6} className="px-3 py-3 bg-amber-50">
                    <Form
                      method="post"
                      className="flex flex-wrap items-end gap-3"
                      onSubmit={() => setEditingId(null)}
                    >
                      <input type="hidden" name="id" value={z.id} />
                      <div>
                        <div className="text-xs text-gray-500">Postcode</div>
                        <div className="font-mono text-sm">{z.postcode}</div>
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-gray-500">Suburb</div>
                        <div className="text-sm">{z.suburb}</div>
                      </div>
                      <label className="block">
                        <span className="block text-xs text-gray-500">Small ($)</span>
                        <input
                          type="number"
                          step="0.01"
                          name="small"
                          defaultValue={z.small}
                          min={0}
                          max={10000}
                          required
                          className="w-24 border rounded px-2 py-1 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-xs text-gray-500">Medium ($)</span>
                        <input
                          type="number"
                          step="0.01"
                          name="medium"
                          defaultValue={z.medium}
                          min={0}
                          max={10000}
                          required
                          className="w-24 border rounded px-2 py-1 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-xs text-gray-500">Large ($)</span>
                        <input
                          type="number"
                          step="0.01"
                          name="large"
                          defaultValue={z.large}
                          min={0}
                          max={10000}
                          required
                          className="w-24 border rounded px-2 py-1 text-sm"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 border text-sm rounded hover:bg-gray-50"
                        >
                          取消
                        </button>
                      </div>
                    </Form>
                  </td>
                ) : (
                  <>
                    <td className="px-3 py-2 font-mono">{z.postcode}</td>
                    <td className="px-3 py-2">{z.suburb}</td>
                    <td className="px-3 py-2 text-right tabular-nums">${z.small.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">${z.medium.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">${z.large.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setEditingId(z.id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        编辑
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {zones.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  没有匹配的邮编。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex justify-center gap-2 text-sm">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
            const next = new URLSearchParams(params);
            next.set("page", String(p));
            return (
              <a
                key={p}
                href={`?${next.toString()}`}
                className={`px-3 py-1 border rounded ${
                  p === page ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-50"
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
