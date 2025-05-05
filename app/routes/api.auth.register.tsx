import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { prisma } from "~/lib/prisma.server";
import { createUserSession } from "~/lib/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return json({ error: "Email and password required." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return json({ error: "User already exists." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  // ✅ 注册成功后直接登录
  return createUserSession({
    request,
    userId: user.id,
    redirectTo: "/", // 注册成功跳转
  });
}
