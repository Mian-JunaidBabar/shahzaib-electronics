"use client";

import type { ServiceDTO } from "@/lib/types/dto";
import type { CartItem } from "@/lib/whatsapp";

interface OrderSummaryProps {
  cartItems: CartItem[];
  cartTotal: number;
  selectedServices: Array<Pick<ServiceDTO, "id" | "title" | "price">>;
  onSubmit: () => void;
  isSubmitting: boolean;
  pageError?: string;
}

export function OrderSummary({
  cartItems,
  cartTotal,
  selectedServices,
  onSubmit,
  isSubmitting,
  pageError,
}: OrderSummaryProps) {
  const servicesTotal = selectedServices.reduce(
    (sum, service) => sum + service.price,
    0,
  );
  const total = cartTotal + servicesTotal;

  return (
    <aside className="w-full bg-slate-900 text-white p-6 lg:p-10 rounded-2xl shadow-2xl flex flex-col border border-slate-800 mt-8 lg:mt-8 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-2xl font-black flex items-center gap-3 tracking-tight">
            <span className="material-symbols-outlined text-primary">
              shopping_cart_checkout
            </span>
            Order Summary
          </h3>
        </div>

        {cartItems.length === 0 && selectedServices.length === 0 ? (
          <div className="py-12 px-6 text-center text-slate-400 border border-slate-700/50 rounded-2xl border-dashed">
            <span className="material-symbols-outlined text-[48px] text-slate-600 mb-4 block">
              production_quantity_limits
            </span>
            <p className="font-medium">
              Your cart and booking queue are empty.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Cart Items */}
            {cartItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50 border border-slate-700 transition-colors hover:bg-slate-800"
              >
                <div className="flex-1 pr-4">
                  <p className="text-white font-semibold text-sm mb-1 leading-tight">
                    {item.name}
                  </p>
                  {item.variantName &&
                    item.variantName.toLowerCase() !== "default" && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Variant: {item.variantName}
                      </p>
                    )}
                  <p className="text-slate-400 text-xs font-medium">
                    Qty: {item.quantity} × Rs. {item.price.toLocaleString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-bold text-sm">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}

            {/* Selected Services */}
            {selectedServices.map((service) => (
              <div
                key={service.id}
                className="flex justify-between items-center p-4 rounded-xl bg-slate-900 border border-slate-800 text-white transition-colors hover:bg-slate-800/90 dark:bg-primary/10 dark:border-primary/20 dark:text-primary hover:dark:bg-primary/20"
              >
                <div className="flex-1 pr-4">
                  <p className="font-semibold text-sm mb-1 leading-tight text-white dark:text-primary-light">
                    {service.title}
                  </p>
                  <p className="text-slate-300 dark:text-primary/80 text-xs font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      build
                    </span>
                    Service Booking
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-white dark:text-primary">
                    Rs. {service.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cost Breakdown */}
        <div className="space-y-4 border-t border-slate-700 pt-6 mt-8">
          {cartItems.length > 0 && (
            <div className="flex justify-between text-slate-400 text-sm font-medium">
              <span>Products Subtotal ({cartItems.length} items)</span>
              <span className="text-slate-200">
                Rs. {cartTotal.toLocaleString()}
              </span>
            </div>
          )}
          {selectedServices.length > 0 && (
            <div className="flex justify-between text-slate-400 text-sm font-medium">
              <span>Services Total ({selectedServices.length} items)</span>
              <span className="text-slate-200">
                Rs. {servicesTotal.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex justify-between items-end pt-4 mt-2">
            <span className="text-lg font-bold text-slate-300">
              Total Amount
            </span>
            <span className="text-3xl lg:text-4xl font-black text-white tracking-tight">
              Rs. {total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Sticky Action Area */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          {pageError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm flex gap-3 items-start">
              <span className="material-symbols-outlined text-red-400 shrink-0">
                error
              </span>
              <span>{pageError}</span>
            </div>
          )}

          <button
            onClick={onSubmit}
            disabled={
              isSubmitting ||
              (cartItems.length === 0 && selectedServices.length === 0)
            }
            className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-[#25D366]/20 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined animate-spin text-[24px]">
                progress_activity
              </span>
            ) : (
              <>
                <svg
                  className="w-6 h-6 fill-current group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.413-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.886.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"></path>
                </svg>
                <span className="text-[17px] tracking-tight">
                  Checkout via WhatsApp
                </span>
              </>
            )}
          </button>

          <div className="text-center mt-6">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                lock
              </span>
              Protected by End-to-End Encryption
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
