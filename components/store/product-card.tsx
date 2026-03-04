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

  // Get default variant (first variant)
  const defaultVariant = product.variants[0];
  if (!defaultVariant) {
    return null; // No variant available
  }

  const primaryImage = product.images[0]?.secureUrl ?? "/placeholder.jpg";
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
    items?.some((item) => item.id === defaultVariant.id) ?? false;

  const handleAddToCart = () => {
    addToCart({
      id: defaultVariant.id, // Use variant ID
      name: product.name,
      price: displayPrice / 100, // Convert cents to rupees for cart
      image: primaryImage,
      quantity: 1,
    });
  };

  return (
    <Card className="group overflow-hidden flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.badge && (
            <Badge
              style={{ backgroundColor: product.badge.color }}
              className="text-white"
            >
              {product.badge.name}
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="destructive">-{discountPercent}%</Badge>
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
      <CardContent className="flex-1 p-4">
        {product.category && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {product.category}
          </p>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:underline">
            {product.name}
          </h3>
        </Link>
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-bold text-lg">{formatPrice(displayPrice)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(defaultVariant.price)}
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant={isInCart ? "default" : "outline"}
          onClick={handleAddToCart}
          disabled={!isInStock || isInCart}
          className="shrink-0"
        >
          {isInCart ? (
            <>✓ In Cart</>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-2">Add</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
