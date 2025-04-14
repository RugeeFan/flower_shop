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
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const successName = url.searchParams.get("success");

  const categories = await prisma.category.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    orderBy: { name: "asc" },
  });

  return json({ categories, q, successName });
};

export const action = async ({ request }: ActionFunctionArgs) => {
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

  const isSubmitting = navigation.state !== "idle";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">分类管理</h1>

      {/* 搜索 */}
      <Form method="get" className="mb-4 flex gap-2">
        <input
          type="text"
          name="q"
          placeholder="搜索分类名称"
          defaultValue={q}
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          type="submit"
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          搜索
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
              placeholder="请输入新分类名称"
              className="border px-3 py-2 rounded flex-1"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {isSubmitting ? "添加中..." : "添加"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-sm text-gray-500 hover:underline"
            >
              取消
            </button>
          </div>

          {/* 成功或失败提示 */}
          {successName && (
            <p className="text-green-600 text-sm">{`分类 "${successName}" 添加成功`}</p>
          )}

{actionData && 'fieldErrors' in actionData && actionData.fieldErrors.name.length > 0 && (
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
          添加分类
        </button>
      )}

      {/* 列表 */}
      {categories.length === 0 ? (
        <p className="text-gray-600">暂无分类</p>
      ) : (
        <ul className="space-y-3">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="border px-4 py-3 rounded flex items-center justify-between"
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
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-gray-500 hover:underline text-sm"
                  >
                    取消
                  </button>
                </Form>
              ) : (
                <>
                  <span>{cat.name}</span>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditValue(cat.name);
                      }}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      编辑
                    </button>
                    <Form
                      method="post"
                      onSubmit={(e) => {
                        if (!confirm("确定要删除这个分类吗？")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="_action" value="delete" />
                      <input type="hidden" name="id" value={cat.id} />
                      <button
                        type="submit"
                        className="text-red-600 hover:underline text-sm"
                      >
                        删除
                      </button>
                    </Form>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
