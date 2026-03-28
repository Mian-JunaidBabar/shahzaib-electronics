"use client";

import Link from "next/link";
import { OptimizedImage } from "@/components/optimized-image";
import { useCart } from "@/context/cart-context";

import { useEffect, useState } from "react";

type ProductCardProps = {
  id: string; // Used as slug for URL
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  variantId?: string;
  variantName?: string;
  variantsCount?: number;
  rating: number;
  reviews: number;
  badge?: "NEW" | "SALE" | null;
  badgeText?: string;
  category?: string;
};

export function ProductCard({
  id,
  title,
  price,
  originalPrice,
  image,
  variantId,
  variantName,
  variantsCount,
  badge,
  badgeText,
  category,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [isFav, setIsFav] = useState(() => {
    try {
      const raw = localStorage.getItem("favorites");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      return arr.includes(id);
    } catch {
      return false;
    }
  });

  // Update when id changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem("favorites");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      if (arr.includes(id) !== isFav) {
        setIsFav(arr.includes(id));
      }
    } catch {
      // Ignore errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id,
      variantId: variantId || id,
      variantName: variantName || "Default",
      name: title,
      price: price,
      image,
    });
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const raw = localStorage.getItem("favorites");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const next = arr.includes(id)
        ? arr.filter((x) => x !== id)
        : [...arr, id];
      localStorage.setItem("favorites", JSON.stringify(next));
      // update local state and notify other tabs
      setIsFav(next.includes(id));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "favorites",
          newValue: JSON.stringify(next),
        }),
      );
    } catch (err) {
      console.error("favorite toggle error", err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100 dark:border-slate-800 flex flex-col group">
      <Link
        href={`/products/${id}`}
        className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800 block"
      >
        <OptimizedImage
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {badge === "NEW" && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary text-[10px] font-bold text-white rounded-lg uppercase tracking-wider backdrop-blur-md">
            New
          </span>
        )}
        {badge === "SALE" && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-red-500 text-[10px] font-bold text-white rounded-lg uppercase tracking-wider backdrop-blur-md">
            {badgeText || "Sale"}
          </span>
        )}

        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 size-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-200"
          aria-pressed={isFav}
          aria-label={isFav ? "Remove favorite" : "Add favorite"}
        >
          {isFav ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-4 h-4 text-red-500"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-4 h-4 text-slate-900 dark:text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
        </button>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link href={`/products/${id}`}>
          <h3 className="text-sm font-bold line-clamp-2 mb-1 group-hover:text-primary transition-colors text-slate-900 dark:text-white">
            {title}
          </h3>
        </Link>

        {/* Variant Info */}
        <div className="flex flex-col gap-1 mb-3">
          {variantName && variantName.toLowerCase() !== "default" && (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 w-fit px-2 py-0.5 rounded uppercase tracking-wider">
              {variantName}
            </span>
          )}
          {variantsCount && variantsCount > 1 && (
            <span className="text-[10px] text-primary font-bold">
              + {variantsCount - 1} more options
            </span>
          )}
        </div>

        {/* Category and Tag badges */}
        <div className="flex items-center gap-2 mb-3">
          {category && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {category}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <div className="mb-3 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
            <p className="text-lg font-black leading-none whitespace-nowrap text-primary">
              Rs. {price.toLocaleString()}
            </p>
            {originalPrice && (
              <p className="text-xs font-semibold leading-none text-slate-400 line-through sm:leading-normal">
                Rs. {originalPrice.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            data-testid="listing-add-to-cart"
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-primary dark:hover:bg-black text-slate-900 dark:text-white hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn"
          >
            <span className="material-symbols-outlined text-[18px] group-hover/btn:scale-110 transition-transform">
              add_shopping_cart
            </span>{" "}
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
