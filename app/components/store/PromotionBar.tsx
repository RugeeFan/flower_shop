import { useEffect, useRef, useState } from "react";
import Marquee3k from "marquee3000";

interface PromotionContent {
  title: string;
  subtitle: string;
  content: string;
}

export default function PromotionBar() {
  const [promotion, setPromotion] = useState<PromotionContent | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPromotion() {
      const res = await fetch("/api/page-content/home-promotion-bar");
      const data = await res.json();
      setPromotion(data);
    }
    fetchPromotion();
  }, []);

  useEffect(() => {
    if (promotion) {
      Marquee3k.init();
    }
  }, [promotion]);

  if (!promotion) {
    return null;
  }

  const text = `${promotion.title} — ${promotion.subtitle} — ${promotion.content}`;

  return (
    <div className="bg-yellow-400 overflow-hidden py-2">
      <div
        ref={containerRef}
        className="marquee3k"
        data-speed="0.5"
        data-pausable="true"
      // 删除 data-reverse，让它默认从右到左
      >
        <span className="px-4 text-sm sm:text-base font-semibold whitespace-nowrap">{text}</span>
      </div>
    </div>
  );
}
