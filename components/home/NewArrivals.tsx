"use client";

import { useEffect, useState } from "react";
import { OptimizedImage } from "@/components/optimized-image";
import Link from "next/link";

type ProductDTO = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  description?: string | null;
  image?: string | null;
};

export function NewArrivals() {
  const [latestProducts, setLatestProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/products/latest")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setLatestProducts(data?.data ?? []);
      })
      .catch(() => setLatestProducts([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-24 max-w-7xl mx-auto px-4">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            New Arrivals
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            The latest innovations for your vehicle
          </p>
        </div>
        <Link
          href="/products"
          className="text-primary font-bold flex items-center gap-1 hover:underline"
        >
          View All{" "}
          <span className="material-symbols-outlined">chevron_right</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
              >
                <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded mb-4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))
          : latestProducts.map((product, idx) => (
              <div
                key={product.slug || idx}
                className="group bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700 overflow-hidden relative"
              >
                <span className="absolute top-6 left-6 z-10 bg-primary text-white dark:text-slate-900 text-[10px] font-bold px-2 py-1 rounded">
                  NEW
                </span>
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-slate-50 dark:bg-slate-900">
                  {product.image ? (
                    <OptimizedImage
                      alt={product.name}
                      src={product.image}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-900" />
                  )}
                  <Link
                    href={`/products/${product.slug}`}
                    className="absolute bottom-4 left-4 right-4 bg-primary text-white dark:text-slate-900 py-2 rounded-lg font-bold text-sm translate-y-12 group-hover:translate-y-0 transition-transform flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">
                      add_shopping_cart
                    </span>
                    View Product
                  </Link>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  {product.name}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-primary font-black text-lg">
                    {typeof product.price === "number"
                      ? "PKR " + product.price
                      : product.price}
                  </span>
                  <div className="flex">
                    <span className="text-slate-400 text-xs ml-1 font-bold"></span>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}
