import { CartItems } from "@/components/store/CartItems";


export const metadata = {
  title: "Shopping Cart | Shahzaib Electronics",
  description: "Review your cart and proceed to checkout",
};

export default function CartPage() {
  return (
    <main className="flex-1 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-primary mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-5xl text-primary">
              shopping_cart
            </span>
            Shopping Cart
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Review your items and adjust quantities before checkout
          </p>
        </div>

        {/* Cart Items */}
        <CartItems />
      </div>
    </main>
  );
}
