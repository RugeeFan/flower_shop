# Build stage
FROM node:18-bullseye-slim AS builder

WORKDIR /app

# 安装 OpenSSL（为 Prisma 生成时提供依赖）
RUN apt-get update && apt-get install -y openssl

COPY package*.json ./
RUN npm install

COPY . .

# ✅ 生成 Prisma Client，使用的是 debian 环境（重点）
RUN npx prisma generate

# ✅ 构建 Remix 应用
RUN npm run build

# ✅ 可选：运行种子脚本（首次部署可以打开）
# RUN npm install tsx && npx tsx prisma/seed.ts

# Final stage
FROM node:18-bullseye-slim

WORKDIR /app

# 安装 OpenSSL（运行时必须有）
RUN apt-get update && apt-get install -y openssl

# 拷贝构建结果
COPY --from=builder /app /app

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]
