"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface InventoryFiltersProps {
  categories: string[];
}

export function InventoryFilters({ categories }: InventoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "ALL";
  const currentSort = searchParams.get("sort") || "newest";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value !== "ALL" && value !== "newest") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Always reset to first page when filtering/sorting
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    // We only clear category and sort, preserving 'q' and 'status' if we want them separate,
    // or we can clear all. A "Clear Filters" usually clears sort/category.
    // If the requirement is to clear only these, we do:
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("sort");
    // Also reset page
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters =
    currentCategory !== "ALL" || currentSort !== "newest";

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select
        value={currentCategory}
        onValueChange={(val) => handleFilterChange("category", val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentSort}
        onValueChange={(val) => handleFilterChange("sort", val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="name_asc">Name (A-Z)</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
}
