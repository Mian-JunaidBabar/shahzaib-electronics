import { getActiveCategories } from "@/lib/services/category.service";
import Image from "next/image";
import Link from "next/link";

/**
 * CategoryGrid — Server Component
 *
 * Displays active categories as a visual grid on the public /products page.
 * Red & White theme matching Shahzaib Autos brand.
 */
export async function CategoryGrid() {
  const categories = await getActiveCategories();

  // Only show categories that have products
  const withProducts = categories.filter((c) => c._count.products > 0);

  if (withProducts.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
          Shop by Category
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Browse our curated collection of premium car accessories
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {withProducts.map((cat) => (
          <Link
            key={cat.id}
            href={`/products/category/${cat.slug}`}
            className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg hover:border-red-500/50 transition-all duration-300"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-700 overflow-hidden">
              {cat.imageUrl ? (
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-500">
                    category
                  </span>
                </div>
              )}
              {/* Red gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-red-600/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Label */}
            <div className="p-3 text-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {cat._count.products}{" "}
                {cat._count.products === 1 ? "product" : "products"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
