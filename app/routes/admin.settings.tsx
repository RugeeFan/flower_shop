import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  requireAdmin,
  hashPassword,
  verifyPassword,
} from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import {
  getNotificationEmail,
  setNotificationEmail,
} from "~/lib/settings.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  const notificationEmail = await getNotificationEmail();
  return json({
    notificationEmail,
    adminEmail: user.email,
    hasPassword: !!user.password,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("__intent") || "");

  // ── Notification email ────────────────────────────────────────────────────
  if (intent === "notificationEmail") {
    const email = String(form.get("notificationEmail") || "").trim();
    if (email.length > 0) {
      const ok = /^[^\s,@]+@[^\s,@]+\.[^\s,@]+$/.test(email);
      if (!ok) {
        return json({ scope: "email", error: "邮箱格式不正确" }, { status: 400 });
      }
    }
    await setNotificationEmail(email);
    return redirect("/admin/settings?saved=email");
  }

  // ── Change password ───────────────────────────────────────────────────────
  if (intent === "changePassword") {
    const currentPassword = String(form.get("currentPassword") || "");
    const newPassword = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (!user.password) {
      return json(
        {
          scope: "password",
          error: "当前账号没有设置过密码（Google 登录用户），无法在此处修改。",
        },
        { status: 400 },
      );
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      return json({ scope: "password", error: "请填写所有密码字段" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return json({ scope: "password", error: "新密码至少 8 位" }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return json({ scope: "password", error: "两次输入的新密码不一致" }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return json({ scope: "password", error: "新密码不能与当前密码相同" }, { status: 400 });
    }
    const currentOk = await verifyPassword(currentPassword, user.password);
    if (!currentOk) {
      return json({ scope: "password", error: "当前密码不正确" }, { status: 400 });
    }
    const hash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
    return redirect("/admin/settings?saved=password");
  }

  return json({ error: "未知操作" }, { status: 400 });
}

type ActionData = { scope?: "email" | "password"; error?: string };

export default function AdminSettingsPage() {
  const { notificationEmail, adminEmail, hasPassword } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const nav = useNavigation();
  const submittedIntent = nav.formData?.get("__intent")?.toString() ?? null;
  const submitting = nav.state !== "idle";

  const savedKey =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("saved")
      : null;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-10">
      <header>
        <h1 className="text-2xl font-bold mb-2">站点设置</h1>
        <p className="text-gray-600 text-sm">
          全局配置：订单通知邮箱 + 管理员登录密码。首页板块的文案/图片改在
          <a href="/admin/site-content" className="text-blue-600 hover:underline mx-1">内容管理</a>
          里编辑。
        </p>
      </header>

      {/* ─── Notification email ───────────────────────────────────────────── */}
      <section className="bg-white border rounded-lg p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">订单通知邮箱</h2>
          <p className="text-sm text-gray-600 mt-1">
            买家完成支付后，订单详情会发送到这个邮箱。留空则不发送；未填时回落到
            <code className="text-xs bg-gray-100 px-1 rounded mx-1">NOTIFICATION_EMAIL</code>
            环境变量。
          </p>
        </div>
        {savedKey === "email" && !actionData && (
          <div className="mb-3 p-2 bg-green-50 text-green-700 rounded text-sm">
            通知邮箱已保存
          </div>
        )}
        {actionData?.scope === "email" && actionData.error && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            {actionData.error}
          </div>
        )}
        <Form method="post" className="space-y-3">
          <input type="hidden" name="__intent" value="notificationEmail" />
          <div>
            <label className="block font-medium mb-1 text-sm">收件邮箱</label>
            <input
              type="email"
              name="notificationEmail"
              defaultValue={notificationEmail}
              placeholder="orders@yourshop.com"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting && submittedIntent === "notificationEmail"}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {submitting && submittedIntent === "notificationEmail" ? "保存中..." : "保存邮箱"}
          </button>
        </Form>
      </section>

      {/* ─── Change password ──────────────────────────────────────────────── */}
      <section className="bg-white border rounded-lg p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">修改登录密码</h2>
          <p className="text-sm text-gray-600 mt-1">
            当前账号：<code className="text-xs bg-gray-100 px-1 rounded">{adminEmail}</code>
            。修改后立即生效，下次登录使用新密码。
          </p>
        </div>
        {savedKey === "password" && !actionData && (
          <div className="mb-3 p-2 bg-green-50 text-green-700 rounded text-sm">
            密码已更新
          </div>
        )}
        {actionData?.scope === "password" && actionData.error && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            {actionData.error}
          </div>
        )}
        {!hasPassword ? (
          <p className="text-sm text-gray-600 italic">
            当前账号通过 Google 登录创建，没有本地密码，无法在此修改。
          </p>
        ) : (
          <Form method="post" className="space-y-3" autoComplete="off">
            <input type="hidden" name="__intent" value="changePassword" />
            {/* Hidden username hint for password managers */}
            <input
              type="text"
              name="username"
              defaultValue={adminEmail}
              autoComplete="username"
              className="hidden"
              tabIndex={-1}
              readOnly
            />
            <div>
              <label className="block font-medium mb-1 text-sm">当前密码</label>
              <input
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                required
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-sm">新密码</label>
              <input
                type="password"
                name="newPassword"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">至少 8 位，建议混合字母数字符号。</p>
            </div>
            <div>
              <label className="block font-medium mb-1 text-sm">确认新密码</label>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting && submittedIntent === "changePassword"}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {submitting && submittedIntent === "changePassword" ? "更新中..." : "更新密码"}
            </button>
          </Form>
        )}
      </section>
    </div>
  );
}
