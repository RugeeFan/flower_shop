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
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">订单详情</h1>

      <Link to="/admin/orders" className="text-blue-600 hover:underline mb-4 block">
        ← 返回订单列表
      </Link>

      <div className="mb-6 border p-4 rounded space-y-2 text-sm">
        <div>订单编号: {order.id}</div>
        <div>订单状态: {order.status}</div>
        <div>创建时间: {new Date(order.createdAt).toLocaleString()}</div>
      </div>

      <h2 className="text-lg font-semibold mb-2">收件人信息</h2>
      <div className="border p-4 rounded space-y-1 text-sm mb-6">
        <div>姓名: {order.recipientName}</div>
        <div>邮箱: {order.recipientEmail}</div>
        <div>地址: {order.address}</div>
        <div>邮编: {order.postcode}</div>
        <div>配送日期: {new Date(order.deliveryDate).toLocaleDateString()}</div>
        {order.message && <div>留言: {order.message}</div>}
      </div>

      {order.user && (
        <>
          <h2 className="text-lg font-semibold mb-2">下单用户</h2>
          <div className="border p-4 rounded text-sm mb-6">
            用户 Email: {order.user.email}
          </div>
        </>
      )}

      <h2 className="text-lg font-semibold mb-2">商品明细</h2>
      <div className="border rounded overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">商品名称</th>
              <th className="p-3 text-left">数量</th>
              <th className="p-3 text-left">单价</th>
              <th className="p-3 text-left">小计</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.product.name}</td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">${item.unitPrice.toFixed(2)}</td>
                <td className="p-3">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-right text-lg font-bold">
        总金额: ${order.totalAmount.toFixed(2)}
      </div>
    </div>
  );
}
