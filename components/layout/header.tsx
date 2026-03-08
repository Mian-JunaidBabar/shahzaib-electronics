"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { useTheme } from "@/context/theme-context";
import { ShoppingCart } from "lucide-react";
import { OptimizedImage } from "@/components/optimized-image";
import { generateWhatsAppUrl } from "@/lib/whatsapp";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Stories" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const distinctCount = items.length;
  const whatsappUrl = generateWhatsAppUrl(
    "Hi! I'm interested in your products.",
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-header-bg backdrop-blur-md transition-colors duration-300">
      <div className="px-4 md:px-8 lg:px-40 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-primary hover:text-primary transition-colors"
        >
          <OptimizedImage
            src={"/icon.svg"}
            alt="Shahzaib Autos"
            width={56}
            height={56}
            className="rounded h-10 md:h-14 w-auto"
          />
          <h2 className="text-primary text-lg font-bold tracking-tight">
            Shahzaib Autos
          </h2>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-muted hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative p-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            {distinctCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-xs font-bold text-white`}
              >
                {distinctCount > 9 ? "9+" : distinctCount}
              </span>
            )}
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex h-9 items-center justify-center rounded-md bg-[#25D366] px-4 text-white text-sm font-semibold shadow-sm hover:bg-[#20bd5a] transition-all focus:ring-1 focus:ring-[#25D366]"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">
              chat
            </span>
            WhatsApp
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-text-muted hover:text-text-primary"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed left-0 right-0 top-16 z-40 transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          aria-label="Close mobile menu"
          className="absolute inset-0 h-[calc(100dvh-4rem)] bg-black/20"
          onClick={() => setMobileMenuOpen(false)}
        />

        <div
          className={`relative border-t border-border bg-background transition-all duration-300 ease-out max-h-[calc(100dvh-4rem)] overflow-y-auto ${
            mobileMenuOpen ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          <nav className="flex flex-col px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart {distinctCount > 0 && `(${distinctCount})`}
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center justify-center rounded-md bg-[#25D366] px-4 text-white text-sm font-semibold shadow-sm hover:bg-[#20bd5a] transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="material-symbols-outlined text-[18px] mr-2">
                chat
              </span>
              WhatsApp
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
