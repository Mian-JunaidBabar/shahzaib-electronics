"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/whatsapp";
import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  badge?:
    | string
    | {
        id: number;
        name: string;
        color: string;
      };
  badgeColor?: string; // For legacy string badges
  category: string;
  slug: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const isInCart = items.some((item) => item.variantId === String(product.id));

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      variantId: String(product.id), // Legacy: product id used as variant id
      variantName: "Default",
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <Link
        href={`/products/${product.slug}`}
        className="aspect-4/3 w-full overflow-hidden bg-muted relative block"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {product.badge && (
          <div
            className="absolute top-3 right-3 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm"
            style={{
              backgroundColor:
                typeof product.badge === "object"
                  ? product.badge.color
                  : product.badgeColor || "#3B82F6",
            }}
          >
            {typeof product.badge === "object"
              ? product.badge.name
              : product.badge}
          </div>
        )}
      </Link>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-lg text-text-primary group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <span className="font-bold text-text-primary">
            {formatPrice(product.price)}
          </span>
        </div>
        <p className="text-sm text-text-subtle mb-6 line-clamp-2 flex-1">
          {product.description}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <Link
            href={`/products/${product.slug}`}
            className="h-10 rounded-md border border-border bg-transparent hover:bg-muted text-text-muted hover:text-text-primary text-sm font-medium transition-colors flex items-center justify-center"
          >
            View Details
          </Link>
          <button
            onClick={handleAddToCart}
            disabled={justAdded}
            className={`h-10 rounded-md text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
              justAdded
                ? "bg-green-600"
                : isInCart
                  ? "bg-primary hover:opacity-90"
                  : "bg-primary hover:opacity-90"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                {isInCart ? "Add More" : "Add to Cart"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
