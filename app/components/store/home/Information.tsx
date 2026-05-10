interface InformationProps {
  banner: {
    imageUrl: string;
    title: string;
    subtitle: string;
    showLogo: boolean;
  };
}

export default function Information({ banner }: InformationProps) {
  const hasImage = !!banner?.imageUrl;
  const hasContent = !!(banner?.title || banner?.subtitle || banner?.showLogo);

  // If both empty, render nothing — Information is purely promotional.
  if (!hasImage && !hasContent) return null;

  return (
    <section className="bg-bone">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[420px] md:min-h-[520px]">
        {/* Image side */}
        <div className="relative bg-cream order-1 md:order-1 overflow-hidden">
          {hasImage ? (
            <img
              src={banner.imageUrl}
              alt={banner.title || ""}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
        </div>

        {/* Text side */}
        <div className="flex flex-col justify-center items-start px-6 md:px-12 lg:px-20 py-16 md:py-0 order-2 md:order-2">
          {banner.showLogo && (
            <img
              src="/logo.png"
              alt="Royal Rose"
              className="w-32 md:w-40 mb-8 opacity-90"
            />
          )}
          {banner.title && (
            <>
              <div className="eyebrow mb-3">A note from the studio</div>
              <h2 className="font-display text-charcoal text-[32px] md:text-[42px] leading-display tracking-tight">
                {banner.title}
              </h2>
            </>
          )}
          {banner.subtitle && (
            <p className="mt-5 text-ink-muted text-[15px] md:text-base max-w-md leading-body">
              {banner.subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
