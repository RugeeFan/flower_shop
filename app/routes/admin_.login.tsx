// app/routes/admin.login.tsx
import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { verifyPassword, createUserSession } from "~/lib/auth.server";
import { inspect, recordFailure, reset } from "~/lib/rateLimit.server";

// 5 failures per IP+email in any 15-minute window. After that the
// endpoint refuses to compare passwords at all and returns a generic
// "Invalid email or password" — same wording as a wrong password, so
// the attacker can't tell whether they're throttled vs. wrong.
const RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };

const GENERIC_ERROR = "Invalid email or password.";

function clientKey(request: Request, email: string): string {
  // Trust X-Forwarded-For when present (Nginx in front of the app sets it).
  // Fall back to whatever the request reports. Either way the key is only
  // ever used as an internal bucket id — never written back to the user.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `admin-login:${ip}:${email.toLowerCase()}`;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    const password = (formData.get("password") as string | null) ?? "";

    if (!email || !password) {
      return json({ error: GENERIC_ERROR }, { status: 400 });
    }

    const key = clientKey(request, email);
    const pre = inspect(key, RATE_LIMIT);
    if (pre.limited) {
      // Don't burn time on a bcrypt compare for a blocked actor.
      return json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const passwordValid =
      user && user.password && user.isAdmin
        ? await verifyPassword(password, user.password)
        : false;

    if (!user || !passwordValid) {
      recordFailure(key, RATE_LIMIT);
      return json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // Success — drop any prior failure counters for this caller.
    reset(key);

    return createUserSession({
      request,
      userId: user.id,
      redirectTo: "/admin",
      isAdmin: true,
    });
  } catch (err) {
    console.error("Unexpected error during admin login:", err);
    return json({ error: "Server error. Please try again." }, { status: 500 });
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
