import { OptimizedImage } from "@/components/optimized-image";
import { getTopSellers } from "@/lib/services/product.service";
import Link from "next/link";

function formatSellerPrice(price: number) {
  return `Rs. ${(price / 100).toLocaleString("en-PK")}`;
}

// Server component — previously this fetched /api/products/top-sellers
// client-side with a loading skeleton. On a slow mobile connection,
// Lighthouse's audit crawl could capture the section still showing that
// skeleton (gray placeholder boxes) before the fetch resolved, which is
// what the SEO audit flagged as "broken product images on mobile" in the
// purchase path. Fetching server-side means the real content — including
// the images — ships in the initial HTML, so there's no loading state to
// get caught mid-flight, and it removes a client JS fetch waterfall from
// the homepage's Total Blocking Time.
export async function WeeklyBestSellers() {
  const sellers = await getTopSellers(2);

  return (
    <section className="py-24 max-w-7xl mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-black text-slate-900 mb-4">
          Weekly Best Sellers
        </h2>
        <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sellers.slice(0, 2).map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:-translate-y-1 transition-transform group"
          >
            <div className="w-full sm:w-1/3 aspect-4/3 sm:aspect-square rounded-xl overflow-hidden bg-slate-100 relative shrink-0">
              <span className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                BESTSELLER
              </span>
              {item.image ? (
                <OptimizedImage
                  alt={item.name}
                  src={item.image}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-900" />
              )}
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-6 flex flex-col justify-center flex-1">
              <h4 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                {item.name}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                {item.description}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-primary font-black text-xl">
                    {formatSellerPrice(item.salePrice ?? item.price)}
                  </span>
                  {item.salePrice && item.salePrice !== item.price && (
                    <span className="text-sm text-slate-500 line-through">
                      {formatSellerPrice(item.price)}
                    </span>
                  )}
                </div>
                <Link
                  href={`/products/${item.slug}`}
                  className="flex items-center justify-center gap-2 text-sm font-bold border border-primary bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all"
                >
                  Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
