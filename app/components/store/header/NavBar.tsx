import { Link } from "@remix-run/react";
import { navBarTitle, categoryListTag } from "~/data/homepage";
import { useState } from "react";
import SearchBar from "./SearchBar";
import LocationPopup from "./LocationPopup";
import AuthPopup from "./AuthPopup";
import CartPopup from "./CartPopup";
import DropdownMenu from "./DropdownMenu";
import { useCartStore } from "~/cart/useCartStore";

// 导入或复制映射对象
const occasionToUrlMap: Record<string, string> = {
  "Anniversary": "anniversary",
  "Sympathy Flowers For The Home": "sympathy-flowers-for-the-home",
  "Get Well": "get-well",
  "Celebration": "celebration",
  "Corporate": "corporate",
  "Valentines Day": "valentines-day",
  "Christmas": "christmas",
  "Same Day Delivery": "same-day-delivery",
  "Multi Coloured Flower Arrangements": "multi-coloured-flower-arrangements",
  "Birthday": "birthday",
  "New Baby": "new-baby",
  "I'm Sorry": "im-sorry",
  "Thank You": "thank-you",
  "Congratulations": "congratulations",
  "Mothers Day": "mothers-day",
  "Romance": "romance",
  "Green Flowers": "green-flowers",
  "Funeral Flowers": "funeral-flowers",
  "Bestsellers": "bestsellers"
};

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  const [isOccasionDropdownOpen, setIsOccasionDropdownOpen] = useState(false);
  const phoneNumber = "1300158899";

  const handleMenuItemClick = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleOccasionDropdown = () => {
    setIsOccasionDropdownOpen(!isOccasionDropdownOpen);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = () => {
    if (isOccasionDropdownOpen) {
      setIsOccasionDropdownOpen(false);
    }
  };

  // 获取URL路径的辅助函数
  const getUrlPath = (item: string) => {
    return occasionToUrlMap[item] || item.toLowerCase().replace(/\s+/g, '-');
  };

  return <div className="relative" onClick={handleClickOutside}>
    {/* Search Bar Overlay */}
    {isSearchOpen && (
      <SearchBar onClose={() => setIsSearchOpen(false)} />
    )}

    {/* Location Popup */}
    {isLocationOpen && (
      <LocationPopup onClose={() => setIsLocationOpen(false)} />
    )}

    {/* Auth Popup */}
    {isAuthOpen && (
      <AuthPopup onClose={() => setIsAuthOpen(false)} />
    )}

    {/* Cart Popup */}
    {isCartOpen && <CartPopup onClose={() => setCartOpen(false)} />}

    {/* Top Section with Logo and Icons */}
    <div className="grid grid-cols-3 py-2 md:py-4 border-0 md:border border-b-1 border-primary">
      {/* Phone Number - Hidden on Mobile */}
      <div className="hidden md:flex justify-center items-center gap-4 text-primary">
        <a href={`tel:${phoneNumber}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <i className="ri-phone-line text-4xl"></i>
          <div className="text-lg">1300 158 899</div>
        </a>
      </div>

      {/* Mobile Menu Button - Visible only on Mobile */}
      <div className="flex md:hidden items-center justify-start pl-4">
        <i
          className="ri-menu-line text-2xl text-primary cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        ></i>
      </div>

      {/* Logo */}
      <div className="h-16 md:h-20 relative flex justify-center items-center">
        <Link to="/">
          <img
            className="w-[140px] md:w-[220px] object-contain"
            src="/logo.png"
            alt="logo"
          />
        </Link>
      </div>

      {/* Icons */}
      <div className="flex gap-2 md:gap-4 justify-end md:justify-center items-center text-primary pr-4 md:pr-0">
        <i
          className="ri-search-line text-xl md:text-3xl cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsSearchOpen(true)}
        ></i>
        <i
          className="ri-user-line text-xl md:text-3xl cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsAuthOpen(true)}
        ></i>
        <i
          className="ri-map-pin-line text-xl md:text-3xl cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsLocationOpen(true)}
        ></i>
        <i
          className="ri-shopping-cart-line text-xl md:text-3xl cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setCartOpen(true)}
        ></i>
      </div>
    </div>

    {/* Desktop Navigation */}
    <div className="hidden md:flex gap-24 justify-center items-center py-4 border border-b-2 border-primary font-semibold">
      {navBarTitle.map((title, index) => {
        if (title === "OCCATION") {
          return (
            <div key={title} onClick={(e) => e.stopPropagation()}>
              <DropdownMenu
                title={title}
                items={categoryListTag}
                isOpen={isOccasionDropdownOpen}
                onToggle={toggleOccasionDropdown}
                onClose={() => setIsOccasionDropdownOpen(false)}
              />
            </div>
          );
        }
        if (title === "SHOP ALL") {
          return (
            <Link
              key={title}
              to="/products"
              className="text-center text-primary cursor-pointer"
              onClick={() => setIsOccasionDropdownOpen(false)}
            >
              {title}
            </Link>
          );
        }
        if (title === "BEST SELLERS") {
          return (
            <Link
              key={title}
              to="/categories/bestsellers"
              className="text-center text-primary cursor-pointer"
              onClick={() => setIsOccasionDropdownOpen(false)}
            >
              {title}
            </Link>
          );
        }
        return (
          <div key={title} className="text-center text-primary cursor-pointer">
            {title}
          </div>
        );
      })}
    </div>

    {/* Mobile Navigation Menu */}
    <div className={`md:hidden bg-white absolute left-0 w-full z-50 transition-all duration-300 ${isMobileMenuOpen ? 'max-h-[600px]' : 'max-h-0'} overflow-hidden`}>
      {/* Mobile Phone Number */}
      <a
        href={`tel:${phoneNumber}`}
        className="flex items-center gap-2 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <i className="ri-phone-line text-2xl text-primary"></i>
        <span className="text-primary">1300 158 899</span>
      </a>

      {/* Mobile Navigation Links */}
      <div className="flex flex-col">
        {navBarTitle.map((title) => {
          if (title === "OCCATION") {
            return (
              <div key={title} className="border-b border-gray-200">
                <div
                  className="p-4 text-primary flex justify-between items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOccasionDropdown();
                  }}
                >
                  <DropdownMenu
                    title={title}
                    items={categoryListTag}
                    isOpen={isOccasionDropdownOpen}
                    onToggle={toggleOccasionDropdown}
                    isMobile={true}
                  />
                </div>
                {isOccasionDropdownOpen && (
                  <div className="bg-gray-50 px-4 py-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {categoryListTag.map((item) => (
                        <Link
                          key={item}
                          to={`/categories/${getUrlPath(item)}`}
                          onClick={handleMenuItemClick}
                          className="text-sm text-gray-700 hover:text-primary transition-colors"
                        >
                          {item}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={title}
              to="/categories"
              onClick={handleMenuItemClick}
              className="p-4 text-primary border-b border-gray-200 last:border-b-0"
            >
              {title}
            </Link>
          );
        })}
      </div>
    </div>

    {/* Delivery Notice */}
    <div className="flex items-center justify-center py-2 bg-[#F5F0EC] text-xs md:text-sm px-4 text-center">
      <p>Order now for delivery on Monday
        <span><i className="ri-flower-line mx-2"></i></span>
        Same day flower delivery Monday – Saturday
      </p>
    </div>
  </div>;
}
