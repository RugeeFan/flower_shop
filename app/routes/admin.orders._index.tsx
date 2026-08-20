import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { requireAdmin } from "~/lib/auth.server";
import formatCurrency from "~/utils/formatCurrency";
import type { Prisma, OrderStatus } from "@prisma/client";

const PAGE_SIZE = 20;

// UI-side enum mirror — keeps the dropdown stable even if Prisma's generated
// types churn during dev. Server-side validates against this list before
// passing to the query.
const STATUS_OPTIONS: { value: OrderStatus; label: string; className: string }[] = [
  { value: "PENDING",   label: "待支付",  className: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "PAID",      label: "已支付",  className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "SHIPPED",   label: "已发货",  className: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "DELIVERED", label: "已完成",  className: "bg-gray-200 text-gray-700 border-gray-300" },
  { value: "CANCELLED", label: "已取消",  className: "bg-rose-100 text-rose-700 border-rose-200" },
];
const STATUS_VALUES = new Set(STATUS_OPTIONS.map((s) => s.value));

function statusBadge(status: OrderStatus) {
  const s = STATUS_OPTIONS.find((o) => o.value === status);
  if (!s) {
    return (
      <span className="inline-block px-2 py-0.5 text-xs rounded border bg-gray-100 text-gray-700 border-gray-200">
        {String(status)}
      </span>
    );
  }
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded border ${s.className}`}>
      {s.label}
    </span>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const statusRaw = url.searchParams.get("status")?.trim() ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1") || 1);

  const status: OrderStatus | undefined =
    statusRaw && STATUS_VALUES.has(statusRaw as OrderStatus)
      ? (statusRaw as OrderStatus)
      : undefined;

  // Build a single Prisma where clause. Keyword search hits buyer fields,
  // recipient fields, and the order id prefix — all in one OR. Status (if set)
  // applies as an AND on top.
  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { id: { contains: q, mode: "insensitive" } },
      {
        user: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      { recipientName: { contains: q, mode: "insensitive" } },
      { recipientEmail: { contains: q, mode: "insensitive" } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  return json({ orders, q, status: statusRaw, page, total, pageSize: PAGE_SIZE });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "delete") {
    const id = formData.get("id") as string;
    if (!id) return json({ error: "订单 ID 缺失" }, { status: 400 });
    // OrderItem.order has onDelete: Cascade — items go with the parent.
    await prisma.order.delete({ where: { id } });
    return redirect(request.headers.get("Referer") ?? "/admin/orders");
  }

  return json({ error: "未知操作" }, { status: 400 });
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

export default function AdminOrdersPage() {
  const { orders, q, status, page, total, pageSize } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <div className="max-w-6xl mx-auto space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">订单管理</h1>
        <Form method="get" className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input
            type="text"
            name="q"
            placeholder="搜索：订单号 / 买家姓名 / 邮箱 / 电话 / 收件人"
            defaultValue={q || ""}
            className="border px-3 py-2 rounded text-sm flex-1"
          />
          <select
            name="status"
            defaultValue={status || ""}
            className="border px-3 py-2 rounded text-sm sm:w-40"
          >
            <option value="">全部状态</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded text-sm">
            筛选
          </button>
          {(q || status) && (
            <Link
              to="/admin/orders"
              className="text-sm text-gray-500 hover:text-gray-800 self-center sm:self-auto"
            >
              清空
            </Link>
          )}
        </Form>
        <div className="text-xs text-gray-500">
          共 {total} 条订单
          {q && <> · 关键词 <code className="bg-gray-100 px-1 rounded">{q}</code></>}
          {status && (
            <> · 状态 <span className="inline-block align-middle">{statusBadge(status as OrderStatus)}</span></>
          )}
        </div>
      </div>

      {/* Desktop table (≥sm) */}
      <div className="bg-white border rounded overflow-x-auto hidden sm:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-700">订单号</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">买家</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">联系方式</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">履约</th>
              <th className="text-right px-4 py-2 font-medium text-gray-700">金额</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">状态</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">时间</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  没有符合条件的订单。
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-2">{order.user?.name || order.recipientName || "—"}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {order.user?.email || "-"}<br />
                    {order.user?.phone || ""}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded border ${
                        order.deliveryType === "PICKUP"
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                      }`}
                    >
                      {order.deliveryType === "PICKUP" ? "自取" : "配送"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-2">{statusBadge(order.status)}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-blue-600 hover:underline text-xs mr-3"
                    >
                      查看
                    </Link>
                    <Form
                      method="post"
                      className="inline"
                      onSubmit={(e) => {
                        if (!window.confirm("确认删除该订单？此操作不可撤销。")) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="_intent" value="delete" />
                      <input type="hidden" name="id" value={order.id} />
                      <button type="submit" className="text-red-500 hover:underline text-xs">
                        删除
                      </button>
                    </Form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards (<sm) */}
      <div className="space-y-3 sm:hidden">
        {orders.length === 0 ? (
          <p className="text-gray-500 text-sm">没有符合条件的订单。</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-gray-500">{order.orderNumber}</span>
                {statusBadge(order.status)}
              </div>
              <div className="text-sm font-medium text-gray-800">
                {order.user?.name || order.recipientName || "—"}
              </div>
              <div className="text-xs text-gray-600 space-y-0.5">
                {order.user?.email && <div>📧 {order.user.email}</div>}
                {order.user?.phone && <div>📱 {order.user.phone}</div>}
              </div>
              <div className="flex items-center justify-between text-sm pt-1">
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded border ${
                    order.deliveryType === "PICKUP"
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : "bg-blue-100 text-blue-700 border-blue-200"
                  }`}
                >
                  {order.deliveryType === "PICKUP" ? "自取" : "配送"}
                </span>
                <span className="font-semibold tabular-nums">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(order.createdAt).toLocaleString()}
              </div>
              <div className="flex gap-4 pt-1 border-t border-gray-100 mt-2">
                <Link to={`/admin/orders/${order.id}`} className="text-sm text-blue-600 hover:underline">
                  查看详情
                </Link>
                <Form
                  method="post"
                  className="ml-auto"
                  onSubmit={(e) => {
                    if (!window.confirm("确认删除该订单？此操作不可撤销。")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="_intent" value="delete" />
                  <input type="hidden" name="id" value={order.id} />
                  <button type="submit" className="text-sm text-red-500 hover:underline">
                    删除
                  </button>
                </Form>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {prevPage && (
            <Link
              to={`?${buildQs(searchParams, { page: prevPage })}`}
              className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 text-sm"
            >
              « 上一页
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-gray-500">
            第 {page} / {totalPages} 页
          </span>
          {nextPage && (
            <Link
              to={`?${buildQs(searchParams, { page: nextPage })}`}
              className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 text-sm"
            >
              下一页 »
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
