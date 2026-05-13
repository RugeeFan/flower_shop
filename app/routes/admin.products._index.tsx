import {
  LoaderFunctionArgs,
  json,
  ActionFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  useLoaderData,
  Link,
  Form,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { prisma } from "~/lib/prisma.server";
import { requireAdmin } from "~/lib/auth.server";
import { formatCurrency } from "~/utils/money";
import { useTranslation } from "react-i18next";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "最新创建", orderBy: { createdAt: "desc" } as const },
  { value: "createdAt_asc",  label: "最早创建", orderBy: { createdAt: "asc"  } as const },
  { value: "price_desc",     label: "价格 高→低", orderBy: { price: "desc"   } as const },
  { value: "price_asc",      label: "价格 低→高", orderBy: { price: "asc"    } as const },
  { value: "name_asc",       label: "名称 A→Z",  orderBy: { name: "asc"     } as const },
];
const SORT_BY_VALUE = new Map(SORT_OPTIONS.map((o) => [o.value, o]));

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAdmin(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const categoryId = url.searchParams.get("categoryId")?.trim() ?? "";
  const sortKey = url.searchParams.get("sort")?.trim() ?? "createdAt_desc";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1") || 1);

  const sort = SORT_BY_VALUE.get(sortKey) ?? SORT_BY_VALUE.get("createdAt_desc")!;

  const where: Prisma.ProductWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (categoryId) where.categories = { some: { id: categoryId } };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { categories: true },
      orderBy: sort.orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return json({ products, q, page, total, categories, categoryId, sort: sort.value });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = form.get("_action");

  // Single-row delete (existing behaviour)
  if (intent === "delete") {
    const productId = form.get("productId")?.toString();
    if (productId) await prisma.product.delete({ where: { id: productId } });
    return redirect(request.headers.get("Referer") ?? "/admin/products");
  }

  // Bulk delete — accepts repeated `ids` form field. Filters out empty strings,
  // dedupes. deleteMany returns count; we surface it via redirect for now.
  if (intent === "bulkDelete") {
    const ids = Array.from(
      new Set(
        form
          .getAll("ids")
          .map((v) => v.toString().trim())
          .filter(Boolean),
      ),
    );
    if (ids.length > 0) {
      await prisma.product.deleteMany({ where: { id: { in: ids } } });
    }
    return redirect(request.headers.get("Referer") ?? "/admin/products");
  }

  return redirect("/admin/products");
};

function getResponsivePageNumbers(current: number, total: number, maxPages: number) {
  const pages: (number | "...")[] = [];
  if (total <= maxPages) return Array.from({ length: total }, (_, i) => i + 1);
  pages.push(1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

function buildQs(
  base: URLSearchParams,
  patch: Record<string, string | number | null | undefined>,
) {
  const p = new URLSearchParams(base);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === "") p.delete(k);
    else p.set(k, String(v));
  }
  return p.toString();
}

export default function AdminProductList() {
  const { products, q, page, total, categories, categoryId, sort } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("admin");

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  // Selection state. Resets when the visible products change (new page / new
  // filter) — admins shouldn't be able to "select" rows they can't see.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(products.map((p) => p.id)), [products]);
  useEffect(() => {
    setSelected((prev) => new Set(Array.from(prev).filter((id) => visibleIds.has(id))));
  }, [visibleIds]);

  const toggleAllVisible = (checked: boolean) => {
    if (checked) setSelected(new Set(products.map((p) => p.id)));
    else setSelected(new Set());
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allVisibleSelected =
    products.length > 0 && products.every((p) => selected.has(p.id));

  const [maxVisiblePages, setMaxVisiblePages] = useState(10);
  useEffect(() => {
    const handleResize = () => setMaxVisiblePages(window.innerWidth < 640 ? 5 : 10);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const pageList = getResponsivePageNumbers(page, totalPages, maxVisiblePages);
  const submitting = navigation.state !== "idle";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold">{t("products")}</h1>
          <p className="text-xs text-gray-500 mt-1">共 {total} 件商品</p>
        </div>
        <Link
          to="/admin/products/new"
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition text-sm"
        >
          {t("addProduct")}
        </Link>
      </div>

      {/* Filter bar */}
      <Form method="get" className="mb-4 grid grid-cols-1 sm:grid-cols-12 gap-2 items-stretch">
        <input
          type="text"
          name="q"
          placeholder={t("searchProductName")}
          defaultValue={q}
          className="sm:col-span-5 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
        />
        <select
          name="categoryId"
          defaultValue={categoryId}
          className="sm:col-span-3 border rounded px-3 py-2 text-sm"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="sm:col-span-2 border rounded px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="sm:col-span-1 bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-800 text-sm"
        >
          筛选
        </button>
        {(q || categoryId || sort !== "createdAt_desc") && (
          <Link
            to="/admin/products"
            className="sm:col-span-1 inline-flex items-center justify-center text-sm text-gray-500 hover:text-gray-800"
          >
            清空
          </Link>
        )}
      </Form>

      {/* Bulk action bar — sticky-feel placement above the list. Stays inert
          when nothing is selected. */}
      {products.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-4 px-3 py-2 bg-gray-50 border rounded text-sm">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(e) => toggleAllVisible(e.target.checked)}
              className="h-4 w-4 accent-charcoal"
            />
            <span className="text-gray-700">
              {selected.size > 0 ? `已选 ${selected.size} 项` : "全选当前页"}
            </span>
          </label>
          <Form
            method="post"
            onSubmit={(e) => {
              if (selected.size === 0) {
                e.preventDefault();
                return;
              }
              if (!window.confirm(`确认删除选中的 ${selected.size} 件商品？此操作不可撤销。`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="_action" value="bulkDelete" />
            {Array.from(selected).map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <button
              type="submit"
              disabled={selected.size === 0 || submitting}
              className="bg-red-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-40 hover:bg-red-700"
            >
              批量删除
            </button>
          </Form>
        </div>
      )}

      {/* Desktop table (≥md) */}
      <div className="hidden md:block bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 w-10">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(e) => toggleAllVisible(e.target.checked)}
                  className="h-4 w-4 accent-charcoal"
                  aria-label="全选当前页"
                />
              </th>
              <th className="text-left px-3 py-2 font-medium text-gray-700">图</th>
              <th className="text-left px-3 py-2 font-medium text-gray-700">名称</th>
              <th className="text-left px-3 py-2 font-medium text-gray-700">分类</th>
              <th className="text-right px-3 py-2 font-medium text-gray-700">价格</th>
              <th className="text-left px-3 py-2 font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  {t("noProducts")}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleOne(product.id)}
                      className="h-4 w-4 accent-charcoal"
                      aria-label={`选中 ${product.name}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {product.imgUrl ? (
                      <img
                        src={product.imgUrl}
                        alt={product.name}
                        className="w-12 h-14 object-cover rounded border bg-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-14 rounded border bg-gray-100" />
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-800">{product.name}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {product.categories.map((c) => c.name).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link
                      to={`/admin/products/${product.id}`}
                      className="text-blue-600 hover:underline text-xs mr-3"
                    >
                      {t("edit")}
                    </Link>
                    <Form
                      method="post"
                      className="inline"
                      onSubmit={(e) => {
                        if (!confirm(t("confirmDeleteProduct"))) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="_action" value="delete" />
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="text-red-600 hover:underline text-xs disabled:opacity-50"
                      >
                        {t("delete")}
                      </button>
                    </Form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards (<md) */}
      <div className="space-y-3 md:hidden">
        {products.length === 0 ? (
          <p className="text-gray-500 text-sm">{t("noProducts")}</p>
        ) : (
          products.map((product) => {
            const checked = selected.has(product.id);
            return (
              <div
                key={product.id}
                className={`border rounded-lg p-3 bg-white shadow-sm transition-colors ${
                  checked ? "border-charcoal ring-1 ring-charcoal/30" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(product.id)}
                    className="h-4 w-4 mt-1 accent-charcoal"
                    aria-label={`选中 ${product.name}`}
                  />
                  {product.imgUrl ? (
                    <img
                      src={product.imgUrl}
                      alt={product.name}
                      className="w-16 h-20 object-cover rounded border bg-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-20 rounded border bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="font-medium text-gray-900 truncate">{product.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {product.categories.map((c) => c.name).join(", ") || "—"}
                    </div>
                    <div className="text-sm font-semibold text-primary tabular-nums">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-3 mt-2 border-t border-gray-100 text-xs">
                  <Link to={`/admin/products/${product.id}`} className="text-blue-600 hover:underline">
                    {t("edit")}
                  </Link>
                  <Form
                    method="post"
                    className="ml-auto"
                    onSubmit={(e) => {
                      if (!confirm(t("confirmDeleteProduct"))) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="_action" value="delete" />
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {t("delete")}
                    </button>
                  </Form>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2 flex-wrap">
          {prevPage && (
            <Link
              to={`?${buildQs(searchParams, { page: prevPage })}`}
              className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 text-sm"
            >
              « {t("prevPage")}
            </Link>
          )}
          {pageList.map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-3 py-1.5 text-gray-400 select-none text-sm">
                ...
              </span>
            ) : (
              <Link
                key={p}
                to={`?${buildQs(searchParams, { page: p })}`}
                className={`px-3 py-1.5 rounded border text-sm ${
                  p === page
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-800 hover:bg-gray-50"
                }`}
              >
                {p}
              </Link>
            ),
          )}
          {nextPage && (
            <Link
              to={`?${buildQs(searchParams, { page: nextPage })}`}
              className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 text-sm"
            >
              {t("nextPage")} »
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
