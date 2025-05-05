// app/routes/admin.tsx
import { Form, NavLink, Outlet } from "@remix-run/react";
import { useState } from "react";
import { requireAdmin } from "~/lib/auth.server";
import { useTranslation } from "react-i18next";

export async function loader({ request }: { request: Request }) {
  await requireAdmin(request); // ✅ 更安全
  return null;
}

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { i18n, t } = useTranslation("admin");

  const handleChange = () => {
    const newLang = i18n.language === "zh" ? "en" : "zh";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded hover:bg-gray-100 ${isActive ? "bg-gray-200 font-semibold" : "text-gray-800"}`;

  const navItems = (
    <>
      <NavLink to="/admin" end className={navLinkClass} onClick={() => setMenuOpen(!menuOpen)}>
        {t("dashboard")}
      </NavLink>
      <NavLink to="/admin/products" className={navLinkClass} onClick={() => setMenuOpen(!menuOpen)}>
        {t("productManagement")}
      </NavLink>
      <NavLink to="/admin/orders" className={navLinkClass} onClick={() => setMenuOpen(!menuOpen)}>
        {t("orderManagement")}
      </NavLink>
      <NavLink to="/admin/categories" className={navLinkClass} onClick={() => setMenuOpen(!menuOpen)}>
        {t("categoryManagement")}
      </NavLink>
      <NavLink to="/admin/customers" className={navLinkClass} onClick={() => setMenuOpen(!menuOpen)}>
        {t("customerManagement")}
      </NavLink>
      <NavLink to="/admin/users" className={navLinkClass} onClick={() => setMenuOpen(!menuOpen)}>
        {t("adminManagement")}
      </NavLink>
      <NavLink to="/admin/site-content" className={navLinkClass} onClick={() => setMenuOpen(!menuOpen)}>
        {t("siteContent")}
      </NavLink>
      <Form method="post" action="/admin/logout">
        <button
          type="submit"
          className="mt-4 block w-full text-left text-red-500 px-4 py-2 rounded hover:bg-red-50"
        >
          {t("logout")}
        </button>
      </Form>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:block w-64 bg-gray-50 border-r p-4">
        <button
          onClick={handleChange}
          className="text-sm border border-gray-300 rounded px-3 py-1 hover:bg-gray-100 mb-4"
        >
          {i18n.language === "zh" ? "🇨🇳 中文" : "🇺🇸 English"}
        </button>
        <h2 className="text-lg font-bold mb-6">{t("adminTitle")}</h2>
        <nav className="space-y-2 text-sm">{navItems}</nav>
      </aside>

      {/* 移动端顶部导航 */}
      <header className="lg:hidden bg-gray-50 border-b p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold flex">{t("adminTitle")}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex justify-center items-center">
            <button
              onClick={handleChange}
              className="text-sm border border-gray-300 rounded px-3  hover:bg-gray-100"
            >
              {i18n.language === "zh" ? "🇨🇳 中文" : "🇺🇸 English"}
            </button>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-600 focus:outline-none"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

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
