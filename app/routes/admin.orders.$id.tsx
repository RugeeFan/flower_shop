import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";

export const loader = async ({ params }: { params: { id: string } }) => {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Response("订单不存在", { status: 404 });
  }

  return json({ order });
};

export default function OrderDetailPage() {
  const { order } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link
          to="/admin/orders"
          className="text-sm text-blue-600 hover:underline"
        >
          ← 返回订单列表
        </Link>
      </div>

      {/* 标题 */}
      <h1 className="text-2xl font-bold mb-6">订单详情</h1>

      {/* 上部信息区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* 订单信息 */}
        <div className="bg-white rounded-lg border p-5 shadow-sm space-y-2 text-sm">
          <h2 className="text-lg font-semibold mb-2">订单信息</h2>
          <div><strong>订单编号：</strong>{order.id}</div>
          <div>
            <strong>订单状态：</strong>
            <span className={`inline-block px-2 py-1 text-xs rounded ${order.status === "PAID"
              ? "bg-green-100 text-green-700"
              : order.status === "PENDING"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-600"
              }`}>
              {order.status}
            </span>
          </div>
          <div><strong>创建时间：</strong>{new Date(order.createdAt).toLocaleString()}</div>
          <div><strong>配送日期：</strong>{new Date(order.deliveryDate).toLocaleDateString()}</div>
        </div>

        {/* 收件人信息 */}
        <div className="bg-white rounded-lg border p-5 shadow-sm space-y-2 text-sm">
          <h2 className="text-lg font-semibold mb-2">收件人信息</h2>
          <div><strong>姓名：</strong>{order.recipientName}</div>
          <div><strong>邮箱：</strong>{order.recipientEmail}</div>
          <div><strong>地址：</strong>{order.address}</div>
          <div><strong>邮编：</strong>{order.postcode}</div>
          {order.message && (
            <div><strong>留言：</strong>{order.message}</div>
          )}
        </div>
      </div>

      {/* 下单用户 */}
      {order.user && (
        <div className="bg-white rounded-lg border p-5 shadow-sm text-sm mb-10">
          <h2 className="text-lg font-semibold mb-2">下单用户</h2>
          <div><strong>姓名：</strong>{order.user.name || "未填写"}</div>
          <div><strong>Email：</strong>{order.user.email}</div>
          <div><strong>电话：</strong>{order.user.phone || "未提供"}</div>
        </div>
      )}

      {/* 商品明细 */}
      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto text-sm">
        <h2 className="text-lg font-semibold p-4 border-b">商品明细</h2>
        <table className="w-full table-auto">
          <thead className="bg-gray-50 border-b text-left">
            <tr>
              <th className="px-4 py-2">商品名称</th>
              <th className="px-4 py-2">数量</th>
              <th className="px-4 py-2">单价</th>
              <th className="px-4 py-2">小计</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr
                key={item.id}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-4 py-2">{item.product.name}</td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">${item.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-2">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 总金额 */}
      <div className="mt-6 text-right text-lg font-bold">
        总金额: ${order.totalAmount.toFixed(2)}
      </div>
    </div>
  );
}
