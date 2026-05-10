import { Link } from "@remix-run/react";
import { footerLinks, footerPopular } from "~/data/homepage";

const INSTAGRAM_URL =
  "https://www.instagram.com/royalrose_au?igsh=MTVxOWR0MXNicnFpcQ==";

export default function Footer() {
  return (
    <footer className="bg-bone border-t border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10">
          {/* Brand + contact */}
          <div className="md:col-span-4">
            <Link to="/" className="inline-block mb-6">
              <span className="font-display text-charcoal text-[26px] tracking-tight leading-none">
                Royal Rose
              </span>
            </Link>
            <a
              href="tel:0451182178"
              className="block font-display text-charcoal text-[20px] hover:text-terracotta transition-colors"
            >
              0451 182 178
            </a>
            <p className="text-[13px] text-ink-muted mt-2">
              Sydney studio · Mon — Sat
            </p>
          </div>

          {/* Popular */}
          <div className="md:col-span-3">
            <div className="eyebrow mb-5">Popular</div>
            <ul className="space-y-2.5">
              {footerPopular.map((item, index) => (
                <li key={index}>
                  <Link
                    to="/products"
                    className="text-[14px] text-charcoal hover:text-terracotta transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <div className="eyebrow mb-5">Quick links</div>
            <ul className="space-y-2.5">
              {footerLinks.map((item, index) => (
                <li key={index}>
                  <span className="text-[14px] text-charcoal hover:text-terracotta transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Social + payment */}
          <div className="md:col-span-2">
            <div className="eyebrow mb-5">Follow</div>
            <div className="flex gap-4 text-charcoal mb-8">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="hover:text-terracotta transition-colors"
              >
                <i className="ri-instagram-line text-[22px]"></i>
              </a>
              <span aria-hidden className="hover:text-terracotta transition-colors cursor-pointer">
                <i className="ri-facebook-circle-fill text-[22px]"></i>
              </span>
            </div>
            <div className="eyebrow mb-3">We accept</div>
            <div className="flex flex-wrap gap-2 opacity-80">
              <img alt="Visa" width="40" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704094/visa-60cf74cbad7400ab7427cd41529af15330af6383_spuac2.svg" />
              <img alt="MasterCard" width="40" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704094/mastercard-2789e991b7ade46039eafc9c2dee83e7713eddb3_bwvc1z.svg" />
              <img alt="Amex" width="40" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704112/amex-07ada099123d628aca142a88f03a41bf0af62076_br4ty5.svg" />
              <img alt="PayPal" width="40" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704095/paypal-2db521f81867a9e2879753ee1a4889d0ef6af0e8_vfncb8.svg" />
            </div>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] text-ink-muted">
          <div>© {new Date().getFullYear()} Royal Rose Florist. Sydney.</div>
          <div className="flex gap-8">
            <span className="hover:text-charcoal transition-colors cursor-pointer">
              Terms
            </span>
            <span className="hover:text-charcoal transition-colors cursor-pointer">
              Privacy
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
