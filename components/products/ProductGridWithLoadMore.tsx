"use client";

import { useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { fetchMoreProductsAction } from "@/app/actions/productActions";

type ProductCardProps = {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  badge?: "NEW" | "SALE";
  badgeText?: string;
  category?: string;
};

type Props = {
  initialProducts: ProductCardProps[];
  initialLimit?: number;
  filters?: any;
};

const PRODUCTS_PER_LOAD = 12;

export function ProductGridWithLoadMore({
  initialProducts,
  initialLimit = 12,
  filters = {},
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialProducts.length >= initialLimit,
  );

  const loadMore = async () => {
    setIsLoading(true);
    try {
      const offset = products.length;
      const result = await fetchMoreProductsAction(offset, {
        ...filters,
        limit: initialLimit,
      });

      if (result.success && result.data) {
        setProducts((prev) => [...prev, ...result.data.map(mapProductToCard)]);

        // Hide button if fewer products came back than requested
        if (result.data.length < initialLimit) {
          setHasMore(false);
        }
      } else {
        console.error("Failed to load more products:", result.error);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to map Prisma payload to ProductCardProps structure
  const mapProductToCard = (product: any): ProductCardProps => {
    const currentPrice = (product.salePrice || product.price) / 100;
    const originalPrice = product.salePrice ? product.price / 100 : undefined;
    let badgeType: "NEW" | "SALE" | undefined = undefined;
    let badgeText = "";

    if (product.badge) {
      badgeText = product.badge.name;
      if (badgeText.toUpperCase().includes("NEW")) badgeType = "NEW";
      else if (badgeText.toUpperCase().includes("SALE")) badgeType = "SALE";
    } else if (product.salePrice) {
      badgeType = "SALE";
      badgeText = `-${Math.round((1 - product.salePrice / product.price) * 100)}%`;
    }

    return {
      id: product.slug,
      title: product.name,
      price: currentPrice,
      originalPrice,
      image: product.images?.[0]?.secureUrl || "/placeholder-image.jpg",
      rating: 5,
      reviews: 0,
      badge: badgeType,
      badgeText: badgeText || undefined,
      category: product.category || undefined,
    };
  };

  if (products.length === 0) {
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
    <div className="space-y-8">
      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            size="lg"
            variant="outline"
            className="min-w-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>Load More Products</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
