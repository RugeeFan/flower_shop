// app/lib/session.server.ts
import { createCookieSessionStorage } from "@remix-run/node";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
  // Same gate as app/lib/auth.server.ts — refuse to boot when the cookie
  // key is missing or trivially short. Both modules read the same env var
  // and configure the same `__session` cookie.
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

export const { getSession, commitSession, destroySession } = sessionStorage;
