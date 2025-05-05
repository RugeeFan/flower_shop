import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import jwt from "jsonwebtoken";
import { prisma } from "~/lib/prisma.server";
import { createUserSession } from "~/lib/auth.server";

type GoogleUser = {
  email: string;
  name?: string;
  sub: string;
};

export async function action({ request }: ActionFunctionArgs) {
  const { idToken } = await request.json();

  if (!idToken) {
    return json({ error: "Missing Google token" }, { status: 400 });
  }

  const decoded = jwt.decode(idToken) as GoogleUser;

  if (!decoded?.email || !decoded?.sub) {
    return json({ error: "Invalid Google token" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { email: decoded.email },
    update: {
      googleId: decoded.sub,
      name: decoded.name,
    },
    create: {
      email: decoded.email,
      googleId: decoded.sub,
      name: decoded.name,
    },
  });

  // ✅ 创建 session 并跳转到首页
  return createUserSession({
    request,
    userId: user.id,
    redirectTo: "/",
  });
}
