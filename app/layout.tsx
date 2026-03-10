import "./globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.shahzaibelectronics.pk";
  const BUSINESS_NAME =
    process.env.NEXT_PUBLIC_BUSINESS_NAME || "Shahzaib Electronics";
  const CONTACT_PHONE =
    process.env.NEXT_PUBLIC_CONTACT_PHONE || "+92-337-4990542";
  const CONTACT_EMAIL =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@shahzaib-electronics.com";

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
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <meta
          name="apple-mobile-web-app-title"
          content="Shahzaib Electronics"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster position="top-right" />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID as string} />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </body>
    </html>
  );
}
