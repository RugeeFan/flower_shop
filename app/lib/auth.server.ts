import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { prisma } from "~/lib/prisma.server";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
  // Fail fast: a missing or trivially short cookie key turns the whole
  // session layer into a forged-cookie playground. Refuse to boot rather
  // than silently fall back to a guessable secret. Generate one with
  // `openssl rand -hex 32` and set it in .env.
  throw new Error(
    "SESSION_SECRET is not set (or is shorter than 16 chars). " +
      "Generate one with `openssl rand -hex 32` and set it in .env before starting the app.",
  );
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secrets: [SESSION_SECRET],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
});
export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export const { getSession, commitSession, destroySession } = sessionStorage;

// ✅ 创建 Session：支持设置 isAdmin
export async function createUserSession({
  request,
  userId,
  redirectTo,
  isAdmin = false,
}: {
  request: Request;
  userId: string;
  redirectTo: string;
  isAdmin?: boolean;
}) {
  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", userId);
  if (isAdmin) session.set("isAdmin", true);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

// ✅ 注销
export async function logout(request: Request, redirectTo = "/") {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

// ✅ 获取完整用户对象（后台页面用）
export async function requireUser(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) {
    throw redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw await logout(request, "/admin/login");
  }

  return user;
}

// ✅ 获取 userId，仅限用户已登录验证
export async function requireUserId(
  request: Request,
  redirectTo: string = "/"
) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) throw redirect(redirectTo);
  return userId;
}

// ✅ 管理员专用验证（强制要求 isAdmin = true）
export async function requireAdmin(
  request: Request,
  redirectTo = "/admin/login"
) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  const isAdmin = session.get("isAdmin");

  if (!userId || !isAdmin) {
    throw redirect(redirectTo);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isAdmin) {
    throw await logout(request, "/admin/login");
  }

  return user;
}

// ✅ 密码比对
export async function verifyPassword(
  inputPassword: string,
  storedHash: string
) {
  return bcrypt.compare(inputPassword, storedHash);
}
