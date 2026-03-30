"use client";

import { useEffect, useState } from "react";
import { OptimizedImage } from "@/components/optimized-image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";

type VariantDTO = {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  isDefault: boolean;
};

type ProductDTO = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  salePrice?: number | null;
  description?: string | null;
  image?: string | null;
  variantId?: string;
  variantName?: string;
  variants?: VariantDTO[];
};

export function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductDTO[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const { addItem, items } = useCart();

  // Get the currently selected variant for a product
  const getSelectedVariant = (product: ProductDTO): VariantDTO | null => {
    const variantId =
      selectedVariants[product.id] ||
      product.variants?.find((v) => v.isDefault)?.id;
    return product.variants?.find((v) => v.id === variantId) || null;
  };

  // Get display price based on selected variant
  const getDisplayPrice = (product: ProductDTO) => {
    const variant = getSelectedVariant(product);
    if (!variant) return { price: 0, salePrice: null };
    return {
      price: variant.price,
      salePrice: variant.salePrice,
    };
  };

  const addProductToCart = (product: ProductDTO) => {
    const variant = getSelectedVariant(product);
    if (!variant) return;

    addItem({
      id: product.slug,
      variantId: variant.id,
      variantName: variant.name,
      name: product.name,
      price: (variant.salePrice ?? variant.price) / 100,
      image: product.image || "/placeholder-image.jpg",
    });
  };

  const handleAddToCart = (e: React.MouseEvent, product: ProductDTO) => {
    e.preventDefault();
    e.stopPropagation();
    addProductToCart(product);
  };

  const handleBuyNow = (e: React.MouseEvent, product: ProductDTO) => {
    e.preventDefault();
    e.stopPropagation();

    const variant = getSelectedVariant(product);
    if (!variant) return;

    const alreadyInCart = items.some(
      (item) => item.id === product.slug && item.variantId === variant.id,
    );

    if (!alreadyInCart) {
      addProductToCart(product);
    }

    window.location.assign("/checkout");
  };

  useEffect(() => {
    let mounted = true;
    fetch("/api/products/featured")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setFeaturedProducts(data?.data ?? []);
      })
      .catch(() => setFeaturedProducts([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-24 max-w-7xl mx-auto px-4">
      <div className="flex flex-col items-start gap-4 mb-12 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">
            Featured Parts
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Popular accessories for your vehicle
          </p>
        </div>
        <Link
          href="/products"
          className="text-primary font-bold flex items-center gap-1 hover:underline"
        >
          View All{" "}
          <span className="material-symbols-outlined">chevron_right</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
              >
                <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded mb-4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))
          : featuredProducts.map((product, idx) => {
              const displayPrice = getDisplayPrice(product);
              const selectedVariant = getSelectedVariant(product);
              const hasMultipleVariants = (product.variants?.length || 0) > 1;

              return (
                <div
                  key={product.slug || idx}
                  className="group bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700 overflow-hidden relative flex flex-col"
                >
                  <span className="absolute top-6 left-6 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">
                    FEATURED
                  </span>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-slate-50 dark:bg-slate-900">
                    {product.image ? (
                      <OptimizedImage
                        alt={product.name}
                        src={product.image}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-900" />
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3">
                    {product.name}
                  </h4>

                  {/* Variant Selector */}
                  {hasMultipleVariants && (
                    <div className="mb-3">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                        Select Option
                      </label>
                      <select
                        value={
                          selectedVariants[product.id] ||
                          selectedVariant?.id ||
                          ""
                        }
                        onChange={(e) => {
                          setSelectedVariants({
                            ...selectedVariants,
                            [product.id]: e.target.value,
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {product.variants?.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Price Display */}
                  <div className="mb-3 grow">
                    {typeof displayPrice.price === "number" ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-primary font-black text-lg">
                          Rs.{" "}
                          {(
                            (displayPrice.salePrice ?? displayPrice.price) / 100
                          ).toLocaleString("en-PK")}
                        </span>
                        {displayPrice.salePrice &&
                          displayPrice.salePrice !== displayPrice.price && (
                            <span className="text-sm text-slate-500 line-through">
                              Rs.{" "}
                              {(displayPrice.price / 100).toLocaleString(
                                "en-PK",
                              )}
                            </span>
                          )}
                      </div>
                    ) : (
                      <span className="text-primary font-black text-lg">
                        Rs. {(displayPrice.price / 100).toLocaleString("en-PK")}
                      </span>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col gap-2 sm:flex-row mt-auto">
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      data-testid="featured-add-to-cart"
                      className="w-full bg-primary text-white py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-lg">
                        add_shopping_cart
                      </span>
                      Add to Cart
                    </button>
                    <button
                      onClick={(e) => handleBuyNow(e, product)}
                      data-testid="featured-buy-now"
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">
                        flash_on
                      </span>
                      Buy Now
                    </button>
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
}
