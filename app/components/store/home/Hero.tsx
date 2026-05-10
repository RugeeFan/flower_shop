import { Link } from "@remix-run/react";
import Carousel from "../Carousel";

interface BannerContent {
  title: string | null;
  subtitle: string | null;
  content: string | null;
  imageUrl: string[]; // 你实际字段名若为 imageUrls，则对应调整
}

export default function Hero({ banner }: { banner: BannerContent }) {
  if (!banner) {
    return (
      <div className="h-[300px] md:h-[400px] lg:h-[488px] bg-gray-200 animate-pulse"></div>
    );
  }

  return (
    <div className="relative h-[300px] md:h-[400px] lg:h-[488px] overflow-hidden">
      <Carousel images={banner.imageUrl} />

      <div className="absolute inset-0 flex items-center justify-center text-white z-10 flex-col px-4 text-center md:top-1/3">
        <div className="text-md md:text-2xl lg:text-3xl font-semibold tracking-widest pb-2 md:pb-4">
          {banner.title}
        </div>
        <div className="text-xl md:text-4xl lg:text-5xl font-bold">
          {banner.content}
        </div>
        <Link
          to="/products"
          className="mt-4 md:mt-8 bg-white text-black px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          ORDER NOW
        </Link>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
    </div>
  );
}
