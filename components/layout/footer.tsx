"use client";

import Link from "next/link";
import { OptimizedImage } from "@/components/optimized-image";

const footerLinks = [
  { href: "/products", label: "Products" },
  { href: "/stories", label: "Stories" },
  { href: "/about", label: "About" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

const socialLinks = [
  {
    href: "https://www.facebook.com/shahzaibelectronics1",
    label: "Facebook",
  },
  {
    href: "https://www.instagram.com/shahzaib.electronics/",
    label: "Instagram",
  },
  {
    href: "https://www.tiktok.com/@shahzaibelectronics_1",
    label: "TikTok",
  },
];

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8 transition-colors duration-300">
      <div className="px-4 md:px-8 lg:px-40">
        <div className="flex flex-col md:flex-row md:flex-wrap justify-between items-center md:items-start gap-8 mb-12">
          {/* Logo and Description */}
          <div className="text-center md:text-left">
            <Link
              href="/"
              className="flex items-center justify-center md:justify-start gap-3 text-text-primary mb-4"
              aria-label="Shahzaib Electronics home"
            >
              <OptimizedImage
                src="/web-app-manifest-512x512.png"
                alt="Shahzaib Electronics"
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

          {/* Follow Us */}
          <div className="flex flex-col gap-3 text-sm font-medium text-text-muted">
            <p className="font-semibold text-text-primary">Follow Us</p>
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors block"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Contact Info */}
          <div className="text-sm text-text-muted">
            <a
              href="https://maps.google.com/?q=Shop+No.+3+Basher+Centre,+Montgomery+Road,+Lahore"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 mb-3 hover:opacity-80 transition-opacity"
            >
              <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm text-primary">
                <span className="material-symbols-outlined text-lg">
                  location_on
                </span>
              </div>
              <div>
                <p className="font-semibold text-text-primary hover:underline">
                  Shop no 3 Basher Centre
                </p>
                <p className="text-xs">Montgomery Road, Lahore</p>
              </div>
            </a>

            <div className="flex items-start gap-3 mb-2">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm text-primary">
                <span className="material-symbols-outlined text-lg">call</span>
              </div>
              <div>
                <a href="tel:+923260454233" className="hover:underline">
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
        </div>

        {/* Copyright / Agency Credit */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-border pt-6 pb-8">
          <p className="text-xs text-text-subtle">
            © {new Date().getFullYear()} Shahzaib Electronics. All rights
            reserved.
          </p>

          <p className="text-xs text-text-subtle mt-4 md:mt-0">
            Developed by{" "}
            <a
              href="https://www.deepdevsolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-text-secondary hover:text-primary transition-all duration-300 relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
            >
              Deep Dev Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
