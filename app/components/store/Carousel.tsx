// app/components/carousel.tsx
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

  return (
    <div className="w-full flex flex-col justify-center items-center py-4 md:py-6 lg:py-10">
      {/* 上部放大图片区域 */}
      <div className="relative w-full aspect-square max-h-[400px] md:max-h-[500px] lg:max-h-[900px] overflow-hidden">
        <div
          className="w-full h-full flex transition-transform duration-500"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
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

        {/* {currentIndex !== 0 && (
          <i
            onClick={handlePrev}
            className="ri-arrow-left-s-line absolute left-0 md:left-[-20px] lg:left-[-30px] top-1/2 -translate-y-1/2 p-2 md:p-3 text-5xl md:text-6xl lg:text-8xl text-white cursor-pointer bg-black/20 md:bg-transparent rounded-r-lg md:rounded-none"
          ></i>
        )}
        {currentIndex !== images.length - 1 && (
          <i
            onClick={handleNext}
            className="ri-arrow-right-s-line absolute right-0 md:right-[-20px] lg:right-[-30px] top-1/2 -translate-y-1/2 p-2 md:p-3 text-5xl md:text-6xl lg:text-8xl text-white cursor-pointer bg-black/20 md:bg-transparent rounded-l-lg md:rounded-none"
          ></i>
        )} */}
      </div>


      {/* <div className="mt-2 md:mt-4 w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 md:gap-4 justify-start md:justify-center px-2 md:px-0">
          {images.map((img, index) => (
            <div
              key={index}
              onClick={() => {
                setTransitionDirection(index > currentIndex ? 'right' : 'left');
                setCurrentIndex(index);
              }}
              className={`shrink-0 cursor-pointer relative 
                ${index === currentIndex
                  ? 'ring-2 md:ring-4 ring-primary'
                  : 'hover:ring-2 ring-gray-300'
                } rounded-lg transition-all`}
            >
              <img
                src={img}
                alt="缩略图"
                className="w-16 md:w-20 h-16 md:h-20 object-cover rounded"
              />
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}