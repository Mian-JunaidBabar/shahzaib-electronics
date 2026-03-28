"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCart } from "@/context/cart-context";
import type { StorefrontProduct } from "@/lib/services/storefront.service";

type Props = {
  product: StorefrontProduct;
};

function formatPrice(cents: number): string {
  return `Rs. ${(cents / 100).toLocaleString("en-PK")}`;
}

export function ProductCard({ product }: Props) {
  const { addToCart, items } = useCart();

  // Get default variant (or fallback to first variant)
  const defaultVariant =
    product.variants.find((v) => v.isDefault) || product.variants[0];
  if (!defaultVariant) {
    return null; // No variant available
  }

  const primaryImage = product.images[0]?.secureUrl ?? "/placeholder.jpg";
  const categoryName = product.categoryRelation?.name || "Uncategorized";
  const productBadges =
    product.productBadges?.map((pb) => pb.badge).filter(Boolean) || [];

  const hasDiscount =
    defaultVariant.salePrice !== null &&
    defaultVariant.salePrice < defaultVariant.price;
  const displayPrice = defaultVariant.salePrice ?? defaultVariant.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((defaultVariant.price - defaultVariant.salePrice!) /
          defaultVariant.price) *
          100,
      )
    : 0;

  const isInStock = defaultVariant.inventoryQty > 0;
  const isInCart =
    items?.some((item) => item.variantId === defaultVariant.id) ?? false;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      variantId: defaultVariant.id,
      variantName: defaultVariant.name,
      name: product.name,
      price: (defaultVariant.salePrice ?? defaultVariant.price) / 100, // Convert cents to rupees for cart
      image: primaryImage,
      quantity: 1,
    });
  };

  return (
    <Card className="group overflow-hidden flex flex-col h-full rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      {/* Image Container */}
      <div className="relative aspect-4/3 overflow-hidden rounded-t-xl bg-slate-100 dark:bg-slate-800">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 max-w-[85%]">
          {productBadges.map((badge) => (
            <Badge
              key={badge.id}
              style={{ backgroundColor: badge.color }}
              className="text-white text-[10px] px-2 py-0.5 h-5 font-semibold"
            >
              {badge.name}
            </Badge>
          ))}
          {hasDiscount && (
            <Badge
              variant="destructive"
              className="text-[10px] px-2 py-0.5 h-5"
            >
              -{discountPercent}%
            </Badge>
          )}
        </div>

        {/* Quick View Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/products/${product.slug}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>
        </div>

        {/* Out of Stock Overlay */}
        {!isInStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Badge variant="secondary" className="text-base px-4 py-1">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="flex-1 p-5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 mb-2 font-medium">
          {categoryName}
        </p>

        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {defaultVariant.name &&
          defaultVariant.name.toLowerCase() !== "default" && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-[11px] font-medium">
                {defaultVariant.name}
              </Badge>
            </div>
          )}

        <div className="mt-4 flex items-end gap-2">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatPrice(displayPrice)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-slate-500 line-through mb-0.5">
              {formatPrice(defaultVariant.price)}
            </span>
          )}
        </div>

        <p
          className={`mt-2 text-xs font-medium ${isInStock ? "text-emerald-600" : "text-red-600"}`}
        >
          {isInStock ? "In Stock" : "Out of Stock"}
        </p>

        {product.variants && product.variants.length > 1 && (
          <p className="text-[11px] text-slate-500 mt-1">
            +{product.variants.length - 1} more option
            {product.variants.length !== 2 ? "s" : ""}
          </p>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-5 pt-0 flex gap-2">
        <Button
          size="lg"
          variant={isInCart ? "default" : "outline"}
          onClick={handleAddToCart}
          data-testid="related-add-to-cart"
          disabled={!isInStock || isInCart}
          className="w-full"
        >
          {isInCart ? (
            <>✓ In Cart</>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              <span className="ml-2">Add to Cart</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
