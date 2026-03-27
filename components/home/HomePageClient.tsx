"use client";

import { CartProvider } from "@/context/cart-context";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

import { HomeHero } from "@/components/home/HomeHero";
import { BrandSlider } from "@/components/home/BrandSlider";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { MultimediaSection } from "@/components/home/MultimediaSection";
import { WeeklyBestSellers } from "@/components/home/WeeklyBestSellers";
import { NewsletterCta } from "@/components/home/NewsletterCta";

export default function HomePageClient() {
  const homepageFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Are you the direct importer of car electronics in Lahore?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Shahzaib Electronics is a direct importer and wholesale distributor. This allows us to offer the best prices on Android panels, speakers, and other car accessories by cutting out the middleman.",
        },
      },
      {
        "@type": "Question",
        name: "Do you offer installation for your products?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, we offer professional, at-home installation services for all of our multimedia systems and car accessories. You can book an installation directly on our website.",
        },
      },
    ],
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-background-light font-display">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(homepageFaqJsonLd),
          }}
        />
        <Header />
        <main>
          <HomeHero />
          <BrandSlider />
          <FeaturedProducts />
          <MultimediaSection />
          <WeeklyBestSellers />
          <NewsletterCta />
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
