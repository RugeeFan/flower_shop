import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@heroicons/react/24/solid"; // 需要安装 @heroicons/react

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function toggleVisibility() {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center
                 bg-primary text-white shadow-lg hover:bg-primary-dark
                 transition-all duration-300
                 w-12 h-12 md:w-14 md:h-14 rounded-full
                 hover:scale-110 active:scale-95"
      aria-label="Scroll to top"
    >
      <ArrowUpIcon className="w-6 h-6 md:w-7 md:h-7" />
    </button>
  );
}
