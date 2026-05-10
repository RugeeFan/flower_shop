// app/lib/prisma.server.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// 在开发热重载和 serverless 冷启动场景下复用同一个连接，避免连接池耗尽
const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export { prisma };
