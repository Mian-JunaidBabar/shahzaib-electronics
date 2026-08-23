"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";

export type ClientProduct = {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  variantId?: string;
  variantName?: string;
  variantsCount?: number;
  badge?: "NEW" | "SALE" | null;
  badgeText?: string;
  rating?: number;
  reviews?: number;
  category?: string;
};

export default function ProductGridClient({
  products,
  favoritesOnly = false,
}: {
  products: ClientProduct[];
  favoritesOnly?: boolean;
}) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("favorites");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    // Listen for external storage changes

    const onStorage = (e: StorageEvent) => {
      if (e.key === "favorites") {
        try {
          setFavorites(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          setFavorites([]);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const visible = useMemo(() => {
    if (!favoritesOnly) return products;
    const setFav = new Set(favorites);
    return products.filter((p) => setFav.has(p.id));
  }, [products, favoritesOnly, favorites]);

  if (visible.length === 0) {
    return (
      <div className="col-span-full text-center py-20">
        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">
          search_off
        </span>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
          No products found
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {visible.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          rating={product.rating ?? 5}
          reviews={product.reviews ?? 0}
        />
      ))}
    </div>
  );
}
