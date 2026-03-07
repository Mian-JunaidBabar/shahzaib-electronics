import {
  getStoreProductsPaginated,
  StoreProduct,
} from "@/lib/services/product.service";
import { ProductFilters } from "@/components/products/ProductFilters";
import { getCategoryBySlug } from "@/lib/services/category.service";
import { SortDropdown } from "@/components/products/SortDropdown";
import ProductSearch from "@/components/products/ProductSearch";
import { ProductCard } from "@/components/products/ProductCard";
import { Pagination } from "@/components/store/pagination";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    page?: string;
    q?: string;
  }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: "Category Not Found" };

  return {
    title: `${category.name} — Shahzaib Autos`,
    description:
      category.description ||
      `Browse ${category.name} products at Shahzaib Autos`,
  };
}

// Map a raw product to ProductCard props (same as main products page)
function mapProductToCard(product: StoreProduct) {
  const defaultVariant =
    product.variants?.find((v) => v.isDefault) || product.variants?.[0];

  if (!defaultVariant) return null;

  const currentPrice = (defaultVariant.salePrice || defaultVariant.price) / 100;
  const originalPrice = defaultVariant.salePrice
    ? defaultVariant.price / 100
    : undefined;

  let badgeType: "NEW" | "SALE" | undefined = undefined;
  let badgeText = "";

  if (product.badge) {
    badgeText = product.badge.name;
    if (badgeText.toUpperCase().includes("NEW")) badgeType = "NEW";
    else if (badgeText.toUpperCase().includes("SALE")) badgeType = "SALE";
  } else if (defaultVariant.salePrice) {
    badgeType = "SALE";
    badgeText = `-${Math.round((1 - defaultVariant.salePrice / defaultVariant.price) * 100)}%`;
  }

  return {
    id: product.slug,
    title: product.name,
    price: currentPrice,
    originalPrice,
    image: product.images[0]?.secureUrl || "/placeholder-image.jpg",
    variantId: defaultVariant.id,
    variantName: defaultVariant.name,
    variantsCount: product.variants.length,
    rating: 5,
    reviews: 0,
    badge: badgeType,
    badgeText: badgeText || undefined,
    category: product.category || undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category || !category.isActive) notFound();

  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  const { products, metadata } = await getStoreProductsPaginated({
    categorySlug: slug,
    q: sp.q || undefined,
    sort: sp.sort || undefined,
    page,
  });

  const mappedProducts = products
    .map(mapProductToCard)
    .filter(Boolean) as React.ComponentProps<typeof ProductCard>[];

  const rangeStart = (metadata.page - 1) * metadata.limit + 1;
  const rangeEnd = Math.min(metadata.page * metadata.limit, metadata.total);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
      {/* Category Header */}
      <div className="bg-slate-900 py-16 px-4 relative overflow-hidden">
        {category.imageUrl && (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover opacity-20"
            priority
          />
        )}
        <div className="absolute inset-0 opacity-30 bg-linear-to-b from-red-600/40 via-slate-900 to-slate-900"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-slate-300 max-w-2xl mx-auto mb-4">
              {category.description}
            </p>
          )}
          <nav className="flex items-center justify-center gap-2 text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="material-symbols-outlined text-[16px]">
              chevron_right
            </span>
            <Link
              href="/products"
              className="hover:text-white transition-colors"
            >
              Shop
            </Link>
            <span className="material-symbols-outlined text-[16px]">
              chevron_right
            </span>
            <span className="text-slate-200 font-bold">{category.name}</span>
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
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {category.name}
              </h2>
              <span className="text-sm text-slate-500">
                {metadata.total} {metadata.total === 1 ? "product" : "products"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <ProductSearch />
              <SortDropdown currentSort={sp.sort} />
            </div>
          </div>

          {/* Results */}
          {mappedProducts.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Showing{" "}
                  <span className="font-semibold">
                    {rangeStart}–{rangeEnd}
                  </span>{" "}
                  of <span className="font-semibold">{metadata.total}</span>{" "}
                  products
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mappedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {metadata.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={metadata.page}
                    totalPages={metadata.totalPages}
                    total={metadata.total}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">
                inventory_2
              </span>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                No Products Found
              </h3>
              <p className="text-slate-500 mb-6">
                No products in this category yet. Check back soon!
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">
                  arrow_back
                </span>
                Browse All Products
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
