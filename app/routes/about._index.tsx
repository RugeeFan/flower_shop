import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";

export const meta: MetaFunction = () => {
  return [{ title: "About Royal Rose" }];
};

export async function loader({ }: LoaderFunctionArgs) {
  const content = await prisma.pageContent.findUnique({
    where: { slug: "about" },
  });
  return { content };
}

export default function AboutPage() {
  const { content } = useLoaderData<typeof loader>();

  const title = content?.title || "About Royal Rose.";
  const subtitle = content?.subtitle;
  const body = content?.content;

  return (
    <article className="bg-bone min-h-screen">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 pt-16 md:pt-28 pb-12">
        <div className="eyebrow mb-4">Our story</div>
        <h1 className="font-display text-charcoal text-[44px] md:text-[64px] leading-display tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 text-ink-muted text-[16px] md:text-[18px] leading-body max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      <div className="hairline max-w-4xl mx-auto" />

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-20">
        {body ? (
          <div
            className="prose prose-lg max-w-none
                       prose-headings:font-display prose-headings:text-charcoal prose-headings:tracking-tight
                       prose-p:text-charcoal prose-p:leading-body
                       prose-a:text-terracotta prose-a:no-underline hover:prose-a:underline
                       prose-strong:text-charcoal
                       prose-em:text-ink-muted"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <div className="space-y-6 text-charcoal text-[16px] md:text-[17px] leading-body">
            <p>
              Royal Rose is a Sydney florist with one job: to help you say
              what's hard to say with flowers. We've been doing it for over
              ten years, and we still treat every bouquet like the first one.
            </p>
            <p>
              Our team works with seasonal blooms — chosen for their colour,
              fragrance, and the way they hold a moment together. Whether
              it's a birthday, a thank you, a quiet sympathy, or a "just
              because," we'd love to be part of it.
            </p>
            <p className="text-ink-muted italic">
              Royal Rose respectfully acknowledges the Traditional Owners of
              the land we work on, and honours their deep connection to
              country, culture, and community.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
