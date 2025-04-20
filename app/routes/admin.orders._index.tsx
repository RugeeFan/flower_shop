import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import formatCurrency from "~/utils/formatCurrency";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("q")?.toLowerCase();

  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = keyword
    ? orders.filter((order) => {
      const user = order.user;
      return (
        user?.name?.toLowerCase().includes(keyword) ||
        user?.email?.toLowerCase().includes(keyword) ||
        user?.phone?.toLowerCase().includes(keyword) ||
        order.deliveryDate.toISOString().slice(0, 10).includes(keyword)
      );
    })
    : orders;

  return json({ orders: filtered, keyword });
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "delete") {
    const id = formData.get("id") as string;
    if (!id) return json({ error: "订单 ID 缺失" }, { status: 400 });

    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });

    return redirect("/admin/orders");
  }

  return json({ error: "未知操作" }, { status: 400 });
}

export default function AdminOrdersPage() {
  const { orders, keyword } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* 顶部标题 + 搜索 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">订单管理</h1>

        <form
          method="get"
          className="flex gap-2 w-full sm:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const input = form.querySelector("input[name='q']") as HTMLInputElement;
            setSearchParams({ q: input.value });
          }}
        >
          <input
            type="text"
            name="q"
            placeholder="搜索订单：姓名 / 电话 / 邮箱 / 日期"
            defaultValue={keyword || ""}
            className="border px-3 py-2 rounded w-full sm:w-80"
          />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
            搜索
          </button>
        </form>
      </div>

      {/* 桌面端表格 */}
      <div className="bg-white shadow border rounded overflow-x-auto hidden sm:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">订单号</th>
              <th className="text-left px-4 py-2">买家姓名</th>
              <th className="text-left px-4 py-2">邮箱</th>
              <th className="text-left px-4 py-2">电话</th>
              <th className="text-left px-4 py-2">金额</th>
              <th className="text-left px-4 py-2">状态</th>
              <th className="text-left px-4 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  没有符合条件的订单。
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-2">{order.id.slice(0, 8)}...</td>
                  <td className="px-4 py-2">{order.user?.name || "无名"}</td>
                  <td className="px-4 py-2">{order.user?.email || "-"}</td>
                  <td className="px-4 py-2">{order.user?.phone || "-"}</td>
                  <td className="px-4 py-2">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-2">{order.status}</td>
                  <td className="px-4 py-2 flex gap-2 items-center">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      查看
                    </Link>
                    <Form
                      method="post"
                      onSubmit={(e) => {
                        if (!window.confirm("确认要删除该订单吗？此操作无法撤销。")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="_intent" value="delete" />
                      <input type="hidden" name="id" value={order.id} />
                      <button
                        type="submit"
                        className="text-red-500 hover:underline"
                      >
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

      {/* 移动端卡片展示 */}
      <div className="block sm:hidden space-y-4">
        {orders.length === 0 ? (
          <p className="text-gray-500">没有符合条件的订单。</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm space-y-2">
              <div className="text-sm text-gray-600">
                <strong>订单号：</strong>{order.id.slice(0, 8)}...
              </div>
              <div className="text-sm text-gray-600">
                <strong>姓名：</strong>{order.user?.name || "无名"}
              </div>
              <div className="text-sm text-gray-600">
                <strong>邮箱：</strong>{order.user?.email || "-"}
              </div>
              <div className="text-sm text-gray-600">
                <strong>电话：</strong>{order.user?.phone || "-"}
              </div>
              <div className="text-sm text-gray-600">
                <strong>金额：</strong>{formatCurrency(order.totalAmount)}
              </div>
              <div className="text-sm text-gray-600">
                <strong>状态：</strong>
                <span className="ml-1 px-2 py-1 text-xs rounded bg-gray-100">
                  {order.status}
                </span>
              </div>
              <div className="flex gap-4 pt-1">
                <Link
                  to={`/admin/orders/${order.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  查看
                </Link>
                <Form
                  method="post"
                  onSubmit={(e) => {
                    if (!window.confirm("确认要删除该订单吗？此操作无法撤销。")) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="_intent" value="delete" />
                  <input type="hidden" name="id" value={order.id} />
                  <button
                    type="submit"
                    className="text-sm text-red-500 hover:underline"
                  >
                    删除
                  </button>
                </Form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
