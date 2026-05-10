import { Link } from "@remix-run/react";
import { introTag } from "~/data/homepage";

export default function Intro() {
  return (
    <section className="bg-cream py-20 md:py-32">
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-14">
          <div className="eyebrow mb-3">Our story</div>
          <h2 className="font-display text-charcoal text-[36px] md:text-[52px] leading-display tracking-tight">
            Flowers as little
            <br className="hidden md:block" /> moments of joy.
          </h2>
        </div>

        <div className="space-y-6 text-charcoal text-[15px] md:text-[17px] leading-body max-w-2xl mx-auto">
          <p>
            Sharing love and beauty, one bouquet at a time — Sydney's local
            florist. At Royal Rose, flowers are more than gifts: they're little
            moments of joy, love, and connection. For over ten years we've helped
            people across Sydney express their feelings through thoughtfully
            arranged, fresh blooms.
          </p>
          <p>
            Every bouquet is made with care by our experienced team, using
            seasonal flowers chosen for their colour, fragrance, and charm.
            Whether it's a birthday, a "just because," or a moment that needs
            comfort, we're here to help you make it special. And if your flowers
            aren't quite right, let us know within 48 hours — we'll happily fix it.
          </p>
          <p className="text-ink-muted text-[13px] md:text-[14px] italic">
            Royal Rose respectfully acknowledges the Traditional Owners of the
            land we work on, and honours their deep connection to country,
            culture, and community.
          </p>
        </div>

        {/* Three-up feature row, in editorial single-line layout */}
        {introTag?.length > 0 && (
          <>
            <div className="hairline my-16" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
              {introTag.map((item) => (
                <div key={item.title} className="text-center md:text-left">
                  <i
                    className={`${item.icon} text-2xl text-terracotta block mb-4`}
                  ></i>
                  <h3 className="font-display text-charcoal text-[18px] leading-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-ink-muted leading-body">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
            <div className="hairline mt-16" />
          </>
        )}

        <div className="text-center mt-12">
          <Link
            to="/about"
            className="text-charcoal text-sm font-medium underline underline-offset-4 decoration-charcoal/30 hover:decoration-charcoal transition"
          >
            Read the full story →
          </Link>
        </div>
      </div>
    </section>
  );
}
