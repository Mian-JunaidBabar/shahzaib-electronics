"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortDropdown({ currentSort }: { currentSort?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value && value !== "newest") {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    params.delete("page"); // Reset to page 1 on sort change
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <select
      aria-label="Sort products"
      value={currentSort || "newest"}
      onChange={(e) => handleSortChange(e.target.value)}
      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm cursor-pointer focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
    >
      <option value="newest">Newest Arrivals</option>
      <option value="price-low">Price: Low to High</option>
      <option value="price-high">Price: High to Low</option>
    </select>
  );
}
