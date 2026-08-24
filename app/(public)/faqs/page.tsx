import type { Metadata } from "next";
import Link from "next/link";
import { faqSections } from "@/lib/content/faq-content";
import { FaqAccordion } from "@/components/ui/faq-accordion";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about Shahzaib Electronics: direct-import pricing, nationwide shipping and payment methods, vehicle fitment and Grip-to-Grip installation, and car audio basics.",
  // Without this, Next.js falls back to the root layout's
  // `alternates.canonical: "/"`, which is the same canonical bug
  // fixed on category pages — every route must self-canonicalize.
  alternates: {
    canonical: "/faqs",
  },
  openGraph: {
    title: "Frequently Asked Questions — Shahzaib Electronics",
    description:
      "Answers to common questions about Shahzaib Electronics: direct-import pricing, nationwide shipping and payment methods, vehicle fitment and Grip-to-Grip installation, and car audio basics.",
    url: "/faqs",
    type: "website",
  },
};

export default function FaqsPage() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.shahzaibelectronics.pk";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQs",
        item: `${appUrl}/faqs`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Page Header */}
      <div className="bg-slate-900 py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary via-slate-900 to-slate-900" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Frequently Asked Questions
          </h1>
          <nav className="flex items-center justify-center gap-2 text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="material-symbols-outlined text-[16px]">
              chevron_right
            </span>
            <span className="text-slate-200 font-bold">FAQs</span>
          </nav>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 space-y-16">
        {faqSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-8">
              {section.title}
            </h2>
            <FaqAccordion items={section.faqs} />
          </section>
        ))}
      </main>
    </div>
  );
}
