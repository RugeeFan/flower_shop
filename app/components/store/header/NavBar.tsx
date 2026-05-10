import { Link } from "@remix-run/react";
import {
  navBarTitle,
  categoryListTag,
  weddingServiceTag,
} from "~/data/homepage";
import { useState, useRef, useEffect } from "react";
import SearchBar from "./SearchBar";
import LocationPopup from "./LocationPopup";
import AuthPopup from "./AuthPopup";
import CartPopup from "./CartPopup";
import DropdownMenu from "./DropdownMenu";
import CustomerDropDown from "./CustomerDropDown";
import { useCartStore } from "~/zustand/useCartStore";
import { useDropdownStore } from "~/zustand/useDropdownStore";
import { useLoaderData } from "@remix-run/react";

type RootLoaderData = {
  user: { id: string; email: string } | null;
};

const PHONE_NUMBER = "0451182178";
const PHONE_DISPLAY = "0451 182 178";

export default function NavBar() {
  // popup state — DO NOT change semantics, only restyle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  const closeDropdown = useDropdownStore((state) => state.close);

  const { user } = useLoaderData<RootLoaderData>();
  const isLoggedIn = !!user;

  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMobileMenuItemClick = () => {
    setIsMobileMenuOpen(false);
    closeDropdown();
  };

  const renderDesktopNavItem = (title: string) => {
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
    const navLinkClass =
      "text-charcoal text-[12px] font-medium uppercase tracking-eyebrow hover:text-terracotta transition-colors";
    if (title === "SHOP ALL")
      return <Link key={title} to="/products" className={navLinkClass}>{title}</Link>;
    if (title === "BEST SELLERS")
      return <Link key={title} to="/categories/bestsellers" className={navLinkClass}>Best sellers</Link>;
    if (title === "ABOUT US")
      return <Link key={title} to="/about" className={navLinkClass}>About</Link>;
    if (title === "HOME")
      return <Link key={title} to="/" className={navLinkClass}>Home</Link>;
    return <span key={title} className={`${navLinkClass} cursor-default`}>{title}</span>;
  };

  const mobileLinkClass =
    "block px-6 py-4 text-charcoal text-[14px] font-medium tracking-eyebrow uppercase border-b border-border last:border-b-0";

  const renderMobileNavItem = (title: string) => {
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
    if (title === "SHOP ALL")
      return <Link key={title} to="/products" onClick={handleMobileMenuItemClick} className={mobileLinkClass}>Shop all</Link>;
    if (title === "BEST SELLERS")
      return <Link key={title} to="/categories/bestsellers" onClick={handleMobileMenuItemClick} className={mobileLinkClass}>Best sellers</Link>;
    if (title === "ABOUT US")
      return <Link key={title} to="/about" onClick={handleMobileMenuItemClick} className={mobileLinkClass}>About</Link>;
    if (title === "HOME")
      return <Link key={title} to="/" onClick={handleMobileMenuItemClick} className={mobileLinkClass}>Home</Link>;
    return <Link key={title} to="/products" onClick={handleMobileMenuItemClick} className={mobileLinkClass}>{title}</Link>;
  };

  return (
    <div
      className="relative bg-bone"
      onClick={(e) => {
        if (
          window.innerWidth >= 768 &&
          !(e.target as HTMLElement).closest(".dropdown-container")
        ) {
          closeDropdown();
        }
      }}
    >
      {/* Popups (unchanged behavior) */}
      {isSearchOpen && <SearchBar onClose={() => setIsSearchOpen(false)} />}
      {isLocationOpen && <LocationPopup onClose={() => setIsLocationOpen(false)} />}
      {isAuthOpen && !isLoggedIn && <AuthPopup onClose={() => setIsAuthOpen(false)} />}
      {isCartOpen && <CartPopup onClose={() => setCartOpen(false)} />}

      {/* TopBar — phone left, account right (desktop only) */}
      <div className="hidden md:flex items-center justify-between px-8 lg:px-16 py-3 text-[12px] text-ink-muted border-b border-border">
        <a
          href={`tel:${PHONE_NUMBER}`}
          className="hover:text-charcoal transition-colors tracking-eyebrow uppercase"
        >
          {PHONE_DISPLAY}
        </a>
        <div className="flex items-center gap-6">
          {isLoggedIn ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setIsAccountDropdownOpen((p) => !p)}
                className="text-charcoal hover:text-terracotta transition-colors"
              >
                {user.email}
              </button>
              {isAccountDropdownOpen && <CustomerDropDown />}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="hover:text-charcoal transition-colors tracking-eyebrow uppercase"
            >
              Sign in
            </button>
          )}
          <button
            onClick={() => setIsLocationOpen(true)}
            className="hover:text-charcoal transition-colors tracking-eyebrow uppercase"
          >
            Sydney
          </button>
        </div>
      </div>

      {/* Main bar — logo center, mobile menu / search / cart on edges */}
      <div className="grid grid-cols-3 items-center px-4 md:px-8 lg:px-16 py-4 md:py-6">
        {/* Left: mobile menu button (mobile) / search (desktop) */}
        <div className="flex items-center justify-start gap-6">
          <button
            onClick={() => setIsMobileMenuOpen((p) => !p)}
            className="md:hidden text-charcoal"
            aria-label="Open menu"
          >
            <i className="ri-menu-line text-2xl"></i>
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:inline-flex text-charcoal hover:text-terracotta transition-colors text-[12px] font-medium uppercase tracking-eyebrow"
          >
            <i className="ri-search-line text-base mr-2"></i>
            Search
          </button>
        </div>

        {/* Center: logo as wordmark */}
        <div className="flex justify-center items-center">
          <Link to="/" aria-label="Royal Rose home">
            <span className="font-display text-charcoal text-[22px] md:text-[28px] tracking-tight leading-none">
              Royal Rose
            </span>
          </Link>
        </div>

        {/* Right: cart (always) + mobile auth/location collapsed into menu */}
        <div className="flex items-center justify-end gap-5">
          {/* Mobile-only quick icons */}
          <button
            onClick={() => setIsAuthOpen(true)}
            className="md:hidden text-charcoal"
            aria-label="Account"
          >
            <i className="ri-user-line text-xl"></i>
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className="relative text-charcoal hover:text-terracotta transition-colors"
            aria-label="Open cart"
          >
            <i className="ri-shopping-bag-line text-xl md:text-[22px]"></i>
            <span className="hidden md:inline ml-2 text-[12px] font-medium uppercase tracking-eyebrow">
              Bag
            </span>
          </button>
        </div>
      </div>

      {/* Hairline */}
      <div className="hidden md:block h-px bg-border" />

      {/* Desktop nav */}
      <nav className="hidden md:flex justify-center items-center gap-12 lg:gap-16 py-5">
        {navBarTitle.map(renderDesktopNavItem)}
      </nav>

      {/* Mobile nav drawer */}
      <div
        className={`md:hidden absolute left-0 w-full z-50 bg-bone border-t border-border transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? "max-h-[640px]" : "max-h-0"
        }`}
      >
        <a
          href={`tel:${PHONE_NUMBER}`}
          className="flex items-center gap-3 px-6 py-4 border-b border-border text-charcoal text-[14px]"
        >
          <i className="ri-phone-line text-lg text-terracotta"></i>
          <span>{PHONE_DISPLAY}</span>
        </a>
        <div>{navBarTitle.map(renderMobileNavItem)}</div>
        <button
          onClick={() => {
            setIsLocationOpen(true);
            setIsMobileMenuOpen(false);
          }}
          className={`${mobileLinkClass} w-full text-left`}
        >
          Sydney delivery
        </button>
      </div>

      {/* Notification bar */}
      <div className="bg-charcoal text-bone py-2.5 px-4 text-center text-[12px] tracking-wide">
        Same-day delivery across Sydney, Mon — Sat. Order before 2 PM.
      </div>
    </div>
  );
}
