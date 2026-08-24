import {
  getStoreProductsPaginated,
  getRecentlyUpdatedProducts,
  StoreProduct,
} from "@/lib/services/product.service";
import ProductGridClient from "@/components/products/ProductGridClient";
import { ServiceMarquee } from "@/components/products/ServiceMarquee";
import { ProductFilters } from "@/components/products/ProductFilters";
import { getActiveCategories } from "@/lib/services/category.service";
import { SortDropdown } from "@/components/products/SortDropdown";
import { CategoryGrid } from "@/components/products/CategoryGrid";
import ProductSearch from "@/components/products/ProductSearch";
import { ProductCard } from "@/components/products/ProductCard";
import { Pagination } from "@/components/store/pagination";
import {
  ampVsSubwooferFaq,
  universalVsVehicleSpecificFaq,
  directImporterFaq,
} from "@/lib/content/faq-content";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

// Categories dealing in amplifiers/subwoofers/speakers get the amp-vs-sub
// education answer; Android panel/multimedia categories (which carry both
// universal and vehicle-specific units) get the fitment-distinction
// answer; everything else falls back to the direct-importer answer, since
// it already explains our universal vs. vehicle-specific catalog split.
const AUDIO_CATEGORY_PATTERN = /amplifier|subwoofer|speaker|audio/i;
const PANEL_CATEGORY_PATTERN = /android|panel|multimedia|screen|stereo/i;

function getCategoryFaqAnswer(categoryName: string): string {
  if (AUDIO_CATEGORY_PATTERN.test(categoryName)) {
    return `Shahzaib Electronics is a direct importer and wholesale distributor in Lahore for ${categoryName} accessories. ${ampVsSubwooferFaq.answer}`;
  }
  if (PANEL_CATEGORY_PATTERN.test(categoryName)) {
    return `Shahzaib Electronics is a direct importer and wholesale distributor in Lahore for ${categoryName} accessories. ${universalVsVehicleSpecificFaq.answer}`;
  }
  return `For ${categoryName} accessories: ${directImporterFaq.answer}`;
}

export const metadata: Metadata = {
  title: "Shop Premium Car Accessories",
  description:
    "Browse premium car accessories, Android panels, and audio upgrades with importer pricing from Shahzaib Electronics.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Shop Premium Car Accessories",
    description:
      "Browse premium car accessories, Android panels, and audio upgrades with importer pricing from Shahzaib Electronics.",
    url: "/products",
    type: "website",
  },
};

type SearchParams = {
  categories?: string;
  tags?: string;
  q?: string;
  min?: string;
  max?: string;
  favorites?: string;
  sort?: string;
  page?: string;
};

// Loading skeleton for products grid
function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

// Map a raw product to ProductCard props
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

  const relationalBadge =
    (
      product as StoreProduct & {
        productBadges?: { badge: { name: string } }[];
        badges?: { name: string }[];
      }
    ).productBadges?.[0]?.badge ||
    (product as StoreProduct & { badges?: { name: string }[] }).badges?.[0];

  if (relationalBadge) {
    badgeText = relationalBadge.name;
    if (badgeText.toUpperCase().includes("NEW")) badgeType = "NEW";
    else if (badgeText.toUpperCase().includes("SALE")) badgeType = "SALE";
  } else if (product.badge) {
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
    category: product.categoryRelation?.name || product.category || undefined,
  };
}

// Products grid component — server-rendered with pagination
async function ProductsGrid({ searchParams }: { searchParams: SearchParams }) {
  const { categories, tags, q, min, max, sort, page: pageStr } = searchParams;
  const favoritesFlag = searchParams.favorites;

  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);

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

  // Fetch paginated products (cached with tag: products:all)
  const { products, metadata } = await getStoreProductsPaginated({
    ...parsedFilters,
    page,
  });

  // Map to ProductCardProps
  const mappedProducts = products
    .map(mapProductToCard)
    .filter(Boolean) as React.ComponentProps<typeof ProductCard>[];

  // Calculate range for display
  const rangeStart = (metadata.page - 1) * metadata.limit + 1;
  const rangeEnd = Math.min(metadata.page * metadata.limit, metadata.total);

  return (
    <>
      {/* Results count */}
      <div className="mb-6">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {mappedProducts.length > 0 ? (
            <>
              Showing{" "}
              <span className="font-semibold">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              of <span className="font-semibold">{metadata.total}</span>{" "}
              {metadata.total === 1 ? "product" : "products"}
              {(q || categories || tags || min || max) && (
                <span className="ml-1 text-slate-500">with active filters</span>
              )}
            </>
          ) : (
            "No products found"
          )}
        </p>
      </div>

      {/* Product Grid */}
      {favoritesFlag ? (
        <ProductGridClient products={mappedProducts} favoritesOnly={true} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mappedProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!favoritesFlag && metadata.totalPages > 1 && (
        <Pagination
          currentPage={metadata.page}
          totalPages={metadata.totalPages}
          total={metadata.total}
        />
      )}
    </>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams | Promise<SearchParams>;
}) {
  const sp = await searchParams;

  // Check if any filter is active in the URL
  const isFiltered = !!(
    sp.q ||
    sp.categories ||
    sp.tags ||
    sp.min ||
    sp.max ||
    sp.page
  );

  const parsedFilters = {
    q: sp.q || undefined,
    categories: sp.categories
      ? sp.categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : undefined,
    tags: sp.tags
      ? sp.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined,
    min: sp.min ? Number(sp.min) : undefined,
    max: sp.max ? Number(sp.max) : undefined,
    sort: sp.sort || undefined,
  };

  const freshArrivals = await getRecentlyUpdatedProducts(parsedFilters);
  const categoriesForFaq = await getActiveCategories();

  const topCategories = categoriesForFaq
    .filter((category) => category._count?.products > 0)
    .sort((a, b) => (b._count?.products || 0) - (a._count?.products || 0))
    .slice(0, 5);

  // Google retired FAQ rich results May 7, 2026, so this is no longer
  // serialized as FAQPage JSON-LD (see below where the schema <script>
  // tags are built) — the visible accordion further down still renders it
  // for AI/answer-engine crawlers.
  const categoryFaqJsonLd = {
    mainEntity: topCategories.map((category) => ({
      "@type": "Question",
      name: `Where can I buy original ${category.name} accessories at wholesale price in Lahore?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: getCategoryFaqAnswer(category.name),
      },
    })),
  };

  const mappedFreshArrivals = freshArrivals
    .map(mapProductToCard)
    .filter(Boolean) as React.ComponentProps<typeof ProductCard>[];

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.shahzaibelectronics.pk";
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${appUrl}/products`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

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

      {/* Only show intro sections when no filters are active */}
      {!isFiltered && (
        <>
          {/* Layer 1: Browse Categories */}
          <section className="max-w-7xl mx-auto w-full px-4 pt-12 pb-8">
            <h2 className="text-2xl font-black uppercase text-red-600 mb-6">
              Browse All Categories
            </h2>
            <div>
              <CategoryGrid filters={parsedFilters} />
            </div>
          </section>

          {/* Layer 2: Fresh Arrivals */}
          <section className="max-w-7xl mx-auto w-full px-4 pt-10 pb-12">
            <h2 className="text-2xl font-black uppercase text-red-600 mb-6">
              Fresh Arrivals &amp; Restocked
            </h2>

            {mappedFreshArrivals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {mappedFreshArrivals.slice(0, 4).map((product) => (
                  <ProductCard key={`fresh-${product.id}`} {...product} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Fresh arrivals will appear here as soon as stock is updated.
              </p>
            )}
          </section>
        </>
      )}

      {/* Layer 4: Services Marquee */}
      <ServiceMarquee />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Filters */}
        <div className="lg:col-span-1">
          <ProductFilters />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Top Bar - Search & Sorting */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
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

      {/* Rendered as real visible text, not just JSON-LD — this FAQPage
          schema previously existed only inside the <script> tag above and
          was never shown to a visitor or crawlable as content. */}
      {!isFiltered && topCategories.length > 0 && (
        <section className="max-w-4xl mx-auto w-full px-4 pb-16">
          <h2 className="text-2xl font-black uppercase text-red-600 mb-6">
            Frequently Asked Questions
          </h2>
          <FaqAccordion
            items={categoryFaqJsonLd.mainEntity.map((faq) => ({
              question: faq.name,
              answer: faq.acceptedAnswer.text,
            }))}
          />
        </section>
      )}
    </div>
  );
}
