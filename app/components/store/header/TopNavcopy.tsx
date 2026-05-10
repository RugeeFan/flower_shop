import SearchBar from "./SearchBar";
import LocationPopup from "./LocationPopup";
import AuthPopup from "./AuthPopup";
import CartPopup from "./CartPopup";
import { useState } from "react";
import { useCartStore } from "~/zustand/useCartStore";
import { Link } from "@remix-run/react";

function TopNav() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const phoneNumber = "0451182178";
  return <div>
    {isSearchOpen && <SearchBar onClose={() => setIsSearchOpen(false)} />}
    {isLocationOpen && (
      <LocationPopup onClose={() => setIsLocationOpen(false)} />
    )}
    {isAuthOpen && <AuthPopup onClose={() => setIsAuthOpen(false)} />}
    {isCartOpen && <CartPopup onClose={() => setCartOpen(false)} />}
    <div className="grid grid-cols-3 py-2 md:py-4 border-0 md:border border-b-1 border-primary">
      <div className="hidden md:flex justify-center items-center gap-4 text-primary">
        <a
          href={`tel:${phoneNumber}`}
          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
        >
          <i className="ri-phone-line text-4xl"></i>
          <div className="text-lg">0451 182 178</div>
        </a>
      </div>

      <div className="flex md:hidden items-center justify-start pl-4">
        <i
          className="ri-menu-line text-2xl text-primary cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        ></i>
      </div>

      <div className="h-16 md:h-20 relative flex justify-center items-center">
        <Link to="/">
          <img
            className="w-[68px] md:w-[110px] object-contain"
            src="https://res.cloudinary.com/djwau0xeb/image/upload/v1745231609/logo_pmahyd.png"
            alt="logo"
          />
        </Link>
      </div>

      <div className="flex gap-2 md:gap-4 justify-end md:justify-center items-center text-primary pr-4 md:pr-0">
        <i
          className="ri-search-line text-xl md:text-3xl cursor-pointer"
          onClick={() => setIsSearchOpen(true)}
        ></i>
        <i
          className="ri-user-line text-xl md:text-3xl cursor-pointer"
          onClick={() => setIsAuthOpen(true)}
        ></i>
        <i
          className="ri-map-pin-line text-xl md:text-3xl cursor-pointer"
          onClick={() => setIsLocationOpen(true)}
        ></i>
        <i
          className="ri-shopping-cart-line text-xl md:text-3xl cursor-pointer"
          onClick={() => setCartOpen(true)}
        ></i>
      </div>
    </div>
  </div>

}

export default TopNav;
