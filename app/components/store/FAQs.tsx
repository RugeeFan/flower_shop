import { useState } from "react";
import { faqs } from "~/data/homepage";

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-bone">
      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-24">
        <div className="eyebrow mb-3">Common questions</div>
        <h2 className="font-display text-charcoal text-[32px] md:text-[40px] leading-display tracking-tight mb-10">
          Things people often ask.
        </h2>

        <ul className="border-t border-border">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <li key={index} className="border-b border-border">
                <button
                  className="w-full flex justify-between items-center text-left py-5 text-charcoal hover:text-terracotta transition-colors"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-[16px] md:text-[18px] pr-6 leading-snug">
                    {item}
                  </span>
                  <span className="text-[20px] flex-shrink-0">
                    {isOpen ? (
                      <i className="ri-subtract-line"></i>
                    ) : (
                      <i className="ri-add-line"></i>
                    )}
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-6 text-ink-muted text-[14px] md:text-[15px] leading-body max-w-prose">
                    This is the answer to the FAQ. The content would come from
                    your data source — replace with the actual answer text.
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
