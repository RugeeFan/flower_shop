import { Link } from "@remix-run/react";
import Carousel from "../Carousel";
import type { HomeBannerData } from "~/lib/site-content";

interface BannerContent {
  title: string | null;
  subtitle: string | null;
  content: string | null;
  imageUrl: string[];
  data?: unknown;
}

export default function Hero({ banner }: { banner: BannerContent | null }) {
  // Editorial split layout: text panel (bone) on the left, image on the right.
  // Stacks vertically on mobile (image first, then text) so the visual leads.
  const eyebrow = banner?.subtitle?.trim() || "Sydney Florist";
  const headline = banner?.content?.trim() || "Flowers, gathered with care.";
  const supporting = banner?.title?.trim() || "";
  const images = banner?.imageUrl?.length ? banner.imageUrl : [];

  // CTA labels + hrefs come from PageContent.data (Json). Fall back to the
  // long-standing defaults if either piece is missing — never render a button
  // with an empty href or empty label.
  const ctaData = (banner?.data ?? {}) as HomeBannerData;
  const primaryLabel = ctaData.primaryCta?.label?.trim() || "Shop the collection";
  const primaryHref = ctaData.primaryCta?.href?.trim() || "/products";
  const secondaryLabel = ctaData.secondaryCta?.label?.trim() || "Our story";
  const secondaryHref = ctaData.secondaryCta?.href?.trim() || "/about";

  return (
    <section className="bg-bone">
      <div className="grid grid-cols-1 md:grid-cols-12 md:min-h-[560px] lg:min-h-[640px]">
        {/* Image — appears first on mobile, right on desktop */}
        <div className="order-1 md:order-2 md:col-span-7 lg:col-span-8 relative bg-cream overflow-hidden">
          <div className="aspect-[4/5] md:aspect-auto md:h-full">
            {images.length > 0 ? (
              <Carousel images={images} />
            ) : (
              <div className="h-full w-full bg-cream" />
            )}
          </div>
        </div>

        {/* Text panel */}
        <div className="order-2 md:order-1 md:col-span-5 lg:col-span-4 flex flex-col justify-center px-6 md:px-10 lg:px-16 py-12 md:py-0">
          <div className="eyebrow mb-4">{eyebrow}</div>

          <h1 className="font-display text-charcoal text-[40px] md:text-[52px] lg:text-[64px] leading-display tracking-tight">
            {headline}
          </h1>

          {supporting && (
            <p className="mt-6 text-ink-muted text-[15px] md:text-base max-w-[40ch] leading-body">
              {supporting}
            </p>
          )}

          <div className="mt-10 flex items-center gap-6">
            <Link
              to={primaryHref}
              className="inline-flex items-center justify-center bg-charcoal text-bone px-7 py-3 text-sm font-medium tracking-eyebrow uppercase hover:bg-terracotta transition-colors"
            >
              {primaryLabel}
            </Link>
            <Link
              to={secondaryHref}
              className="text-charcoal text-sm font-medium underline underline-offset-4 decoration-charcoal/30 hover:decoration-charcoal transition"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
