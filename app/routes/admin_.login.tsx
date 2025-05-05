// app/routes/admin.login.tsx
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { verifyPassword, createUserSession } from "~/lib/auth.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    console.log("📩 Admin login request received");

    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    console.log("📧 email:", email);
    console.log("🔑 password:", password ? "●●●" : "empty");

    if (!email || !password) {
      return json({ error: "Please enter both email and password." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log("❌ user not found");
      return json({ error: "User not found." }, { status: 404 });
    }

    if (!user.password || !user.isAdmin) {
      console.log("❌ user is not admin or password missing");
      return json({ error: "Not authorized." }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password);
    console.log("🔐 password valid:", valid);

    if (!valid) {
      return json({ error: "Incorrect password." }, { status: 401 });
    }

    console.log("✅ creating session for admin:", user.email);
    return createUserSession({
      request,
      userId: user.id,
      redirectTo: "/admin",
      isAdmin: true,
    });
  } catch (err) {
    console.error("🔥 Unexpected error during admin login:", err);
    return json({ error: "服务器错误，请稍后再试。" }, { status: 500 });
  }
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
