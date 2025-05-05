// app/routes/api.auth.login.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { prisma } from "~/lib/prisma.server";
import { createUserSession } from "~/lib/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { email, password } = body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.password) {
    return json({ error: "Invalid credentials." }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return json({ error: "Invalid credentials." }, { status: 401 });
  }

  return createUserSession({
    request,
    userId: user.id,
    redirectTo: "/", // 登录成功后跳转
  });
}
