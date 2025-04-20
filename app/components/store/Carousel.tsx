import { useState } from 'react';

export default function Carousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('right');

  const handlePrev = () => {
    if (currentIndex === 0) return;
    setTransitionDirection('left');
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex === images.length - 1) return;
    setTransitionDirection('right');
    setCurrentIndex((prev) => prev + 1);
  };

  if (images.length === 0) return null; // 避免报错

  return (
    <div className="w-full flex flex-col justify-center items-center py-4 md:py-6 lg:py-10">
      <div className="relative w-full aspect-square max-h-[400px] md:max-h-[500px] lg:max-h-[900px] overflow-hidden">
        <div
          className="w-full h-full flex transition-transform duration-500"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img, index) => (
            <div key={index} className="min-w-full h-full">
              <img
                src={img}
                alt="展示商品"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
