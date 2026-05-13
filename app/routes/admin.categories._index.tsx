import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { requireAdmin } from "~/lib/auth.server";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAdmin(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const successName = url.searchParams.get("success");

  // Include the per-category product count so admin sees usage at a glance
  // and can decide whether deletion is safe.
  const categories = await prisma.category.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return json({ categories, q, successName });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireAdmin(request);
  const formData = await request.formData();
  const actionType = formData.get("_action");
  const name = formData.get("name")?.toString().trim();
  const id = formData.get("id")?.toString();

  if (actionType === "create") {
    if (!name) {
      return json({ fieldErrors: { name: ["分类名称不能为空"] } }, { status: 400 });
    }
    try {
      await prisma.category.create({ data: { name } });
      return redirect(`/admin/categories?success=${encodeURIComponent(name)}`);
    } catch (err: any) {
      if (err.code === "P2002") {
        return json({ fieldErrors: { name: ["该分类已存在"] } }, { status: 400 });
      }
      throw err;
    }
  }

  if (actionType === "update") {
    if (!id || !name) {
      return json({ fieldErrors: { name: ["名称不能为空"] } }, { status: 400 });
    }
    await prisma.category.update({ where: { id }, data: { name } });
    return redirect("/admin/categories");
  }

  if (actionType === "delete") {
    if (!id) return json({ error: "缺少 id" }, { status: 400 });
    // Guard: refuse to delete if products are still attached. Forces the
    // admin to reassign or detach products first, instead of silently
    // breaking the storefront category filters.
    const inUse = await prisma.product.count({
      where: { categories: { some: { id } } },
    });
    if (inUse > 0) {
      return json(
        { error: `该分类下还有 ${inUse} 件商品，请先移除或改分类。` },
        { status: 400 },
      );
    }
    await prisma.category.delete({ where: { id } });
    return redirect("/admin/categories");
  }

  return null;
};

export default function CategoryPage() {
  const { categories, q, successName } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { t } = useTranslation("admin");

  const isSubmitting = navigation.state !== "idle";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t("categories")}</h1>

      {/* 搜索 */}
      <Form method="get" className="mb-4 flex gap-2">
        <input
          type="text"
          name="q"
          placeholder={t("searchCategory")}
          defaultValue={q}
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          type="submit"
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          {t("search")}
        </button>
      </Form>

      {/* 添加分类 */}
      {showAddForm ? (
        <Form method="post" className="mb-6 flex flex-col gap-2">
          <input type="hidden" name="_action" value="create" />
          <div className="flex gap-2 items-center">
            <input
              type="text"
              name="name"
              placeholder={t("addCategory")}
              className="border px-3 py-2 rounded flex-1"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {isSubmitting ? `${t("addCategory")}...` : t("addCategory")}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-sm text-gray-500 hover:underline"
            >
              {t("cancel")}
            </button>
          </div>

          {/* 提示 */}
          {successName && (
            <p className="text-green-600 text-sm">
              {t("addSuccess", { name: successName })}
            </p>
          )}
          {actionData && "fieldErrors" in actionData && actionData.fieldErrors.name.length > 0 && (
            <p className="text-red-600 text-sm">
              {actionData.fieldErrors.name.join(", ")}
            </p>
          )}
        </Form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="mb-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {t("addCategory")}
        </button>
      )}

      {/* Delete error surface (for the in-use guard) */}
      {actionData && "error" in actionData && actionData.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {actionData.error}
        </div>
      )}

      {/* 列表 */}
      {categories.length === 0 ? (
        <p className="text-gray-600">{t("noCategory")}</p>
      ) : (
        <ul className="space-y-3">
          {categories.map((cat) => {
            const count = cat._count?.products ?? 0;
            const inUse = count > 0;
            return (
              <li
                key={cat.id}
                className="border px-4 py-3 rounded flex items-center justify-between gap-3"
              >
                {editingId === cat.id ? (
                  <Form method="post" className="flex gap-2 items-center w-full">
                    <input type="hidden" name="_action" value="update" />
                    <input type="hidden" name="id" value={cat.id} />
                    <input
                      name="name"
                      className="border px-2 py-1 rounded flex-1"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      {t("save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-gray-500 hover:underline text-sm"
                    >
                      {t("cancel")}
                    </button>
                  </Form>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{cat.name}</span>
                      <span
                        className={`shrink-0 inline-block px-2 py-0.5 text-[11px] rounded border ${
                          inUse
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                        title={inUse ? `${count} 件商品挂在此分类` : "暂无商品"}
                      >
                        {count} 件
                      </span>
                    </div>
                    <div className="flex gap-2 items-center shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditValue(cat.name);
                        }}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {t("edit")}
                      </button>
                      <Form
                        method="post"
                        onSubmit={(e) => {
                          if (inUse) {
                            e.preventDefault();
                            alert(`该分类下还有 ${count} 件商品，请先在「商品管理」里移除或改分类。`);
                            return;
                          }
                          if (!confirm(t("confirmDelete"))) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="_action" value="delete" />
                        <input type="hidden" name="id" value={cat.id} />
                        <button
                          type="submit"
                          disabled={inUse}
                          title={inUse ? "该分类下还有商品，无法直接删除" : "删除分类"}
                          className="text-red-600 hover:underline text-sm disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
                        >
                          {t("delete")}
                        </button>
                      </Form>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
