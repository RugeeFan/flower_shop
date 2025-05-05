import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { prisma } from "~/lib/prisma.server";
import { DashboardCard } from "~/components/admin/DashboardCard";

export async function loader({ }: LoaderFunctionArgs) {
  const [orderCount, totalSales, productCount, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.product.count(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        recipientName: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },

    }),
  ]);

  return json({
    stats: {
      orderCount,
      totalSales: Number((totalSales._sum.totalAmount ?? 0).toFixed(2)),
      productCount,
    },
    recentOrders,
  });
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function AdminDashboard() {
  const { stats, recentOrders } = useLoaderData<LoaderData>();
  const { t } = useTranslation("admin");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{t("welcome")}</h1>
        <p className="text-gray-600">{t("overview")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <DashboardCard title={t("totalOrders")} value={String(stats.orderCount)} icon="ri-shopping-bag-line" />
        <DashboardCard title={t("totalSales")} value={`$${stats.totalSales}`} icon="ri-money-dollar-circle-line" />
        <DashboardCard title={t("productCount")} value={String(stats.productCount)} icon="ri-blossom-line" />
        <DashboardCard title={t("pendingFeature")} value="--" icon="ri-bar-chart-line" />
      </div>

      <div className="bg-white border rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold p-4 border-b">{t("recentOrders")}</h2>

        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">{t("orderId")}</th>
                <th className="px-4 py-2">{t("buyer")}</th>
                <th className="px-4 py-2">{t("recipient")}</th>
                <th className="px-4 py-2">{t("status")}</th>
                <th className="px-4 py-2">{t("orderDate")}</th>
                <th className="px-4 py-2 text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => (
                <tr key={order.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2">{order.id}</td>
                  <td className="px-4 py-2">{order.user?.name || "-"}</td>
                  <td className="px-4 py-2">{order.recipientName}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${order.status === "PAID"
                      ? "bg-green-100 text-green-700"
                      : order.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {t("view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="block sm:hidden p-4 space-y-4">
          {recentOrders.map((order) => (
            <div key={order.id} className="border rounded-md p-4 shadow-sm bg-gray-50">
              <div className="text-sm mb-2 text-gray-600">{t("orderId")}：<span className="text-gray-800">{order.id}</span></div>
              <div className="text-sm mb-2 text-gray-600">{t("buyer")}：<span className="text-gray-800">{order.user?.name || "-"}</span></div>
              <div className="text-sm mb-2 text-gray-600">{t("recipient")}：<span className="text-gray-800">{order.recipientName}</span></div>
              <div className="text-sm mb-2 text-gray-600">
                {t("status")}：
                <span className={`ml-1 inline-block px-2 py-1 text-xs rounded ${order.status === "PAID"
                  ? "bg-green-100 text-green-700"
                  : order.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                  {order.status}
                </span>
              </div>
              <div className="text-sm mb-3 text-gray-600">
                {t("orderDate")}：<span className="text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <Link
                to={`/admin/orders/${order.id}`}
                className="inline-block text-sm text-blue-600 hover:underline"
              >
                {t("view")} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
