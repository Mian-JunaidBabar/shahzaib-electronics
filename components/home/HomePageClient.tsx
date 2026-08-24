"use client";

import { CartProvider } from "@/context/cart-context";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

import { HomeHero } from "@/components/home/HomeHero";
import { BrandSlider } from "@/components/home/BrandSlider";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { MultimediaSection } from "@/components/home/MultimediaSection";
import { NewsletterCta } from "@/components/home/NewsletterCta";
import {
  directImporterFaq,
  professionalInstallationFaq,
} from "@/lib/content/faq-content";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import type { ReactNode } from "react";

// `weeklyBestSellers` is rendered server-side in app/page.tsx (a Server
// Component) and passed in here, because WeeklyBestSellers is itself an
// async Server Component and Next.js doesn't allow importing a Server
// Component directly into a "use client" module — it has to be composed
// in from a Server Component parent instead. See app/page.tsx and
// components/home/WeeklyBestSellers.tsx for the full explanation.
export default function HomePageClient({
  weeklyBestSellers,
}: {
  weeklyBestSellers: ReactNode;
}) {
  const homepageFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [directImporterFaq, professionalInstallationFaq].map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
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
          {weeklyBestSellers}
          {/* Rendered as real visible text, not just JSON-LD — see the
              product-page FAQ for the same fix and why it matters. */}
          <section className="py-16 max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-black text-slate-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <FaqAccordion
              items={homepageFaqJsonLd.mainEntity.map((faq) => ({
                question: faq.name,
                answer: faq.acceptedAnswer.text,
              }))}
            />
          </section>
          <NewsletterCta />
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
