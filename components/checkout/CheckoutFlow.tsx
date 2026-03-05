"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/cart-context";
import { createUnifiedOrderAction } from "@/app/actions/checkoutActions";
import { CheckoutForm } from "./CheckoutForm";
import { OrderSummary } from "./OrderSummary";
import { Service } from "@prisma/client";

export function CheckoutFlow({
  availableServices,
  preSelectedServiceId,
}: {
  availableServices: Service[];
  preSelectedServiceId?: string;
}) {
  const { items, getTotal, clearCart } = useCart();

  const [customerData, setCustomerData] = useState({
    fullName: "",
    email: "",
    phone: "",
    vehicleModel: "",
    address: "",
  });

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [bookingDate, setBookingDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-select service from URL parameter on mount
  useEffect(() => {
    if (
      preSelectedServiceId &&
      !selectedServiceIds.includes(preSelectedServiceId)
    ) {
      setSelectedServiceIds([preSelectedServiceId]);
    }
  }, [preSelectedServiceId]);

  const selectedServices = availableServices
    .filter((s) => selectedServiceIds.includes(s.id))
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      price: s.price,
    }));

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setFieldErrors({});
    const newFieldErrors: Record<string, string> = {};
    if (!customerData.fullName)
      newFieldErrors.fullName = "Full Name is required.";
    if (!customerData.phone) newFieldErrors.phone = "Phone number is required.";
    if (customerData.email && !/^\S+@\S+\.\S+$/.test(customerData.email)) {
      newFieldErrors.email = "Please enter a valid email address.";
    }
    if (items.length === 0 && selectedServices.length === 0) {
      newFieldErrors.cart = "Your cart and booking queue are both empty.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError("Please fix the highlighted fields before continuing.");
      return;
    }

    if (items.length === 0 && selectedServices.length === 0) {
      setError("Your cart and booking queue are both empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createUnifiedOrderAction({
        customerData: {
          ...customerData,
          vehicleInfo: customerData.vehicleModel,
        },
        cartItems: items.map((i) => ({
          id: String(i.id),
          variantId: i.variantId,
          variantName: i.variantName,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        selectedServices,
        bookingDate: bookingDate || undefined,
      });

      if (result.success && result.data?.whatsappUrl) {
        clearCart();
        window.location.href = result.data.whatsappUrl; // Redirect to WA
      } else {
        setError(result.error || "Failed to process your request.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 w-full gap-8 lg:gap-12 px-4 lg:px-8 justify-center max-w-full">
      {/* Left Column: Forms */}
      <div className="flex-1 w-full py-8 lg:py-12 bg-transparent">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
            {error}
          </div>
        )}
        <CheckoutForm
          customerData={customerData}
          setCustomerData={setCustomerData}
          availableServices={availableServices}
          selectedServiceIds={selectedServiceIds}
          onServiceToggle={handleServiceToggle}
          bookingDate={bookingDate}
          setBookingDate={setBookingDate}
          fieldErrors={fieldErrors}
        />
      </div>

      {/* Right Column: Sticky Summary */}
      <div className="w-full lg:w-105">
        <OrderSummary
          cartItems={items}
          cartTotal={getTotal()}
          selectedServices={selectedServices}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          pageError={error ?? undefined}
        />
      </div>
    </div>
  );
}
