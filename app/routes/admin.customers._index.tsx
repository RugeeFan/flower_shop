import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

export async function loader({ }: LoaderFunctionArgs) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        select: { id: true },
      },
    },
  });

  return json({ users });
}

export default function CustomerList() {
  const { users } = useLoaderData<typeof loader>();
  const { t } = useTranslation("admin");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">{t("users")}</h1>

      {/* ✅ 桌面端表格 */}
      <div className="overflow-x-auto hidden sm:block">
        <table className="w-full border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border-b">{t("email")}</th>
              <th className="p-3 border-b">{t("registeredAt")}</th>
              <th className="p-3 border-b">{t("isGoogleUser")}</th>
              <th className="p-3 border-b">{t("orderStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const hasOrders = user.orders.length > 0;
              const firstOrderId = hasOrders ? user.orders[0].id : null;

              return (
                <tr key={user.id} className="border-t">
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{new Date(user.createdAt).toLocaleString()}</td>
                  <td className="p-3">{user.googleId ? "✅" : "❌"}</td>
                  <td className="p-3">
                    {hasOrders ? (
                      <Link
                        to={`/admin/orders/${firstOrderId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {t("viewOrders")}
                      </Link>
                    ) : (
                      <span className="text-gray-400">{t("noOrder")}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ✅ 手机端卡片式展示 */}
      <div className="space-y-4 sm:hidden">
        {users.map((user) => {
          const hasOrders = user.orders.length > 0;
          const firstOrderId = hasOrders ? user.orders[0].id : null;

          return (
            <div
              key={user.id}
              className="border rounded-lg p-4 shadow-sm bg-white text-sm"
            >
              <div className="mb-2">
                <strong>{t("email")}:</strong> {user.email}
              </div>
              <div className="mb-2">
                <strong>{t("registeredAt")}:</strong>{" "}
                {new Date(user.createdAt).toLocaleString()}
              </div>
              <div className="mb-2">
                <strong>{t("isGoogleUser")}:</strong>{" "}
                {user.googleId ? "Yes" : "No"}
              </div>
              <div>
                <strong>{t("orderStatus")}:</strong>{" "}
                {hasOrders ? (
                  <Link
                    to={`/admin/orders/${firstOrderId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {t("viewOrders")}
                  </Link>
                ) : (
                  <span className="text-gray-400">{t("noOrder")}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
