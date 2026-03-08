import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import type { Service } from "@prisma/client";
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
  let services: Service[] = [];
  let preSelectedService: Service | null = null;

  try {
    services = await prisma.service.findMany({
      where: { isActive: true },
    });

    // Resolve searchParams safely (some runtimes may pass a Promise)
    const resolvedSearchParams = await searchParams;
    const preSelectedServiceSlug = resolvedSearchParams?.service;
    preSelectedService = preSelectedServiceSlug
      ? (services.find((s) => s.slug === preSelectedServiceSlug) ?? null)
      : null;
  } catch (err) {
    // Server-side logging for diagnostics
    // Use console.error here; replace with Sentry or other DSN if available
    // so errors are captured in production monitoring.
    // eslint-disable-next-line no-console
    console.error("Checkout page data fetch error:", err);

    // Render a friendly error UI so the page doesn't crash for users.
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
        <div className="bg-slate-900 py-12 px-4 shadow-inner">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <h1 className="text-3xl font-black text-white">Secure Checkout</h1>
          </div>
        </div>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full text-center bg-white dark:bg-slate-800 rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold text-rose-600">
              Something went wrong
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              We were unable to load checkout data. Please try again or contact
              support if the problem persists.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/checkout"
                className="inline-flex items-center px-4 py-2 rounded-md bg-slate-900 text-white font-medium"
              >
                Retry
              </a>

              <a
                href="mailto:support@yourdomain.com?subject=Checkout%20error"
                className="inline-flex items-center px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-sm"
              >
                Contact support
              </a>
            </div>

            <details className="mt-4 text-xs text-slate-500 text-left">
              <summary className="cursor-pointer">Technical details</summary>
              <pre className="whitespace-pre-wrap">{String(err)}</pre>
            </details>
          </div>
        </main>
      </div>
    );
  }

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
