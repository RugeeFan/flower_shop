import { useEffect, useState } from "react";

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  deliveryDate: string;
  recipientName: string;
  recipientEmail: string;
  address: string;
  postcode: string;
  message?: string;
}

interface CustomerInfo {
  email: string;
  orders: Order[];
}

export default function CustomerDropDown() {
  const [data, setData] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user-orders")
      .then((res) => res.json())
      .then((info) => {
        setData(info);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white border border-primary shadow-lg rounded-xl z-50 p-4 text-sm text-gray-800">
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      ) : (
        <>
          <div className="mb-2">
            <span className="font-semibold text-primary">📧 {data?.email}</span>
          </div>

          <div className="border-t border-gray-200 my-3"></div>

          <div>
            <div className="font-medium mb-1 text-primary">📋 Recent Orders：</div>
            {data?.orders?.length ? (
              <ul className="space-y-2">
                {data.orders.slice(0, 3).map((order) => (
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
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">No Orders</div>
            )}
          </div>

          <div className="border-t border-gray-200 my-3"></div>

          <button
            onClick={handleLogout}
            className="text-red-600 hover:underline font-medium"
          >
            ⛔ Log Out
          </button>
        </>
      )}
    </div>
  );
}
