import "./globals.css";

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
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    template: "%s | Shahzaib Autos",
    default: "Shahzaib Autos - Premium Automotive Accessories & Services",
  },
  description:
    "Upgrade your ride with premium car accessories, 7D mats, LEDs, and professional workshop services at Shahzaib Autos.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon1.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
  appleWebApp: {
    title: "Shahzaib Autos",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-title" content="Shahzaib Autos" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
