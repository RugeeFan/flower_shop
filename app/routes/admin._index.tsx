import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { requireAdmin } from "~/lib/auth.server";
import { DashboardCard } from "~/components/admin/DashboardCard";

// 🔁 加载真实统计数据
export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const [orderCount, totalSales, productCount, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
    }),
    prisma.product.count(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        recipientName: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return json({
    stats: {
      orderCount,
      totalSales: totalSales._sum.totalAmount ?? 0,
      productCount,
    },
    recentOrders,
  });
}

export default function AdminDashboard() {
  const { stats, recentOrders } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 欢迎语 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">欢迎回来 🌸</h1>
        <p className="text-gray-600">以下是当前店铺的概览数据：</p>
      </div>

      {/* 数据卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <DashboardCard title="订单总数" value={String(stats.orderCount)} icon="ri-shopping-bag-line" />
        <DashboardCard title="销售总额" value={`$${stats.totalSales}`} icon="ri-money-dollar-circle-line" />
        <DashboardCard title="商品数量" value={String(stats.productCount)} icon="ri-blossom-line" />
        <DashboardCard title="待开发功能" value={"--"} icon="ri-bar-chart-line" />
      </div>

      {/* 最近订单 */}
      <div className="bg-white border rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold p-4 border-b">最近订单</h2>

        {/* 桌面端表格 */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">订单号</th>
                <th className="px-4 py-2">收件人</th>
                <th className="px-4 py-2">状态</th>
                <th className="px-4 py-2">下单时间</th>
                <th className="px-4 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => (
                <tr key={order.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2">{order.orderNumber}</td>
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
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 移动端卡片式订单展示 */}
        <div className="block sm:hidden p-4 space-y-4">
          {recentOrders.map((order) => (
            <div key={order.id} className="border rounded-md p-4 shadow-sm bg-gray-50">
              <div className="text-sm mb-2 text-gray-600">订单号：<span className="text-gray-800">{order.orderNumber}</span></div>
              <div className="text-sm mb-2 text-gray-600">收件人：<span className="text-gray-800">{order.recipientName}</span></div>
              <div className="text-sm mb-2 text-gray-600">
                状态：
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
                下单时间：<span className="text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <Link
                to={`/admin/orders/${order.id}`}
                className="inline-block text-sm text-blue-600 hover:underline"
              >
                查看详情 →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

