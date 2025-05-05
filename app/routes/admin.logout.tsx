// app/routes/admin.logout.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { logout } from "~/lib/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  return logout(request, "/admin/login"); // ✅ 登出后回登录页
}
