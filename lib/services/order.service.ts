import type {
  Order,
  OrderItem,
  ProductVariant,
  Customer,
} from "@prisma/client";
import { OrderStatus, Prisma } from "@prisma/client";
/**
 * Order Service
 *
 * Business logic for order management:
 * - Order creation from cart
 * - Status tracking
 * - Customer linking
 */
import { prisma } from "@/lib/prisma";

// Types
export type OrderWithItems = Order & {
  items: (OrderItem & { variant: ProductVariant })[];
  customer: Customer | null;
};

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address?: string;
  notes?: string;
  items: {
    variantId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
};

export type UpdateOrderInput = {
  status?: OrderStatus;
  notes?: string;
  whatsappSent?: boolean;
};

export type OrderFilters = {
  search?: string;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
};

/**
 * Generate unique order number
 */
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${year}${month}${day}-${random}`;
}

/**
 * Get paginated list of orders
 */
export async function getOrders(
  filters: OrderFilters = {},
  pagination: { page?: number; limit?: number } = {},
) {
  const { search, status, dateFrom, dateTo, customerId } = filters;
  const { page = 1, limit = 20 } = pagination;

  const where: Prisma.OrderWhereInput = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search } },
      { customerEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    };
  }

  if (customerId) {
    where.customerId = customerId;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { variant: true } },
      customer: true,
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
  const total = await prisma.order.count({ where });

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single order by ID or order number
 */
export async function getOrder(
  idOrNumber: string,
): Promise<OrderWithItems | null> {
  return prisma.order.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
    },
    include: {
      items: { include: { variant: true } },
      customer: true,
      booking: true, // Include linked booking if exists
    },
  });
}

/**
 * Create a new order
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<OrderWithItems> {
  const { items, ...orderData } = input;

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = subtotal; // Add tax/shipping logic here if needed

  // Find or create customer
  let customerId: string | null = null;
  if (orderData.customerPhone) {
    const customer = await prisma.customer.upsert({
      where: { phone: orderData.customerPhone },
      update: {
        name: orderData.customerName,
        email: orderData.customerEmail || undefined,
        address: orderData.address || undefined,
      },
      create: {
        name: orderData.customerName,
        phone: orderData.customerPhone,
        email: orderData.customerEmail,
        address: orderData.address,
      },
    });
    customerId = customer.id;
  }

  return prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      address: orderData.address,
      notes: orderData.notes,
      subtotal,
      total,
      items: {
        create: items.map((item) => ({
          variantId: item.variantId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    },
    include: {
      items: { include: { variant: true } },
      customer: true,
    },
  });
}

/**
 * Update an order
 */
export async function updateOrder(
  id: string,
  input: UpdateOrderInput,
): Promise<OrderWithItems> {
  return prisma.order.update({
    where: { id },
    data: input,
    include: {
      items: { include: { variant: true } },
      customer: true,
    },
  });
}

/**
 * Update order status (with optional notes)
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  notes?: string,
): Promise<OrderWithItems> {
  return updateOrder(id, { status, ...(notes !== undefined && { notes }) });
}

/**
 * Get order statistics
 */
export async function getOrderStats() {
  const total = await prisma.order.count();
  const byStatus = await prisma.order.groupBy({
    by: ["status"],
    _count: true,
  });
  const revenue = await prisma.order.aggregate({
    where: { status: { in: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] } },
    _sum: { total: true },
  });

  return {
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    totalRevenue: revenue._sum.total || 0,
    newOrders: byStatus.find((s) => s.status === OrderStatus.NEW)?._count || 0,
  };
}

/**
 * Get recent orders
 */
export async function getRecentOrders(limit = 5): Promise<OrderWithItems[]> {
  return prisma.order.findMany({
    include: {
      items: { include: { variant: true } },
      customer: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Delete an order (soft delete - set status to CANCELLED, or hard delete if needed)
 */
export async function deleteOrder(id: string): Promise<void> {
  // Delete order items first due to cascade, then delete order
  await prisma.order.delete({
    where: { id },
  });
}
