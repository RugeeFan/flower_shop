import SearchBar from "./SearchBar";
import LocationPopup from "./LocationPopup";
import AuthPopup from "./AuthPopup";
import CartPopup from "./CartPopup";
import CustomerDropDown from "./CustomerDropDown";
import { useState, useRef, useEffect } from "react";
import { useCartStore } from "~/zustand/useCartStore";
import { Link, useLoaderData } from "@remix-run/react";

type RootLoaderData = {
  user: { id: string; email: string } | null;
};

function TopNav() {
  const { user } = useLoaderData<RootLoaderData>();
  const isLoggedIn = !!user;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(() => !isLoggedIn);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const phoneNumber = "0457660185";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      {isSearchOpen && <SearchBar onClose={() => setIsSearchOpen(false)} />}
      {isLocationOpen && <LocationPopup onClose={() => setIsLocationOpen(false)} />}
      {isAuthOpen && !isLoggedIn && <AuthPopup onClose={() => setIsAuthOpen(false)} />}
      {isCartOpen && <CartPopup onClose={() => setCartOpen(false)} />}

      <div className="grid grid-cols-3 py-2 md:py-4 border-0 md:border border-b-1 border-primary">
        {/* 左侧电话 */}
        <div className="hidden md:flex justify-center items-center gap-4 text-primary">
          <a href={`tel:${phoneNumber}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <i className="ri-phone-line text-4xl"></i>
            <div className="text-lg">0457 660 185</div>
          </a>
        </div>

        {/* 移动端菜单 */}
        <div className="flex md:hidden items-center justify-start pl-4">
          <i
            className="ri-menu-line text-2xl text-primary cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          ></i>
        </div>

        {/* LOGO */}
        <div className="h-16 md:h-20 relative flex justify-center items-center">
          <Link to="/">
            <img
              className="w-[68px] md:w-[110px] object-contain"
              src="https://res.cloudinary.com/djwau0xeb/image/upload/v1745231609/logo_pmahyd.png"
              alt="logo"
            />
          </Link>
        </div>

        {/* 右侧图标栏 */}
        <div className="flex gap-2 md:gap-4 justify-end md:justify-center items-center text-primary pr-4 md:pr-0">
          <i
            className="ri-search-line text-xl md:text-3xl cursor-pointer"
            onClick={() => setIsSearchOpen(true)}
          ></i>

          {/* 登录状态判断 */}
          {isLoggedIn ? null : (
            <i
              className="ri-user-line text-xl md:text-3xl cursor-pointer"
              onClick={() => setIsAuthOpen(true)}
            ></i>
          )}

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
      <div className="flex justify-end items-center gap-4 pr-4 md:px-48 py-2 md:py-4">
        {isLoggedIn ? (<div>

          <div className="relative" ref={dropdownRef}>
            <p className="text-primary">Welcome ,<button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="text-sm md:text-base hover:underline text-primary"
            >
              {user.email}
            </button>
              {isDropdownOpen && <CustomerDropDown />}</p>
          </div>
        </div>
        ) : null}
      </div>
    </div>
  );
}

export default TopNav;
