import { useEffect, useState } from "react";

export default function Carousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrevIndex(currentIndex);
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [currentIndex, images.length]);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full h-full max-h-[600px] overflow-hidden rounded-none">
      {images.map((img, index) => {
        const isCurrent = index === currentIndex;
        const isPrev = index === prevIndex;

        const baseStyle =
          "absolute inset-0 w-full h-full bg-center bg-cover transition-opacity duration-[1500ms] ease-in-out";

        return (
          <div
            key={index}
            className={`${baseStyle} ${isCurrent
              ? "opacity-100 z-2"
              : isPrev
                ? "opacity-0 z-1"
                : "opacity-0 z-0"
              }`}
            style={{ backgroundImage: `url(${img})` }}
          />
        );
      })}
    </div>
  );
}
