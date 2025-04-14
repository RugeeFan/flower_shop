import { useEffect, useRef } from "react";

interface LocationPopupProps {
  onClose: () => void;
}

export default function LocationPopup({ onClose }: LocationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleNavigate = () => {
    // 使用 Google Maps 导航
    window.open('https://maps.google.com/?q=Westfield+Bondi+Junction+Level+1,+500+Oxford+Street', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div
        ref={popupRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 md:p-8"
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
            Our Location
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-lg md:text-xl font-semibold text-primary">
            Pearsons Florist - Westfield Bondi
          </div>

          <div
            onClick={handleNavigate}
            className="space-y-1 cursor-pointer group"
          >
            <div className="font-bold text-gray-800 group-hover:text-primary transition-colors">
              Westfield Bondi Junction
            </div>
            <div className="font-bold underline text-gray-800 group-hover:text-primary transition-colors">
              Level 1, 500 Oxford Street
            </div>
          </div>

          <div className="text-gray-600 italic">
            (just ask for the amazing florist near Harris Farm)
          </div>

          <div className="flex items-center gap-2 pt-2">
            <i className="ri-phone-line text-xl text-primary"></i>
            <a
              href="tel:0293890111"
              className="text-primary hover:opacity-80 transition-opacity"
            >
              02 9389 0111
            </a>
          </div>

          <button
            onClick={handleNavigate}
            className="w-full mt-6 bg-primary text-white py-3 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
          >
            <i className="ri-map-pin-line"></i>
            Get Directions
          </button>
        </div>
      </div>
    </div>
  );
} 