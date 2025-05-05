// app/routes/api.page-content.home-banner.tsx
import { json } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";

export async function loader() {
  const content = await prisma.pageContent.findUnique({
    where: { slug: "home-banner" },
  });

  return json(content); 
}
