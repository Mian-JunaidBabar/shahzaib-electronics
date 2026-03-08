"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";

// Date range type used by all analytics functions
export type DateRange = {
  startDate: Date;
  endDate: Date;
};

// Helper to get default date range (last 30 days) - internal only
function getDefaultDateRange(): DateRange {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 29);
  return {
    startDate: startOfDay(startDate),
    endDate: endOfDay(endDate),
  };
}

export async function getRevenueOverTime(range?: DateRange) {
  const { startDate, endDate } = range || getDefaultDateRange();

  // Ensure proper day boundaries
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  const groupedOrders = await prisma.order.groupBy({
    by: ["createdAt"],
    where: {
      status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] },
      createdAt: { gte: start, lte: end },
    },
    _sum: {
      total: true,
    },
    _count: {
      id: true,
    },
  });

  // Group by date string (YYYY-MM-DD)
  const groupedData: Record<string, { revenue: number; orders: number }> = {};

  // Initialize all dates in the range to ensure zero fill
  const allDays = eachDayOfInterval({ start, end });
  allDays.forEach((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    groupedData[dateStr] = { revenue: 0, orders: 0 };
  });

  groupedOrders.forEach((row) => {
    const dateStr = format(row.createdAt, "yyyy-MM-dd");
    if (groupedData[dateStr]) {
      groupedData[dateStr].revenue += (row._sum.total || 0) / 100;
      groupedData[dateStr].orders += row._count.id || 0;
    }
  });

  return Object.entries(groupedData).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    orders: data.orders,
  }));
}

export async function getTopSellingProducts(range?: DateRange) {
  const { startDate, endDate } = range || getDefaultDateRange();
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  // Find order items from orders within the date range
  const topItems = await prisma.orderItem.groupBy({
    by: ["variantId", "name"],
    where: {
      order: {
        createdAt: { gte: start, lte: end },
      },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 5,
  });

  return topItems.map((item) => ({
    name: item.name,
    quantity: item._sum.quantity || 0,
    variantId: item.variantId,
  }));
}

export async function getBookingStatusDistribution(range?: DateRange) {
  const { startDate, endDate } = range || getDefaultDateRange();
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  const distribution = await prisma.booking.groupBy({
    by: ["status"],
    where: {
      createdAt: { gte: start, lte: end },
    },
    _count: {
      id: true,
    },
  });

  return distribution.map((item) => ({
    name: item.status,
    value: item._count.id,
  }));
}

export async function getDashboardSummary(range?: DateRange) {
  const { startDate, endDate } = range || getDefaultDateRange();
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  // Run queries sequentially to avoid opening many DB sessions at once
  const totalRevenueResult = await prisma.order.aggregate({
    where: {
      status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] },
      createdAt: { gte: start, lte: end },
    },
    _sum: {
      total: true,
    },
  });

  const pendingOrders = await prisma.order.count({
    where: {
      status: { in: ["NEW", "PROCESSING"] },
      createdAt: { gte: start, lte: end },
    },
  });

  const activeBookings = await prisma.booking.count({
    where: {
      status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      createdAt: { gte: start, lte: end },
    },
  });

  // Count low stock variants (where inventoryQty <= lowStockAt)
  const lowStockVariants = await prisma.productVariant.findMany({
    where: {
      product: { isActive: true },
    },
    select: { inventoryQty: true, lowStockAt: true },
  });
  const lowStockItems = lowStockVariants.filter(
    (v) => v.inventoryQty <= v.lowStockAt,
  ).length;

  return {
    totalRevenue: (totalRevenueResult._sum.total || 0) / 100, // Cents to main unit
    pendingOrders,
    activeBookings,
    lowStockItems,
  };
}

export async function getCustomerGrowth(days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const customerGroups = await prisma.customer.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: { gte: cutoffDate },
    },
    _count: {
      id: true,
    },
  });

  const groupedData: Record<string, number> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    groupedData[dateStr] = 0;
  }

  customerGroups.forEach((row) => {
    const dateStr = row.createdAt.toISOString().split("T")[0];
    if (dateStr in groupedData) {
      groupedData[dateStr] += row._count.id || 0;
    }
  });

  return Object.entries(groupedData).map(([date, newCustomers]) => ({
    date,
    newCustomers,
  }));
}

export async function getRevenueByCategory(range?: DateRange) {
  const { startDate, endDate } = range || getDefaultDateRange();
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  const groupedOrderItems = await prisma.orderItem.groupBy({
    by: ["variantId", "price"],
    where: {
      order: {
        createdAt: { gte: start, lte: end },
      },
    },
    _sum: {
      quantity: true,
    },
  });

  const variantIds = Array.from(
    new Set(groupedOrderItems.map((item) => item.variantId)),
  );
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: {
      id: true,
      product: {
        select: {
          category: true,
        },
      },
    },
  });
  const categoryByVariantId = new Map(
    variants.map((variant) => [variant.id, variant.product?.category]),
  );

  const categoryTotals: Record<string, number> = {};

  groupedOrderItems.forEach((item) => {
    const cat = categoryByVariantId.get(item.variantId) || "Uncategorized";
    if (!categoryTotals[cat]) categoryTotals[cat] = 0;
    categoryTotals[cat] += (item.price * (item._sum.quantity || 0)) / 100;
  });

  return Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export async function getTopBookedServices() {
  const services = await prisma.booking.groupBy({
    by: ["serviceType"],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 5,
  });

  return services.map((s) => ({
    name: s.serviceType,
    bookings: s._count.id,
  }));
}

export async function getLowStockAlerts() {
  // Find variants where inventoryQty <= lowStockAt
  const allVariants = await prisma.productVariant.findMany({
    where: {
      product: { isActive: true },
    },
    include: {
      product: { select: { name: true } },
    },
    orderBy: {
      inventoryQty: "asc",
    },
  });

  const lowStockVariants = allVariants
    .filter((v) => v.inventoryQty <= v.lowStockAt)
    .slice(0, 5);

  return lowStockVariants.map((v) => ({
    id: v.id,
    name: `${v.product.name} - ${v.name}`,
    sku: v.sku,
    quantity: v.inventoryQty,
    threshold: v.lowStockAt,
  }));
}
