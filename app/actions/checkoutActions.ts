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
    id: string; // product ID (Actually slug from our frontend mapping, but we should look up by slug)
    name: string;
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
      // 1. Upsert Customer
      const customer = await tx.customer.upsert({
        where: { phone: customerData.phone },
        update: {
          name: customerData.fullName,
          email: customerData.email || undefined,
          address: customerData.address || undefined,
        },
        create: {
          name: customerData.fullName,
          phone: customerData.phone,
          email: customerData.email || undefined,
          address: customerData.address || undefined,
        },
      });

      let dbOrder = null;
      let dbBooking = null;
      let totalCents = 0;
      const bookingServiceString = "";
      let servicesSubtotal = 0;

      // 2. Create Order & Items if cartItems exist
      if (cartItems.length > 0) {
        // Look up real prices from variants to be safe
        const variantIds = cartItems.map((item) => item.id);
        const variants = await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          include: { product: true },
        });

        const orderItemsToCreate = [];

        for (const item of cartItems) {
          const dbVariant = variants.find((v) => v.id === item.id);
          if (!dbVariant) throw new Error(`Product variant not found: ${item.id}`);

          // Determine price directly from DB (salePrice or regular price)
          const actualPriceCents = dbVariant.salePrice || dbVariant.price;
          totalCents += actualPriceCents * item.quantity;

          orderItemsToCreate.push({
            variantId: dbVariant.id,
            name: dbVariant.name,
            price: actualPriceCents,
            quantity: item.quantity,
          });

          // Decrement Inventory safely
          if (dbVariant.inventoryQty >= item.quantity) {
            await tx.productVariant.update({
              where: { id: dbVariant.id },
              data: { inventoryQty: { decrement: item.quantity } },
            });
          }
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

    // Build cart items string
    let parsedCartItems = "None";
    if (cartItems.length > 0) {
      parsedCartItems = cartItems
        .map(
          (item) =>
            `${item.quantity}x ${item.name} (Rs. ${item.price.toLocaleString()})`,
        )
        .join(", ");
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
