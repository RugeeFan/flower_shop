// app/routes/api.page-content.home-promotion-bar.tsx
import { json } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";

export async function loader() {
  const content = await prisma.pageContent.findUnique({
    where: { slug: "home-promotion-bar" },
  });

  return json(content);
}
