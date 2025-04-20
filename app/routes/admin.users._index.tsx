import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { hashPassword } from "~/lib/auth.server";
import { requireUser } from "~/lib/auth.server";
import { useState } from "react";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ admins });
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "add") {
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return json({ error: "邮箱和密码是必填项" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return json({ error: "该邮箱已被注册" }, { status: 400 });
    }

    const hashed = await hashPassword(password);

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        isAdmin: true,
      },
    });

    return redirect("/admin/users");
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await prisma.user.delete({
      where: { id },
    });

    return redirect("/admin/users");
  }

  return json({ error: "Unknown action" }, { status: 400 });
}

export default function AdminUsersPage() {
  const { admins } = useLoaderData<typeof loader>();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">管理员列表</h1>
        <button
          className="bg-primary text-white px-4 py-2 rounded"
          onClick={() => setShowModal(true)}
        >
          添加管理员
        </button>
      </div>

      {/* 添加管理员表单（弹窗） */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <Form
            method="post"
            className="bg-white p-6 rounded shadow space-y-4 w-full max-w-md"
            onSubmit={() => setShowModal(false)}
          >
            <h2 className="text-lg font-semibold">添加管理员</h2>
            <input type="hidden" name="_intent" value="add" />
            <input name="name" placeholder="姓名" className="input w-full" />
            <input name="email" placeholder="邮箱" required className="input w-full" />
            <input
              name="password"
              placeholder="密码"
              required
              type="password"
              className="input w-full"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="text-gray-500"
                onClick={() => setShowModal(false)}
              >
                取消
              </button>
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
                创建
              </button>
            </div>
          </Form>
        </div>
      )}

      {/* 管理员列表 */}
      <div className="bg-white shadow border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">姓名</th>
              <th className="px-4 py-2 text-left">邮箱</th>
              <th className="px-4 py-2 text-left">注册时间</th>
              <th className="px-4 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-t">
                <td className="px-4 py-2">{admin.name}</td>
                <td className="px-4 py-2">{admin.email}</td>
                <td className="px-4 py-2">
                  {new Date(admin.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <Form method="post" className="inline-block">
                    <input type="hidden" name="_intent" value="delete" />
                    <input type="hidden" name="id" value={admin.id} />
                    <button
                      type="submit"
                      className="text-red-600 hover:underline"
                      onClick={() =>
                        confirm(`确定要删除 ${admin.name || admin.email} 吗？`)
                      }
                    >
                      删除
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
