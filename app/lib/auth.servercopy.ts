import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma.server";
import { getSession, commitSession, destroySession } from "./session.server";
import { redirect } from "@remix-run/node";
console.log("JWT_SECRET:", process.env.JWT_SECRET); // 看看是不是 undefined

// 加密密码
export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

// 校验密码
export async function verifyPassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

// 生成 JWT
export function generateToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

// 创建用户 Session（登录后调用）
export async function createUserSession({
  request,
  userId,
  redirectTo,
}: {
  request: Request;
  userId: string;
  redirectTo: string;
}) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = generateToken(userId);

  session.set("token", token);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

// 获取当前用户
export async function getUser(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    return user;
  } catch (err) {
    return null;
  }
}

// 强制要求登录用户
export async function requireUser(request: Request) {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/admin/login");
  }
  return user;
}


export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/admin/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
