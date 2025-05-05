import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";

interface BannerContent {
  title: string;
  subtitle: string;
  content: string;
  imageUrl: string;
}

export default function Hero() {
  const [banner, setBanner] = useState<BannerContent | null>(null);

  useEffect(() => {
    async function fetchBanner() {
      const res = await fetch("/api/page-content/home-banner");
      const data = await res.json();
      setBanner(data);
    }
    fetchBanner();
  }, []);

  if (!banner) {
    return null; // 或者可以写一个 loading skeleton
  }

  return (
    <div>
      <div className="relative h-[300px] md:h-[400px] lg:h-[488px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${banner.imageUrl}')`
          }}
        ></div>

        <div className="absolute inset-0 flex items-center justify-center text-white z-10 flex-col px-4 text-center top-1/3">
          <div className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-widest pb-2 md:pb-4">
            {banner.title}
          </div>
          <div className="text-3xl md:text-4xl lg:text-5xl font-bold">
            {banner.content}
          </div>
          <Link to="/products" className="mt-4 md:mt-8 bg-white text-black px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors">
            ORDER NOW
          </Link>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
      </div>
    </div>
  );
}
