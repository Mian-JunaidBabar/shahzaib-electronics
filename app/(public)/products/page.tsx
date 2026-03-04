import { ProductGridWithLoadMore } from "@/components/products/ProductGridWithLoadMore";
import { getStoreProductsWithCount } from "@/lib/services/product.service";
import ProductGridClient from "@/components/products/ProductGridClient";
import { ProductFilters } from "@/components/products/ProductFilters";
import { SortDropdown } from "@/components/products/SortDropdown";
import ProductSearch from "@/components/products/ProductSearch";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shop Premium Car Accessories",
};

export const revalidate = 60; // Revalidate every 60 seconds

type SearchParams = {
  categories?: string;
  tags?: string;
  q?: string;
  min?: string;
  max?: string;
  favorites?: string;
  sort?: string;
};

// Loading skeleton for products grid
function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm animate-pulse"
        >
          <div className="aspect-square bg-slate-200 dark:bg-slate-700" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Products grid component
async function ProductsGrid({ searchParams }: { searchParams: SearchParams }) {
  const { categories, tags, q, min, max, sort } = searchParams;
  const favoritesFlag = (searchParams as SearchParams & { favorites?: string })
    .favorites;

  // Parse filter parameters
  const parsedFilters = {
    q: q || undefined,
    categories: categories
      ? categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : undefined,
    tags: tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined,
    min: min ? Number(min) : undefined,
    max: max ? Number(max) : undefined,
    sort: sort || undefined,
  };

  // Fetch products along with the total count
  const { products, count: totalCount } = await getStoreProductsWithCount({
    ...parsedFilters,
    limit: 12,
    offset: 0,
  });

  // Map to ProductCardProps structure
  const mappedProducts = products.map((product) => {
    // Prisma price is in cents. Converting to dollars.
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
      image: product.images[0]?.secureUrl || "/placeholder-image.jpg",
      rating: 5,
      reviews: 0,
      badge: badgeType,
      badgeText: badgeText || undefined,
      category: product.category || undefined,
    };
  });

  return (
    <>
      {/* Results count */}
      <div className="mb-6">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {mappedProducts.length > 0 ? (
            <>
              Showing{" "}
              <span className="font-semibold">{mappedProducts.length}</span>
              {totalCount > mappedProducts.length && (
                <>
                  {" "}
                  of <span className="font-semibold">{totalCount}</span>
                </>
              )}{" "}
              {totalCount === 1 ? "product" : "products"}
              {(q || categories || tags || min || max) && (
                <span className="ml-1 text-slate-500">with active filters</span>
              )}
            </>
          ) : (
            "No products found"
          )}
        </p>
      </div>

      {/* Product Grid - render client favorites grid when favorites flag present */}
      {favoritesFlag ? (
        <ProductGridClient products={mappedProducts} favoritesOnly={true} />
      ) : (
        <ProductGridWithLoadMore
          initialProducts={mappedProducts}
          initialLimit={12}
          filters={parsedFilters}
          totalCount={totalCount}
        />
      )}
    </>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  // `searchParams` can be a Promise in Next.js dynamic routes; unwrap it.
  searchParams: SearchParams | Promise<SearchParams>;
}) {
  const sp = await searchParams;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
      {/* Page Header */}
      <div className="bg-slate-900 py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary via-slate-900 to-slate-900"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Premium Accessories
          </h1>
          <nav className="flex items-center justify-center gap-2 text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="material-symbols-outlined text-[16px]">
              chevron_right
            </span>
            <span className="text-slate-200 font-bold">Shop All</span>
          </nav>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Filters */}
        <div className="lg:col-span-1">
          <ProductFilters />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Top Bar - Search & Sorting */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                All Products
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <ProductSearch />
              <SortDropdown currentSort={sp.sort} />
            </div>
          </div>

          {/* Products Grid with Suspense */}
          <Suspense
            key={JSON.stringify(sp)}
            fallback={<ProductsGridSkeleton />}
          >
            <ProductsGrid searchParams={sp} />
          </Suspense>
        </div>
      </main>

      {/* Trust Banner */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-16 border-y border-slate-200 dark:border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-center text-sm font-bold uppercase tracking-widest text-slate-500 mb-10">
            The Shahzaib Autos Promise
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center group">
              <div className="size-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                <span className="material-symbols-outlined text-3xl text-primary">
                  local_shipping
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                Free Shipping
              </h4>
              <p className="text-xs text-slate-500">
                On all orders over PKR 5000
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="size-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                <span className="material-symbols-outlined text-3xl text-primary">
                  verified
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                Genuine Parts
              </h4>
              <p className="text-xs text-slate-500">100% Original Guaranteed</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="size-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                <span className="material-symbols-outlined text-3xl text-primary">
                  support_agent
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                24/7 Support
              </h4>
              <p className="text-xs text-slate-500">Expert help anytime</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="size-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                <span className="material-symbols-outlined text-3xl text-primary">
                  assignment_return
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                Money-back
              </h4>
              <p className="text-xs text-slate-500">
                30-day hassle-free returns
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
