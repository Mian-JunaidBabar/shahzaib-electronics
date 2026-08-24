import "./globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import { ThemeProvider } from "@/context/theme-context";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// Plain module-scope constant — `metadata` is evaluated outside the
// RootLayout component, so it can't reach the sanitized BUSINESS_NAME
// defined inside the component below.
const AUTHOR_NAME = "Shahzaib Electronics";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://www.shahzaibelectronics.pk",
  ),
  title: {
    template: "%s | Shahzaib Electronics",
    default: "Shahzaib Electronics - Premium Automotive Accessories & Services",
  },
  description:
    "Shahzaib Electronics is the leading direct importer and wholesale distributor of premium car accessories, Android panels, and audio systems in Lahore, Pakistan.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "/",
    siteName: "Shahzaib Electronics",
    title: "Shahzaib Electronics - Premium Automotive Accessories & Services",
    description:
      "Shahzaib Electronics is the leading direct importer and wholesale distributor of premium car accessories, Android panels, and audio systems in Lahore, Pakistan.",
    images: [
      {
        url: "/apple-icon.png",
        width: 512,
        height: 512,
        alt: "Shahzaib Electronics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shahzaib Electronics - Premium Automotive Accessories & Services",
    description:
      "Shahzaib Electronics is the leading direct importer and wholesale distributor of premium car accessories, Android panels, and audio systems in Lahore, Pakistan.",
    images: ["/apple-icon.png"],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon1.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
  appleWebApp: {
    title: "Shahzaib Electronics",
  },
  authors: [{ name: AUTHOR_NAME }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.shahzaibelectronics.pk";

  // NEXT_PUBLIC_BUSINESS_NAME/CONTACT_PHONE/CONTACT_EMAIL are not currently
  // set in any environment, so the fallbacks below are what actually renders
  // in production. They previously disagreed with the real NAP shown in the
  // footer (a different phone number, and a stale @shahzaib-electronics.com
  // email domain) — that mismatch is exactly the "conflicting phone/email"
  // finding from the SEO audit. Fixed to match the footer's real values.
  // `sanitize` strips stray quote characters (straight or curly) that can
  // end up baked into an env var value if it's ever pasted into a host
  // dashboard (e.g. Vercel) with quotes included — that was the source of
  // the literal \"Shahzaib Electronics\" bug the audit flagged.
  const sanitize = (v: string) => v.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "");

  const BUSINESS_NAME = sanitize(
    process.env.NEXT_PUBLIC_BUSINESS_NAME || "Shahzaib Electronics",
  );
  const CONTACT_PHONE = sanitize(
    process.env.NEXT_PUBLIC_CONTACT_PHONE || "+923260454233",
  );
  const CONTACT_EMAIL = sanitize(
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "owner.shahzaib.autos@gmail.com",
  );
  const STREET_ADDRESS = "Shop No. 3, Basher Centre, Montgomery Road";
  const CITY = "Lahore";
  const COUNTRY = "PK";

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BUSINESS_NAME,
    url: APP_URL,
    logo: `${APP_URL}/icon.png`,
    description:
      "Shahzaib Electronics is the leading direct importer and wholesale distributor of premium car accessories, Android panels, and audio systems in Lahore, Pakistan.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CONTACT_PHONE,
      contactType: "Customer Service",
      email: CONTACT_EMAIL,
    },
    sameAs: [
      "https://www.facebook.com/shahzaibelectronics1",
      "https://www.instagram.com/shahzaib.electronics/",
      "https://www.tiktok.com/@shahzaibelectronics_1",
    ],
  };

  // LocalBusiness schema — previously missing entirely despite a real,
  // staffed storefront. Opening hours are a placeholder (Mon–Sat, 11am–9pm)
  // until confirmed with the client; update openingHoursSpecification once
  // real hours are provided.
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    name: BUSINESS_NAME,
    url: APP_URL,
    image: `${APP_URL}/icon.png`,
    telephone: CONTACT_PHONE,
    email: CONTACT_EMAIL,
    priceRange: "PKR",
    address: {
      "@type": "PostalAddress",
      streetAddress: STREET_ADDRESS,
      addressLocality: CITY,
      addressCountry: COUNTRY,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "11:00",
        closes: "21:00",
      },
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BUSINESS_NAME,
    url: APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${APP_URL}/products?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning className="light">
      <head>
        {/* The audit measured this stylesheet contributing to ~1.86s of
            render-blocking delay on category pages (part of the "LCP is
            Poor site-wide" finding). It's preloaded + injected after the
            initial parse instead of blocking render, with a <noscript>
            fallback so icons still resolve with JS disabled. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          />
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';document.head.appendChild(l);})();`,
          }}
        />
        <meta
          name="apple-mobile-web-app-title"
          content="Shahzaib Electronics"
        />
        <meta name="author" content={BUSINESS_NAME} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider forcedTheme="light">
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID as string} />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              organizationJsonLd,
              localBusinessJsonLd,
              websiteJsonLd,
            ]),
          }}
        />
      </body>
    </html>
  );
}
