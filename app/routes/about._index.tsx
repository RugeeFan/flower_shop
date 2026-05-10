import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "About Us - Royal Rose" }];
};

export async function loader({ }: LoaderFunctionArgs) {
  const content = await prisma.pageContent.findUnique({
    where: { slug: "about" },
  });

  return {
    content,
  };
}

export default function AboutPage() {
  const { content } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold text-primary mb-6">
        {content?.title || "About Royal Rose"}
      </h1>

      {content?.content ? (
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
      ) : (
        <p className="text-gray-600">No content available.</p>
      )}
    </div>
  );
}
