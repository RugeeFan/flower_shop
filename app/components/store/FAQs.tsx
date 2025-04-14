import React, { useState } from "react";
import { faqs } from "~/data/homepage";

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index: any) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40">
      <div className="py-6 sm:py-10">
        <hr />
      </div>
      <div className="font-bold text-xl sm:text-2xl">FAQS</div>
      <hr />
      <div className="py-4 sm:py-6">
        {faqs.map((item, index) => (
          <div key={index}>
            <div
              className="flex justify-between font-semibold pt-3 sm:pt-4 pb-2 cursor-pointer"
              onClick={() => toggleFAQ(index)}
            >
              <div className="pr-4">{item}</div>
              <div>{openIndex === index ? "-" : "+"}</div>
            </div>
            {openIndex === index && (
              <div className="pb-3 text-sm sm:text-base text-gray-700">
                This is the answer to the FAQ. The content would come from your data source.
                You can replace this with the actual answer content from your data.
              </div>
            )}
            <div className="border-t border-dashed border-black"></div>
          </div>
        ))}
      </div>
    </div>
  );
}