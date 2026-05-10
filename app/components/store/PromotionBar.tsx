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

  if (!promotion) return null;

  // Build a single marquee line from non-empty fields, separated by a thin bullet.
  const parts = [promotion.title, promotion.subtitle, promotion.content]
    .map((p) => p?.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const text = parts.join("  ·  ");

  return (
    <div className="bg-charcoal text-bone overflow-hidden py-2.5">
      <div
        ref={containerRef}
        className="marquee3k"
        data-speed="0.4"
        data-pausable="true"
      >
        <span className="px-6 text-[12px] tracking-eyebrow uppercase whitespace-nowrap">
          {text}
        </span>
      </div>
    </div>
  );
}
