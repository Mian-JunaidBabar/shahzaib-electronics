export interface CartItem {
  id: string | number;
  variantId: string; // Specific variant UUID (for DB linking & uniqueness)
  variantName: string; // Display name, e.g. "2GB/32GB" or "Default"
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface BookingDetails {
  name: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  carModel?: string;
  serviceType?: string;
  notes?: string;
}

/**
 * Get WhatsApp number from environment variable
 */
export function getWhatsAppNumber(): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number) {
    console.warn("NEXT_PUBLIC_WHATSAPP_NUMBER is not set");
    return "";
  }
  // Remove any non-numeric characters except +
  return number.replace(/[^\d+]/g, "");
}

/**
 * Generate WhatsApp URL with encoded message
 */
export function generateWhatsAppUrl(message: string): string {
  const number = getWhatsAppNumber();
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encodedMessage}`;
}

/**
 * Format price as currency string
 */
export function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString()}`;
}

/**
 * Generate order message from cart items
 */
export function generateOrderMessage(items: CartItem[]): string {
  const itemsList = items
    .map((item) => {
      const variantDisplay =
        item.variantName && item.variantName.toLowerCase() !== "default"
          ? ` (${item.variantName})`
          : "";
      return `• ${item.name}${variantDisplay} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`;
    })
    .join("\n");

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return `🚗 *New Order from Shahzaib Autos*

*Order Details:*
${itemsList}

*Total: ${formatPrice(total)}*

Please confirm availability and delivery details.`;
}

/**
 * Generate booking message for home installation
 */
export function generateBookingMessage(details: BookingDetails): string {
  return `🔧 *Home Installation Booking Request*

*Customer Details:*
• Name: ${details.name}
• Phone: ${details.phone}
• Address: ${details.address}
${details.carModel ? `• Car: ${details.carModel}` : ""}

*Service:* ${details.serviceType || "Not specified"}

*Preferred Schedule:*
• Date: ${details.date}
• Time: ${details.time}

${details.notes ? `*Additional Notes:*\n${details.notes}` : ""}

Please confirm the booking and estimated arrival time.`;
}

/**
 * Generate general inquiry message
 */
export function generateInquiryMessage(name: string, message: string): string {
  return `💬 *General Inquiry from Shahzaib Autos Website*

*From:* ${name}

*Message:*
${message}`;
}

/**
 * Open WhatsApp with the given message
 */
export function openWhatsApp(message: string): void {
  const url = generateWhatsAppUrl(message);
  window.open(url, "_blank");
}
