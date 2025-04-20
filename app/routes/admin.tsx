import { Form, Link, NavLink, Outlet } from "@remix-run/react";
import { useState } from "react";
import { requireUser } from "~/lib/auth.server";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  return null;
}

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded hover:bg-gray-100 ${isActive ? "bg-gray-200 font-semibold" : "text-gray-800"}`;

  const navItems = (
    <>
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
      <NavLink to="/admin/users" className={navLinkClass}>
        管理员管理
      </NavLink>
      <Form method="post" action="/admin/logout">
        <button
          type="submit"
          className="mt-4 block w-full text-left text-red-500 px-4 py-2 rounded hover:bg-red-50"
        >
          退出登录
        </button>
      </Form>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:block w-64 bg-gray-50 border-r p-4">
        <h2 className="text-lg font-bold mb-6">🌼 花店后台</h2>
        <nav className="space-y-2 text-sm">{navItems}</nav>
      </aside>

      {/* 移动端顶部导航 */}
      <header className="lg:hidden bg-gray-50 border-b p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold">🌼 花店后台</h2>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-gray-600 focus:outline-none"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* 移动端下拉菜单 */}
      {menuOpen && (
        <nav className="lg:hidden bg-gray-50 border-b p-4 space-y-2 text-sm">{navItems}</nav>
      )}

      {/* 主内容区域 */}
      <main className="flex-1 p-6 bg-white">
        <Outlet />
      </main>
    </div>
  );
}
