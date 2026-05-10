import { useEffect, useRef } from "react";

interface LocationPopupProps {
  onClose: () => void;
}

const STORES = [
  {
    name: "Royal Rose - Parramatta",
    addressLine1: "Parramatta Square",
    addressLine2: "Parramatta NSW 2150",
    mapsUrl:
      "https://www.google.com/maps?q=Parramatta+Square,+Parramatta+NSW+2150",
    phone: "0457 660 185",
  },
  {
    name: "Royal Rose - Gordon (Amazing Flowers)",
    addressLine1: "7a/802-808 Pacific Hwy",
    addressLine2: "Gordon NSW 2072",
    mapsUrl:
      "https://www.google.com/maps?q=7a/802-808+Pacific+Hwy,+Gordon+NSW+2072",
    phone: "0457 660 185",
  },
];

export default function LocationPopup({ onClose }: LocationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div
        ref={popupRef}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 md:p-8"
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
            Our Stores
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="space-y-6">
          {STORES.map((store, index) => (
            <div key={index} className="border-b pb-4 last:border-none">
              <div className="text-lg md:text-xl font-semibold text-primary">
                {store.name}
              </div>

              <div
                onClick={() => window.open(store.mapsUrl, "_blank")}
                className="space-y-1 cursor-pointer group mt-1"
              >
                <div className="font-bold text-gray-800 group-hover:text-primary transition-colors">
                  {store.addressLine1}
                </div>
                <div className="font-bold underline text-gray-800 group-hover:text-primary transition-colors">
                  {store.addressLine2}
                </div>
              </div>

              <div className="text-gray-600 italic mt-1">
                (Tap for directions on Google Maps)
              </div>

              <div className="flex items-center gap-2 pt-2">
                <i className="ri-phone-line text-xl text-primary"></i>
                <a
                  href={`tel:${store.phone}`}
                  className="text-primary hover:opacity-80 transition-opacity"
                >
                  {store.phone}
                </a>
              </div>

              <button
                onClick={() => window.open(store.mapsUrl, "_blank")}
                className="w-full mt-4 bg-primary text-white py-2.5 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-map-pin-line"></i>
                Get Directions
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
