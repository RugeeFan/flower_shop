import { parse } from "cookie";

export function getAuthToken(request?: Request): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token"); // 客户端：从 localStorage 获取 Token
  } else if (request) {
    // 服务器端：从 Cookies 获取 Token
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    return cookies.token || null;
  }
  return null;
}
