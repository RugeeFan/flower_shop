import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { hashPassword, requireUser } from "~/lib/auth.server";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
    await prisma.user.delete({ where: { id } });
    return redirect("/admin/users");
  }

  return json({ error: "Unknown action" }, { status: 400 });
}

export default function AdminUsersPage() {
  const { admins } = useLoaderData<typeof loader>();
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation("admin");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("adminList")}</h1>
        <button
          className="bg-primary text-white px-4 py-2 rounded"
          onClick={() => setShowModal(true)}
        >
          {t("addAdmin")}
        </button>
      </div>

      {/* ✅ 弹窗添加管理员 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <Form
            method="post"
            className="bg-white p-6 rounded shadow space-y-4 w-full max-w-md"
            onSubmit={() => setShowModal(false)}
          >
            <h2 className="text-lg font-semibold">{t("addAdmin")}</h2>
            <input type="hidden" name="_intent" value="add" />
            <input
              name="name"
              placeholder={t("name")}
              className="input w-full"
            />
            <input
              name="email"
              placeholder={t("email")}
              required
              className="input w-full"
            />
            <input
              name="password"
              placeholder={t("password")}
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
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded"
              >
                {t("create")}
              </button>
            </div>
          </Form>
        </div>
      )}

      {/* ✅ 桌面端表格 */}
      <div className="bg-white shadow border rounded overflow-x-auto hidden sm:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">{t("name")}</th>
              <th className="px-4 py-2 text-left">{t("email")}</th>
              <th className="px-4 py-2 text-left">{t("registeredAt")}</th>
              <th className="px-4 py-2 text-left">{t("actions")}</th>
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
                        confirm(`${t("confirmDelete")}: ${admin.name || admin.email}`)
                      }
                    >
                      {t("delete")}
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ 移动端卡片式展示 */}
      <div className="space-y-4 sm:hidden">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="border rounded-lg p-4 shadow-sm bg-white text-sm"
          >
            <div className="mb-2">
              <strong>{t("name")}:</strong> {admin.name}
            </div>
            <div className="mb-2">
              <strong>{t("email")}:</strong> {admin.email}
            </div>
            <div className="mb-2">
              <strong>{t("registeredAt")}:</strong>{" "}
              {new Date(admin.createdAt).toLocaleDateString()}
            </div>
            <Form method="post" className="inline-block mt-2">
              <input type="hidden" name="_intent" value="delete" />
              <input type="hidden" name="id" value={admin.id} />
              <button
                type="submit"
                className="text-red-600 hover:underline"
                onClick={() =>
                  confirm(`${t("confirmDelete")}: ${admin.name || admin.email}`)
                }
              >
                {t("delete")}
              </button>
            </Form>
          </div>
        ))}
      </div>
    </div>
  );
}
