import type { HomeInformationData } from "~/lib/site-content";

interface InformationProps {
  // Shape comes from PageContent[slug=home-information]. Pick the first
  // image (single-slot form) and read showLogo out of the data JSON.
  banner: {
    title: string | null;
    subtitle: string | null;
    imageUrl: string[];
    data?: unknown;
  } | null;
}

export default function Information({ banner }: InformationProps) {
  const imageUrl = banner?.imageUrl?.[0] ?? "";
  const title = banner?.title ?? "";
  const subtitle = banner?.subtitle ?? "";
  const showLogo = !!((banner?.data ?? {}) as HomeInformationData).showLogo;
  const hasImage = !!imageUrl;
  const hasContent = !!(title || subtitle || showLogo);

  // If both empty, render nothing — Information is purely promotional.
  if (!hasImage && !hasContent) return null;

  return (
    <section className="bg-bone">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[420px] md:min-h-[520px]">
        {/* Image side */}
        <div className="relative bg-cream order-1 md:order-1 overflow-hidden">
          {hasImage ? (
            <img
              src={imageUrl}
              alt={title || ""}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
        </div>

        {/* Text side */}
        <div className="flex flex-col justify-center items-start px-6 md:px-12 lg:px-20 py-16 md:py-0 order-2 md:order-2">
          {showLogo && (
            <img
              src="/brand/logo.png"
              alt="Royal Rose"
              className="w-32 md:w-40 mb-8 opacity-90"
            />
          )}
          {title && (
            <>
              <div className="eyebrow mb-3">A note from the studio</div>
              <h2 className="font-display text-charcoal text-[32px] md:text-[42px] leading-display tracking-tight">
                {title}
              </h2>
            </>
          )}
          {subtitle && (
            <p className="mt-5 text-ink-muted text-[15px] md:text-base max-w-md leading-body">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
