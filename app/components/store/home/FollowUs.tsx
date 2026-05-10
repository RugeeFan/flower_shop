const INSTAGRAM_URL =
  "https://www.instagram.com/royalrose_au?igsh=MTVxOWR0MXNicnFpcQ==";

export default function FollowUs() {
  return (
    <section className="bg-bone py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-charcoal text-bone py-16 md:py-24 px-6 md:px-12 text-center transition-colors hover:bg-terracotta"
        >
          <div className="eyebrow text-bone/70 mb-4 group-hover:text-bone/90 transition-colors">
            On Instagram
          </div>
          <h2 className="font-display text-[36px] md:text-[52px] leading-display tracking-tight">
            @royalrose_au
          </h2>
          <p className="mt-6 text-bone/80 text-[14px] md:text-[15px] max-w-md mx-auto leading-body">
            Follow along for arrangements in the studio, seasonal blooms, and
            small moments from the Sydney shop.
          </p>
          <span className="inline-flex items-center gap-2 mt-8 text-[12px] uppercase tracking-eyebrow font-medium border-b border-bone/40 pb-1 group-hover:border-bone transition">
            <i className="ri-instagram-line"></i>
            Follow us
          </span>
        </a>
      </div>
    </section>
  );
}
