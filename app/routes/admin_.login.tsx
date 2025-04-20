// app/routes/admin.login.tsx
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { verifyPassword, createUserSession } from "~/lib/auth.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return json({ error: "请输入邮箱和密码。" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password || !user.isAdmin) {
    return json({ error: "无效的管理员账号。" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return json({ error: "密码错误。" }, { status: 401 });
  }

  // ✅ 使用封装好的 createUserSession
  return createUserSession({
    request,
    userId: user.id,
    redirectTo: "/admin",
  });
};

export default function AdminLoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">管理员登录</h1>
        {actionData?.error && (
          <div className="text-red-500 mb-4 text-sm text-center">
            {actionData.error}
          </div>
        )}
        <Form method="post" className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="管理员邮箱"
            className="input"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="密码"
            className="input"
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded"
            disabled={navigation.state !== "idle"}
          >
            {navigation.state === "submitting" ? "登录中..." : "登录"}
          </button>
        </Form>
      </div>
    </div>
  );
}
