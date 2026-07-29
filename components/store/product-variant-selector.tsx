"use client";

import { useState } from "react";
import { ShoppingCart, Check, Package, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { generateWhatsAppUrl } from "@/lib/whatsapp";
import { sendGAEvent } from "@next/third-parties/google";

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice: number | null;
  inventoryQty: number;
  isDefault: boolean;
}

interface Props {
  product: {
    id: string;
    name: string;
  };
  variants: Variant[];
  primaryImage: string;
}

function formatPrice(cents: number): string {
  return `Rs. ${(cents / 100).toLocaleString("en-PK")}`;
}

export function ProductVariantSelector({
  product,
  variants,
  primaryImage,
}: Props) {
  const { addToCart, items } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(
    variants.find((v) => v.isDefault) || variants[0] || null,
  );
  const [justAdded, setJustAdded] = useState(false);

  if (!selectedVariant) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600 font-medium">Out of Stock</p>
        <Button size="lg" className="w-full sm:w-auto" disabled>
          <ShoppingCart className="h-5 w-5" />
          Add to Cart
        </Button>
      </div>
    );
  }

  // Hide the picker if there's only one variant named "Default"
  const showPicker = !(variants.length === 1 && variants[0].name === "Default");

  const isInCart =
    items?.some((item) => item.variantId === selectedVariant.id) ?? false;

  const hasDiscount =
    selectedVariant.salePrice !== null &&
    selectedVariant.salePrice !== undefined &&
    selectedVariant.salePrice < selectedVariant.price;

  const displayPrice = selectedVariant.salePrice ?? selectedVariant.price;
  const discountPercent = hasDiscount
    ? Math.round(
      ((selectedVariant.price - selectedVariant.salePrice!) /
        selectedVariant.price) *
      100,
    )
    : 0;

  const isInStock = selectedVariant.inventoryQty > 0;
  const stockQuantity = selectedVariant.inventoryQty;

  const cartPayload = {
    id: product.id,
    variantId: selectedVariant.id,
    variantName: selectedVariant.name,
    name: product.name,
    price: displayPrice / 100,
    image: primaryImage,
    quantity: 1,
  };

  const handleAddToCart = () => {
    sendGAEvent("event", "add_to_cart", {
      currency: "PKR",
      value: displayPrice / 100,
      items: [
        {
          item_id: selectedVariant.id,
          item_name: product.name,
          item_variant: selectedVariant.name,
          price: displayPrice / 100,
          quantity: 1,
        },
      ],
    });

    addToCart(cartPayload);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (!isInStock) return;

    if (!isInCart) {
      addToCart(cartPayload);
    }

    window.location.assign("/checkout");
  };

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    setJustAdded(false);
  };

  const variantLabel =
    showPicker && selectedVariant.name !== "Default"
      ? ` (${selectedVariant.name})`
      : "";
  const whatsappMessage = `Hi! I'm interested in: ${product.name}${variantLabel} (${formatPrice(displayPrice)})`;
  const whatsappUrl = generateWhatsAppUrl(whatsappMessage);

  return (
    <div className="space-y-6">
      {/* Variant Picker — hidden for single "Default" variant */}
      {showPicker && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Select Variant:</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <Button
                key={variant.id}
                variant={
                  selectedVariant.id === variant.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => handleVariantSelect(variant)}
                className="rounded-full"
                disabled={variant.inventoryQty === 0}
                aria-pressed={selectedVariant.id === variant.id}
              >
                {variant.name}
                {variant.inventoryQty === 0 && (
                  <span className="ml-1 text-xs opacity-60">
                    (Out of Stock)
                  </span>
                )}
              </Button>
            ))}
          </div>
          {/* SKU for selected variant */}
          <p className="text-xs text-muted-foreground">
            SKU: <code className="font-mono">{selectedVariant.sku}</code>
          </p>
        </div>
      )}

      {/* Dynamic Price */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
        <span className="whitespace-nowrap text-4xl font-bold leading-none sm:leading-normal">
          {formatPrice(displayPrice)}
        </span>
        {hasDiscount && (
          <div className="flex items-center gap-2">
            <span className="text-xl text-muted-foreground line-through">
              {formatPrice(selectedVariant.price)}
            </span>
            <Badge variant="destructive">-{discountPercent}% OFF</Badge>
          </div>
        )}
      </div>

      {/* Dynamic Stock Status & 5% COD Tax Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          {isInStock ? (
            <span className="text-sm text-green-600 font-medium">
              In Stock ({stockQuantity} available)
            </span>
          ) : (
            <span className="text-sm text-red-600 font-medium">Out of Stock</span>
          )}
        </div>
        <Badge
          variant="outline"
          className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 text-xs font-semibold px-2.5 py-1"
          data-testid="cod-tax-tag"
        >
          5% Tax on COD Payments
        </Badge>
      </div>

      {/* 5% COD Tax & Delivery Info Banner */}
      <div className="p-3.5 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
        <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          local_shipping
        </span>
        <div>
          <span className="font-bold block text-xs mb-0.5">Shipping & Payment Terms</span>
          <span>
            Flat Rs. 300 delivery fee for Lahore (+ delivery charges apply for all other cities). A 5% COD Tax applies to Cash on Delivery payments.
          </span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          data-testid="detail-add-to-cart"
          className={`flex-1 min-h-14 py-3 text-base gap-2 ${justAdded ? "bg-green-600 hover:bg-green-600" : ""
            }`}
          onClick={handleAddToCart}
          disabled={!isInStock || justAdded || isInCart}
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

        <Button
          size="lg"
          data-testid="detail-buy-now"
          onClick={handleBuyNow}
          disabled={!isInStock}
          className="flex-1 min-h-14 py-3 text-base gap-2 bg-red-600 hover:bg-red-700 text-white"
        >
          <Zap className="h-5 w-5" />
          Buy Now
        </Button>

        <Button
          variant="outline"
          size="lg"
          data-testid="detail-whatsapp"
          className="flex-1 min-h-14 py-3 text-base gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white border-0"
          asChild
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5" />
            Ask on WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
