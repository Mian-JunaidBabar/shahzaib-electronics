import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Checkout",
};

export const revalidate = 0; // Don't cache checkout

export default async function CheckoutPage({
  searchParams,
}: {
  // `searchParams` may be a Promise in some Next.js runtimes — await it before use.
  searchParams: Promise<{ service?: string }> | { service?: string };
}) {
  // Fetch active services to show as upsells in the checkout flow
  const services = await prisma.service.findMany({
    where: { isActive: true },
  });

  // Find the pre-selected service if provided in URL params
  const resolvedSearchParams = await searchParams;
  const preSelectedServiceSlug = resolvedSearchParams?.service;
  const preSelectedService = preSelectedServiceSlug
    ? services.find((s) => s.slug === preSelectedServiceSlug)
    : null;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
      {/* Minimal Header */}
      <div className="bg-slate-900 py-12 px-4 shadow-inner">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-black text-white">Secure Checkout</h1>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span className="text-sm font-bold uppercase tracking-widest">
              Secure &amp; Private
            </span>
          </div>
        </div>
      </div>

      <main className="flex flex-col lg:flex-row flex-1 max-w-full mx-auto w-full">
        <CheckoutFlow
          availableServices={services}
          preSelectedServiceId={preSelectedService?.id}
        />
      </main>
    </div>
  );
}
