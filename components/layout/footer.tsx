"use client";

import Link from "next/link";
import { OptimizedImage } from "@/components/optimized-image";

const footerLinks = [
  { href: "/products", label: "Products" },
  { href: "/work", label: "Stories" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8 transition-colors duration-300">
      <div className="px-4 md:px-8 lg:px-40">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-12">
          {/* Logo and Description */}
          <div className="text-center md:text-left">
            <Link
              href="/"
              className="flex items-center justify-center md:justify-start gap-3 text-text-primary mb-4"
              aria-label="Shahzaib Autos home"
            >
              <OptimizedImage
                src="/web-app-manifest-512x512.png"
                alt="Shahzaib Autos"
                width={200}
                height={200}
                className="rounded"
              />
            </Link>
            <p className="text-text-muted text-sm max-w-xs">
              Premium automotive solutions for the modern driver. Excellence in
              every detail.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-3 text-sm font-medium text-text-muted">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-text-primary transition-colors block"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact Info */}
          <div className="text-sm text-text-muted">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm text-primary">
                <span className="material-symbols-outlined text-lg">
                  location_on
                </span>
              </div>
              <div>
                <p className="font-semibold text-text-primary">
                  Shop no 3 Basher Centre
                </p>
                <p className="text-xs">Montgomery Road, Lahore</p>
              </div>
            </div>

            <div className="flex items-start gap-3 mb-2">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm text-primary">
                <span className="material-symbols-outlined text-lg">call</span>
              </div>
              <div>
                <a href="tel:03260454233" className="hover:underline">
                  03260454233
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm text-primary">
                <span className="material-symbols-outlined text-lg">email</span>
              </div>
              <div>
                <a
                  href="mailto:owner.shahzaib.autos@gmail.com"
                  className="hover:underline"
                >
                  owner.shahzaib.autos@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Social Links (stacked on the right) */}
          <div className="flex flex-col items-end gap-4">
            <a
              href="#"
              className="text-text-muted hover:text-text-primary transition-colors"
              aria-label="Website"
            >
              <span className="material-symbols-outlined">public</span>
            </a>
            <a
              href="#"
              className="text-text-muted hover:text-text-primary transition-colors"
              aria-label="Like"
            >
              <span className="material-symbols-outlined">thumb_up</span>
            </a>
            <a
              href="#"
              className="text-text-muted hover:text-text-primary transition-colors"
              aria-label="Gallery"
            >
              <span className="material-symbols-outlined">photo_camera</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-8 text-center text-xs text-text-subtle">
          <p>
            © {new Date().getFullYear()} Shahzaib Autos. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
