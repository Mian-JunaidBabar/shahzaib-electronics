"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";

type Product = {
  id: string; // variant ID
  variantId: string;
  variantName: string;
  name: string;
  price: number;
  image: string;
};

type Props = {
  product: Product;
  disabled?: boolean;
};

export function AddToCartButton({ product, disabled = false }: Props) {
  const { addToCart, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const isInCart =
    items?.some((item) => item.variantId === product.variantId) ?? false;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      variantId: product.variantId,
      variantName: product.variantName,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <Button
      size="lg"
      className={`flex-1 min-h-14 py-3 text-base gap-2 ${
        justAdded ? "bg-green-600 hover:bg-green-600" : ""
      }`}
      onClick={handleAddToCart}
      disabled={disabled || justAdded || isInCart}
    >
      {isInCart ? (
        <>
          <Check className="h-5 w-5" />
          Already in Cart
        </>
      ) : justAdded ? (
        <>
          <Check className="h-5 w-5" />
          Added to Cart!
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
