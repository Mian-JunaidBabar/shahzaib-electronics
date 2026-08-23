"use client";

import { CartProvider } from "@/context/cart-context";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

import { HomeHero } from "@/components/home/HomeHero";
import { BrandSlider } from "@/components/home/BrandSlider";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { MultimediaSection } from "@/components/home/MultimediaSection";
import { NewsletterCta } from "@/components/home/NewsletterCta";
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
          {weeklyBestSellers}
          {/* Rendered as real visible text, not just JSON-LD — see the
              product-page FAQ for the same fix and why it matters. */}
          <section className="py-16 max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-black text-slate-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {homepageFaqJsonLd.mainEntity.map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-slate-200 p-4 open:bg-slate-50"
                >
                  <summary className="cursor-pointer list-none font-medium text-slate-900 flex items-center justify-between gap-4">
                    {faq.name}
                    <span className="text-slate-400 text-sm shrink-0 group-open:hidden">
                      Show
                    </span>
                  </summary>
                  <p className="mt-3 text-slate-600 leading-relaxed">
                    {faq.acceptedAnswer.text}
                  </p>
                </details>
              ))}
            </div>
          </section>
          <NewsletterCta />
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
