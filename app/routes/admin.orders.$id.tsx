import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { requireAdmin } from "~/lib/auth.server";
import {
  DELIVERY_WINDOWS,
  PICKUP_LOCATIONS,
  PICKUP_TIME_SLOTS,
} from "~/lib/delivery";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAdmin(request);
  if (!params.id) throw new Response("订单不存在", { status: 404 });
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order) throw new Response("订单不存在", { status: 404 });
  return json({ order });
};

export default function OrderDetailPage() {
  const { order } = useLoaderData<typeof loader>();
  const isPickup = order.deliveryType === "PICKUP";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to="/admin/orders" className="text-sm text-blue-600 hover:underline">
          ← 返回订单列表
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">订单详情</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-lg border p-5 shadow-sm space-y-2 text-sm">
          <h2 className="text-lg font-semibold mb-2">订单信息</h2>
          <div><strong>订单编号：</strong>{order.id}</div>
          <div>
            <strong>订单状态：</strong>
            <span className={`inline-block px-2 py-1 text-xs rounded ${order.status === "PAID" ? "bg-green-100 text-green-700" : order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
              {order.status}
            </span>
          </div>
          <div>
            <strong>履约方式：</strong>
            <span className={`inline-block ml-1 px-2 py-1 text-xs rounded ${isPickup ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
              {isPickup ? "店内自取" : "本地配送"}
            </span>
          </div>
          <div><strong>创建时间：</strong>{new Date(order.createdAt).toLocaleString()}</div>
          <div><strong>{isPickup ? "自取日期" : "配送日期"}：</strong>{new Date(order.deliveryDate).toLocaleDateString()}</div>
        </div>

        <div className="bg-white rounded-lg border p-5 shadow-sm space-y-2 text-sm">
          <h2 className="text-lg font-semibold mb-2">{isPickup ? "自取信息" : "收件人信息"}</h2>
          <div><strong>收件人：</strong>{order.recipientName}</div>
          <div><strong>邮箱：</strong>{order.recipientEmail}</div>
          {isPickup ? (
            <>
              {order.pickupLocation && (
                <>
                  <div><strong>取货门店：</strong>{PICKUP_LOCATIONS[order.pickupLocation].label}</div>
                  <div><strong>门店地址：</strong>{PICKUP_LOCATIONS[order.pickupLocation].address}</div>
                </>
              )}
              {order.pickupTimeSlot && (
                <div><strong>时间段：</strong>{PICKUP_TIME_SLOTS[order.pickupTimeSlot].label}</div>
              )}
            </>
          ) : (
            <>
              <div><strong>地址：</strong>{order.address}</div>
              <div><strong>邮编：</strong>{order.postcode}</div>
              {order.deliveryWindow && (
                <div><strong>配送时段：</strong>{DELIVERY_WINDOWS[order.deliveryWindow].label}</div>
              )}
            </>
          )}
          {order.message && <div><strong>留言：</strong>{order.message}</div>}
        </div>
      </div>

      {order.user && (
        <div className="bg-white rounded-lg border p-5 shadow-sm text-sm mb-10">
          <h2 className="text-lg font-semibold mb-2">下单用户</h2>
          <div><strong>姓名：</strong>{order.user.name || "未填写"}</div>
          <div><strong>Email：</strong>{order.user.email}</div>
          <div><strong>电话：</strong>{order.user.phone || "未提供"}</div>
        </div>
      )}

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
              <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-2">{item.product.name}</td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">${item.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-2">${(item.unitPrice * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-right space-y-1">
        {order.deliveryFee > 0 && (
          <div className="text-sm text-gray-700">
            优先配送加价：${order.deliveryFee.toFixed(2)}
          </div>
        )}
        <div className="text-lg font-bold">
          总金额: ${order.totalAmount.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
