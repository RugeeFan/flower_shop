import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) throw new Response("Missing ID", { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) throw new Response("Order Not Found", { status: 404 });

  return json({ order });
}

export default function AdminOrderDetail() {
  const { order } = useLoaderData<typeof loader>();
  const { t } = useTranslation("admin");

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const shippingFee = order.totalAmount - subtotal;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{t("orderDetails")}</h1>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4 text-sm">
        {/* 订单信息 */}
        <div className="text-gray-700 space-y-1">
          <div><span className="font-medium">{t("orderId")}:</span> {order.id}</div>
          <div><span className="font-medium">{t("buyer")}:</span> {order.user?.name || "-"}</div>
          <div><span className="font-medium">{t("email")}:</span> {order.user?.email || "-"}</div>
          <div><span className="font-medium">{t("phone")}:</span> {order.user?.phone || "-"}</div>
          <br />
          <div><span className="font-medium">{t("recipient")}:</span> {order.recipientName}</div>
          <div><span className="font-medium">{t("recipientEmail")}:</span> {order.recipientEmail}</div>
          <div><span className="font-medium">{t("recipientPhone")}:</span> {order.recipientPhone}</div>
          <div><span className="font-medium">{t("address")}:</span> {order.address}</div>
          <div><span className="font-medium">{t("postcode")}:</span> {order.postcode}</div>
          <div><span className="font-medium">{t("deliveryDate")}:</span> {new Date(order.deliveryDate).toLocaleDateString()}</div>
          <div>
            <span className="font-medium">{t("message")}:</span>
            <div className="mt-1 p-3 rounded border bg-gray-50 text-gray-800 whitespace-pre-line">
              {order.message || "—"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">{t("status")}:</span>
            <span
              className={`px-2 py-1 text-xs rounded font-semibold
      ${order.status === "PAID"
                  ? "bg-green-100 text-green-700"
                  : order.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
            >
              {order.status}
            </span>
          </div>

        </div>

        {/* 商品列表 */}
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-3">{t("orderItems")}</h2>
          <ul className="divide-y">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-4"
              >
                {/* 图片 */}
                <img
                  src={
                    Array.isArray(item.product.imgUrl)
                      ? item.product.imgUrl[0]
                      : item.product.imgUrl
                  }
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded border"
                />

                {/* 名称 + 数量 × 单价 */}
                <div className="flex-1 text-gray-800">
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-sm text-gray-600">
                    x{item.quantity} × ${item.unitPrice.toFixed(2)}
                  </div>
                </div>

                {/* 小计 */}
                <div className="text-right font-semibold text-gray-800 w-24">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 金额合计 */}
        <div className="mt-6 text-right text-sm space-y-1">
          <div className="flex justify-end gap-8">
            <span className="text-gray-700">{t("subtotal")}:</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-end gap-8">
            <span className="text-gray-700">{t("shippingFee") || "Shipping Fee"}:</span>
            <span className="font-medium">${shippingFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-end gap-8 text-lg font-bold pt-2 border-t mt-2">
            <span>{t("totalAmount")}:</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="text-right mt-3">
            <button
              onClick={() => window.print()}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 print:hidden"
            >
              🖨️ {t("print")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
