import { Link, NavLink, Outlet } from "@remix-run/react";

export default function AdminLayout() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded hover:bg-gray-100 ${isActive ? "bg-gray-200 font-semibold" : "text-gray-800"
    }`;

  return (
    <div className="min-h-screen flex">
      {/* 左侧导航栏 */}
      <aside className="w-64 bg-gray-50 border-r p-4">
        <h2 className="text-lg font-bold mb-6">🌼 花店后台</h2>
        <nav className="space-y-2 text-sm">
          <NavLink to="/admin" end className={navLinkClass}>
            控制台首页
          </NavLink>
          <NavLink to="/admin/products" className={navLinkClass}>
            商品管理
          </NavLink>
          <NavLink to="/admin/orders" className={navLinkClass}>
            订单管理
          </NavLink>
          <NavLink to="/admin/categories" className={navLinkClass}>
            分类管理
          </NavLink>
        </nav>
      </aside>

      {/* 右侧主内容区域 */}
      <main className="flex-1 p-6 bg-white">
        <Outlet />
      </main>
    </div>
  );
}
