"use client";

import { useCart } from "@/context/cart-context";
import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export function CartItems() {
  const { items, updateQuantity, removeItem, getTotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="size-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl text-slate-400">
            shopping_cart
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Your cart is empty
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          Add some products to your cart to get started
        </p>
        <Link href="/products">
          <Button size="lg" className="gap-2">
            <span className="material-symbols-outlined text-[20px]">
              storefront
            </span>
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Items List */}
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Product Image */}
            <div className="size-24 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0 relative">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                  {item.name}
                </h3>
                {item.variantName &&
                  item.variantName.toLowerCase() !== "default" && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Variant: {item.variantName}
                    </p>
                  )}
                <p className="text-lg font-semibold text-primary">
                  Rs. {item.price.toLocaleString()}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1, item.variantId)
                    }
                    className="size-8 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-600 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  <span className="min-w-8 text-center font-semibold text-slate-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1, item.variantId)
                    }
                    className="size-8 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-600 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-4 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id, item.variantId)}
                  className="ml-auto size-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            </div>

            {/* Item Total */}
            <div className="flex flex-col items-end justify-between">
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                Rs. {(item.price * item.quantity).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.quantity} × Rs. {item.price.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
            items)
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            Rs. {getTotal().toLocaleString()}
          </span>
        </div>

        <Link href="/checkout" className="block">
          <Button size="lg" className="w-full gap-2">
            <span>Proceed to Checkout</span>
            <span className="material-symbols-outlined text-[20px]">
              arrow_forward
            </span>
          </Button>
        </Link>

        <Link href="/products" className="block mt-3">
          <Button variant="outline" size="lg" className="w-full gap-2">
            <span className="material-symbols-outlined text-[20px]">
              storefront
            </span>
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
