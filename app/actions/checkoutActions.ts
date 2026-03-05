"use server";

import { prisma } from "@/lib/prisma";
import { generateWhatsAppUrl } from "@/lib/whatsapp";

export type CheckoutData = {
  customerData: {
    fullName: string;
    phone: string;
    email?: string;
    address?: string;
    vehicleInfo?: string;
  };
  cartItems: {
    id: string; // Cart-unique ID (equals variantId)
    variantId: string; // ProductVariant.id for direct DB lookup
    variantName: string; // Display name, e.g. "2GB/32GB" or "Default"
    name: string; // Product name snapshot
    price: number;
    quantity: number;
  }[];
  selectedServices: {
    id: string; // service ID
    slug: string;
    title: string;
    price: number;
  }[];
  bookingDate?: string;
};

function generateOrderNumber() {
  const prefix = "ORD";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

function generateBookingNumber() {
  const prefix = "BK";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

export async function createUnifiedOrderAction(data: CheckoutData) {
  try {
    const { customerData, cartItems, selectedServices, bookingDate } = data;

    if (!customerData.fullName || !customerData.phone) {
      return { success: false, error: "Name and Phone number are required." };
    }

    if (cartItems.length === 0 && selectedServices.length === 0) {
      return { success: false, error: "Cart and services are empty." };
    }

    // Pre-fetch service pricing outside the transaction to avoid long-running
    // interactive transactions (prevents transaction timeout errors).
    let bookingServiceString = "";
    let servicesSubtotalPre = 0;
    if (selectedServices.length > 0) {
      bookingServiceString = selectedServices.map((s) => s.title).join(", ");
      const serviceIds = selectedServices.map((s) => s.id);
      const dbServicesResultPre = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
      });
      for (const s of dbServicesResultPre) {
        servicesSubtotalPre += s.price;
      }
    }

    // Wrap the remaining writes in a Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or Create Customer (handle email uniqueness)
      let customer = await tx.customer.findFirst({
        where: {
          OR: [
            { phone: customerData.phone },
            ...(customerData.email ? [{ email: customerData.email }] : []),
          ],
        },
      });

      if (customer) {
        // Update existing customer
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            name: customerData.fullName,
            email: customerData.email || customer.email,
            address: customerData.address || customer.address,
          },
        });
      } else {
        // Create new customer
        customer = await tx.customer.create({
          data: {
            name: customerData.fullName,
            phone: customerData.phone,
            email: customerData.email || undefined,
            address: customerData.address || undefined,
          },
        });
      }

      let dbOrder = null;
      let dbBooking = null;
      let totalCents = 0;
      const bookingServiceString = "";
      let servicesSubtotal = 0;

      // 2. Create Order & Items if cartItems exist
      if (cartItems.length > 0) {
        // Look up variants directly by variantId (correct and efficient)
        const variantIds = cartItems.map((item) => item.variantId);
        const dbVariants = await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          include: { product: { select: { name: true } } },
        });

        const orderItemsToCreate = [];

        for (const item of cartItems) {
          const dbVariant = dbVariants.find((v) => v.id === item.variantId);
          if (!dbVariant)
            throw new Error(`Variant not found for: ${item.name}`);

          if (dbVariant.inventoryQty < item.quantity)
            throw new Error(
              `Insufficient stock for "${item.name}". Only ${dbVariant.inventoryQty} available.`,
            );

          // Determine price directly from DB (salePrice or regular price)
          const actualPriceCents = dbVariant.salePrice ?? dbVariant.price;
          totalCents += actualPriceCents * item.quantity;

          // Append variant name to snapshot (omit if it is "Default")
          const nameSnapshot =
            item.variantName && item.variantName !== "Default"
              ? `${item.name} (${item.variantName})`
              : item.name;

          orderItemsToCreate.push({
            variantId: dbVariant.id,
            name: nameSnapshot,
            price: actualPriceCents,
            quantity: item.quantity,
          });

          // Decrement Inventory
          await tx.productVariant.update({
            where: { id: dbVariant.id },
            data: { inventoryQty: { decrement: item.quantity } },
          });
        }

        // Create the Order
        dbOrder = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            customerId: customer.id,
            customerName: customerData.fullName,
            customerPhone: customerData.phone,
            customerEmail: customerData.email,
            address: customerData.address,
            subtotal: totalCents,
            total: totalCents, // can add taxes/shipping here
            status: "NEW",
            items: {
              create: orderItemsToCreate,
            },
          },
        });
      }

      // 3. Create Booking if selectedServices exist (use pre-fetched service data)
      if (selectedServices.length > 0) {
        servicesSubtotal = servicesSubtotalPre;

        // Create Booking
        dbBooking = await tx.booking.create({
          data: {
            bookingNumber: generateBookingNumber(),
            customerId: customer.id,
            customerName: customerData.fullName,
            customerPhone: customerData.phone,
            customerEmail: customerData.email,
            serviceType: bookingServiceString,
            vehicleInfo: customerData.vehicleInfo || null,
            date: bookingDate ? new Date(bookingDate) : new Date(),
            status: "PENDING",
            address: customerData.address || "Workshop",
            orderId: dbOrder ? dbOrder.id : null,
          },
        });

        // Add services subtotal (Rupees -> cents)
        totalCents += servicesSubtotal * 100;
      }

      return { customer, dbOrder, dbBooking, totalCents, bookingServiceString };
    });

    // 4. Generate WhatsApp Message
    const orderRef = result.dbOrder
      ? result.dbOrder.orderNumber
      : result.dbBooking?.bookingNumber;

    // Build cart items string (include variant name if not "Default")
    let parsedCartItems = "None";
    if (cartItems.length > 0) {
      parsedCartItems = cartItems
        .map((item) => {
          const variantSuffix =
            item.variantName && item.variantName !== "Default"
              ? ` (${item.variantName})`
              : "";
          return `${item.quantity}x ${item.name}${variantSuffix} - Rs. ${(item.price * item.quantity).toLocaleString()}`;
        })
        .join("\n• ");
      parsedCartItems = "• " + parsedCartItems;
    }

    const totalRs = result.totalCents / 100;

    const message = `Hello Shahzaib Autos! I would like to place an order/booking.

*Reference:* #${orderRef}
*Name:* ${customerData.fullName}
*Items:* ${parsedCartItems}
*Services Required:* ${result.bookingServiceString || "None"}

*Total:* Rs. ${totalRs.toLocaleString()}

Please confirm my request.`;

    const whatsappUrl = generateWhatsAppUrl(message);

    return {
      success: true,
      data: {
        whatsappUrl,
        orderId: result.dbOrder?.id,
        bookingId: result.dbBooking?.id,
      },
    };
  } catch (error: unknown) {
    console.error("UnifiedCheckout Error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
