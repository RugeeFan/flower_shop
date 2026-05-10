import { Link } from "@remix-run/react";
import {
  navBarTitle,
  categoryListTag,
  weddingServiceTag,
} from "~/data/homepage";
import { useState } from "react";
import SearchBar from "./SearchBar";
import LocationPopup from "./LocationPopup";
import AuthPopup from "./AuthPopup";
import CartPopup from "./CartPopup";
import DropdownMenu from "./DropdownMenu";
import { useCartStore } from "~/zustand/useCartStore";
import { useDropdownStore } from "~/zustand/useDropdownStore";

import CustomerDropDown from "./CustomerDropDown";
import { useRef, useEffect } from "react";
import { } from "~/zustand/useCartStore";
import { useLoaderData } from "@remix-run/react";

type RootLoaderData = {
  user: { id: string; email: string } | null;
};
export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  const closeDropdown = useDropdownStore((state) => state.close);

  const phoneNumber = "0451182178";

  const handleMenuItemClick = () => {
    setIsMobileMenuOpen(false);
    closeDropdown();
  };
  const { user } = useLoaderData<RootLoaderData>();
  const isLoggedIn = !!user;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


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
    <div
      className="relative"
      onClick={(e) => {
        // ✅ 只在电脑端执行自动关闭逻辑
        if (window.innerWidth >= 768 && !(e.target as HTMLElement).closest(".dropdown-container")) {
          closeDropdown();
        }
      }}
    >
      {/* <TopNav /> */}
      {/* Search / Popup */}
      {/* {isSearchOpen && <SearchBar onClose={() => setIsSearchOpen(false)} />}
      {isLocationOpen && (
        <LocationPopup onClose={() => setIsLocationOpen(false)} />
      )}
      {isAuthOpen && <AuthPopup onClose={() => setIsAuthOpen(false)} />}
      {isCartOpen && <CartPopup onClose={() => setCartOpen(false)} />} */}

      {/* 顶部 Logo & 图标 */}
      {/* <div className="grid grid-cols-3 py-2 md:py-4 border-0 md:border border-b-1 border-primary">
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
      </div> */}
      {isSearchOpen && <SearchBar onClose={() => setIsSearchOpen(false)} />}
      {isLocationOpen && <LocationPopup onClose={() => setIsLocationOpen(false)} />}
      {isAuthOpen && !isLoggedIn && <AuthPopup onClose={() => setIsAuthOpen(false)} />}
      {isCartOpen && <CartPopup onClose={() => setCartOpen(false)} />}

      <div className="grid grid-cols-3 py-2 md:py-4 border-0 md:border border-b-1 border-primary">
        {/* 左侧电话 */}
        <div className="hidden md:flex justify-center items-center gap-4 text-primary">
          <a href={`tel:${phoneNumber}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <i className="ri-phone-line text-4xl"></i>
            <div className="text-lg">0451 182 178</div>
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

      {/* 桌面端导航 */}
      <div className="hidden md:flex gap-24 justify-center items-center py-4 border border-b-2 border-primary font-semibold">
        {navBarTitle.map((title) => {
          if (title === "OCCATION") {
            return (
              <DropdownMenu
                key={title}
                title={title}
                items={categoryListTag}
                dropdownKey="occasion"
              />
            );
          }
          if (title === "WEDDINGS & SERVICES") {
            return (
              <DropdownMenu
                key={title}
                title={title}
                items={weddingServiceTag}
                dropdownKey="wedding"
              />
            );
          }
          if (title === "SHOP ALL") {
            return (
              <Link key={title} to="/products" className="text-primary">
                {title}
              </Link>
            );
          }
          if (title === "BEST SELLERS") {
            return (
              <Link
                key={title}
                to="/categories/bestsellers"
                className="text-primary"
              >
                {title}
              </Link>
            );
          }
          if (title === "ABOUT US") {
            return (
              <Link
                key={title}
                to="/about"
                className="text-primary"
              >
                {title}
              </Link>
            );
          }
          if (title === "HOME") {
            return (
              <Link
                key={title}
                to="/"
                className="text-primary"
              >
                {title}
              </Link>
            );
          }
          return (
            <div key={title} className="text-primary cursor-default">
              {title}
            </div>
          );
        })}
      </div>

      {/* 移动端菜单 */}
      <div
        className={`md:hidden bg-white absolute left-0 w-full z-50 transition-all duration-300 ${isMobileMenuOpen ? "max-h-[600px]" : "max-h-0"
          } overflow-hidden`}
      >
        <a
          href={`tel:${phoneNumber}`}
          className="flex items-center gap-2 p-4 border-b border-gray-200"
        >
          <i className="ri-phone-line text-2xl text-primary"></i>
          <span className="text-primary">0451 182 178</span>
        </a>

        <div className="flex flex-col">
          {navBarTitle.map((title) => {
            if (title === "OCCATION") {
              return (
                <DropdownMenu
                  key={title}
                  title={title}
                  items={categoryListTag}
                  isMobile={true}
                  dropdownKey="occasion"
                />
              );
            }
            if (title === "WEDDINGS & SERVICES") {
              return (
                <DropdownMenu
                  key={title}
                  isMobile={true}
                  title={title}
                  items={weddingServiceTag}
                  dropdownKey="wedding"
                />
              );
            }
            if (title === "SHOP ALL") {
              return (
                <Link onClick={handleMenuItemClick} key={title} to="/products"
                  className="p-4 text-primary border-b border-gray-200 last:border-b-0">
                  {title}
                </Link>
              );
            }
            if (title === "BEST SELLERS") {
              return (
                <Link
                  key={title}
                  onClick={handleMenuItemClick}
                  to="/categories/bestsellers"
                  className="p-4 text-primary border-b border-gray-200 last:border-b-0"
                >
                  {title}
                </Link>
              );
            }
            if (title === "ABOUT US") {
              return (
                <Link
                  key={title}
                  onClick={handleMenuItemClick}
                  to="/about"
                  className="p-4 text-primary border-b border-gray-200 last:border-b-0"
                >
                  {title}
                </Link>
              );
            }
            if (title === "HOME") {
              return (
                <Link
                  className="p-4 text-primary border-b border-gray-200 last:border-b-0"
                  key={title}
                  onClick={handleMenuItemClick}
                  to="/"

                >
                  {title}
                </Link>
              );
            }
            return (
              <Link
                key={title}
                to="/products"
                onClick={handleMenuItemClick}
                className="p-4 text-primary border-b border-gray-200 last:border-b-0"
              >
                {title}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 通知栏 */}
      <div className="flex items-center justify-center py-2 bg-[#F5F0EC] text-xs md:text-sm px-4 text-center">
        <p>
          Order now for delivery on Monday
          <span>
            <i className="ri-flower-line mx-2"></i>
          </span>
          Same day flower delivery Monday – Saturday
        </p>
      </div>
    </div >
  );
}
