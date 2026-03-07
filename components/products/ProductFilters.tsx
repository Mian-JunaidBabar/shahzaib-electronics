"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge as UIBadge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Badge = { id: string; name: string; usageCount?: number };

export function ProductFilters() {
  const [categories, setCategories] = useState<string[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [topTags, setTopTags] = useState<Badge[]>([]);
  const [topCategories, setTopCategories] = useState<string[]>([]);

  // Local state for inputs (before debouncing)
  const [minPriceInput, setMinPriceInput] = useState<string>("");
  const [maxPriceInput, setMaxPriceInput] = useState<string>("");

  // Debounced values for URL updates
  const debouncedMinPrice = useDebounce(minPriceInput, 500);
  const debouncedMaxPrice = useDebounce(maxPriceInput, 500);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const suppressDebouncedPushRef = useRef<boolean>(false);

  // Fetch initial data
  useEffect(() => {
    // Fetch categories
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // API returns { id, name, slug, ... } objects or plain strings
          setCategories(
            data.map((c: string | { name: string }) =>
              typeof c === "string" ? c : c.name,
            ),
          );
        } else {
          setCategories([]);
        }
      })
      .catch(() => setCategories([]));

    // Fetch all badges/tags
    fetch("/api/admin/badges")
      .then((r) => r.json())
      .then((data) => setBadges(Array.isArray(data) ? data : []))
      .catch(() => setBadges([]));

    // Fetch top 3 tags
    fetch("/api/admin/top-tags")
      .then((r) => r.json())
      .then((data) => setTopTags(Array.isArray(data) ? data : []))
      .catch(() => setTopTags([]));

    // Fetch top selling categories
    fetch("/api/admin/top-categories")
      .then((r) => r.json())
      .then((data) => setTopCategories(Array.isArray(data) ? data : []))
      .catch(() => setTopCategories([]));
  }, []);

  // Sync local state with URL params
  useEffect(() => {
    const categoryParam = searchParams.get("categories");
    const tagsParam = searchParams.get("tags");
    const minParam = searchParams.get("min");
    const maxParam = searchParams.get("max");
    const favParam = searchParams.get("favorites");

    // Defer state updates to avoid synchronous setState warnings and cascading renders
    const t = setTimeout(() => {
      const nextCategories = categoryParam
        ? categoryParam
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
        : [];
      const nextTags = tagsParam
        ? tagsParam
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      setSelectedCategories(nextCategories);
      setSelectedTags(nextTags);
      setFavoritesOnly(!!favParam);
      setMinPriceInput(minParam || "");
      setMaxPriceInput(maxParam || "");
    }, 0);

    return () => clearTimeout(t);
  }, [searchParams]);

  // Update URL when debounced price values change
  useEffect(() => {
    // If we're suppressing debounced pushes (e.g., right after Reset), do nothing
    if (suppressDebouncedPushRef.current) return;
    const params = new URLSearchParams(Array.from(searchParams.entries()));

    if (debouncedMinPrice) {
      params.set("min", debouncedMinPrice);
    } else {
      params.delete("min");
    }

    if (debouncedMaxPrice) {
      params.set("max", debouncedMaxPrice);
    } else {
      params.delete("max");
    }

    // Only push if values actually changed
    const currentMin = searchParams.get("min");
    const currentMax = searchParams.get("max");

    if (
      currentMin !== (debouncedMinPrice || null) ||
      currentMax !== (debouncedMaxPrice || null)
    ) {
      params.delete("page"); // Reset to page 1 on price change
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [debouncedMinPrice, debouncedMaxPrice, pathname, router, searchParams]);

  const resetFilters = () => {
    // Remove known filter params but keep others (like sort)
    // Prevent the debounced effect from re-adding params while we reset
    suppressDebouncedPushRef.current = true;
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    [
      "categories",
      "category",
      "tags",
      "q",
      "search",
      "min",
      "max",
      "favorites",
      "minPrice",
      "maxPrice",
    ].forEach((k) => params.delete(k));

    // Update router and local state
    router.push(
      `${pathname}${params.toString() ? `?${params.toString()}` : ""}`,
      { scroll: false },
    );
    setSelectedCategories([]);
    setSelectedTags([]);
    setMinPriceInput("");
    setMaxPriceInput("");

    // Release suppression after debounce window to allow normal behavior
    setTimeout(() => {
      suppressDebouncedPushRef.current = false;
    }, 600);
  };

  const toggleFavorites = (next?: boolean) => {
    const enabled = typeof next === "boolean" ? next : !favoritesOnly;
    setFavoritesOnly(enabled);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (enabled) params.set("favorites", "1");
    else params.delete("favorites");
    params.delete("page"); // Reset to page 1
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const updateArrayParam = (key: string, values: string[]) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (values.length) {
      params.set(key, values.join(","));
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(next);
    updateArrayParam("categories", next);
    setMobileOpen(false);
  };

  const toggleTag = (tagId: string) => {
    const next = selectedTags.includes(tagId)
      ? selectedTags.filter((t) => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(next);
    updateArrayParam("tags", next);
    setMobileOpen(false);
  };

  // Get regular tags (excluding top 3)
  const regularTags = badges.filter(
    (badge) => !topTags.some((topTag) => topTag.id === badge.id),
  );

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedTags.length > 0 ||
    minPriceInput ||
    maxPriceInput ||
    favoritesOnly;

  // Filter content (JSX element) to reuse in desktop and mobile render
  const filterContent = (
    <div className="space-y-8">
      {/* All Categories */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
          All Categories
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.length > 0 ? (
            <>
              <button
                key="favorites-chip"
                onClick={() => toggleFavorites()}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-200 cursor-pointer hover:shadow-md ${
                  favoritesOnly
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary/50"
                }`}
              >
                ❤️ Favorites
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-200 cursor-pointer hover:shadow-md ${
                    selectedCategories.includes(cat)
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </>
          ) : (
            <div className="text-sm text-slate-500">No categories</div>
          )}
        </div>
      </div>

      {/* Top Selling Categories */}
      {topCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
            🔥 Top Categories
          </h3>
          <div className="space-y-2">
            {topCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer ${
                  selectedCategories.includes(cat)
                    ? "bg-primary/10 text-primary dark:text-primary font-semibold border border-primary/30"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range (Debounced) */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
          Price Range
        </h3>
        <div className="flex gap-2">
          <input
            inputMode="decimal"
            pattern="[0-9]*"
            aria-label="Minimum price"
            min={0}
            step="0.01"
            type="text"
            placeholder="Min"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            className="w-1/2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <input
            inputMode="decimal"
            pattern="[0-9]*"
            aria-label="Maximum price"
            min={0}
            step="0.01"
            type="text"
            placeholder="Max"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            className="w-1/2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={resetFilters}
            className="ml-auto text-sm px-3 py-1.5 border rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* Top 3 Tags */}
      {topTags.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
            ⭐ Top 3 Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {topTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-200 flex items-center gap-2 cursor-pointer hover:shadow-md ${
                  selectedTags.includes(tag.id)
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-linear-to-r from-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 border-yellow-300 dark:border-yellow-700 text-slate-700 dark:text-slate-300 hover:border-primary/50"
                }`}
              >
                <span className="font-semibold">{tag.name}</span>
                <span className="text-xs opacity-80 bg-white/30 dark:bg-black/30 px-1.5 py-0.5 rounded">
                  {tag.usageCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Tags */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
          All Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {regularTags.length > 0 ? (
            regularTags.map((badge) => (
              <button
                key={badge.id}
                onClick={() => toggleTag(badge.id)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-200 flex items-center gap-2 cursor-pointer hover:shadow-md ${
                  selectedTags.includes(badge.id)
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary/50"
                }`}
              >
                <span>{badge.name}</span>
                {badge.usageCount !== undefined && (
                  <span className="text-xs opacity-70">{badge.usageCount}</span>
                )}
              </button>
            ))
          ) : (
            <div className="text-sm text-slate-500">No tags available</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <div className="sticky top-28 h-[calc(100vh-100px)] overflow-y-auto pr-2 custom-scrollbar">
          {filterContent}
        </div>
      </div>

      {/* Mobile Filter Button & Sheet */}
      <div className="lg:hidden mb-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <UIBadge variant="secondary" className="ml-1">
                  Active
                </UIBadge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Product Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
