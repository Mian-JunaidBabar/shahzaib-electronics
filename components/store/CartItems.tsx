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
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700 sm:size-24">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="min-w-0 flex-1">
                <h3 className="mb-1 text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  {item.name}
                </h3>
                {item.variantName &&
                  item.variantName.toLowerCase() !== "default" && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Variant: {item.variantName}
                    </p>
                  )}
                <p className="mt-1 text-lg font-semibold text-primary">
                  Rs. {(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
                <button
                  onClick={() =>
                    updateQuantity(item.id, item.quantity - 1, item.variantId)
                  }
                  className="size-8 flex items-center justify-center rounded-md transition-colors hover:bg-white dark:hover:bg-slate-600"
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
                  className="size-8 flex items-center justify-center rounded-md transition-colors hover:bg-white dark:hover:bg-slate-600"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4 text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              <button
                onClick={() => removeItem(item.id, item.variantId)}
                className="ml-auto size-9 flex items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                aria-label="Remove item"
              >
                <Trash2 className="size-5" />
              </button>
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
