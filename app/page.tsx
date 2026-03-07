"use client";

import { CartProvider } from "@/context/cart-context";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

import { HomeHero } from "@/components/home/HomeHero";
import { BrandSlider } from "@/components/home/BrandSlider";
import { NewArrivals } from "@/components/home/NewArrivals";
import { MultimediaSection } from "@/components/home/MultimediaSection";
import { WeeklyBestSellers } from "@/components/home/WeeklyBestSellers";
import { NewsletterCta } from "@/components/home/NewsletterCta";

export default function HomePage() {
  return (
    <CartProvider>
        <div className="min-h-screen bg-background-light font-display">
          <Header />
          <main>
            <HomeHero />
            <BrandSlider />
            <NewArrivals />
            <MultimediaSection />
            <WeeklyBestSellers />
            <NewsletterCta />
          </main>
          <Footer />
        </div>
    </CartProvider>
  );
}
