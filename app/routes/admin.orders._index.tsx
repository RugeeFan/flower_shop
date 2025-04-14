import { json } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { recipientName: { contains: q, mode: "insensitive" } },
        { recipientEmail: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return json({ orders, q });
};

export default function OrderList() {
  const { orders, q } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">订单管理</h1>

      {/* 搜索 */}
      <Form method="get" className="mb-4 flex gap-2">
        <input
          type="text"
          name="q"
          placeholder="搜索邮箱或收件人"
          defaultValue={q}
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          type="submit"
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          搜索
        </button>
      </Form>

      <div className="overflow-x-auto border rounded shadow-sm">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">收件人</th>
              <th className="p-3 text-left">邮箱</th>
              <th className="p-3 text-left">金额</th>
              <th className="p-3 text-left">状态</th>
              <th className="p-3 text-left">下单时间</th>
              <th className="p-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  暂无订单
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{order.recipientName}</td>
                  <td className="p-3">{order.recipientEmail}</td>
                  <td className="p-3">${order.totalAmount.toFixed(2)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${order.status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "SHIPPED"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "DELIVERED"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                        }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <a
                      href={`/admin/orders/${order.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      查看
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
