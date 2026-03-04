/**
 * Dashboard Server Actions
 *
 * RBAC-protected actions for dashboard data.
 * All actions require admin authentication.
 */

"use server";

import { cache } from "react";
import { requireAdmin } from "@/lib/services/auth.service";
import * as ProductService from "@/lib/services/product.service";
import * as OrderService from "@/lib/services/order.service";
import * as BookingService from "@/lib/services/booking.service";
import * as LeadService from "@/lib/services/lead.service";
import * as CustomerService from "@/lib/services/customer.service";
import * as NotificationService from "@/lib/services/notification.service";
import { prisma } from "@/lib/prisma";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type DashboardStats = {
  products: {
    total: number;
    active: number;
    lowStock: number;
  };
  orders: {
    total: number;
    new: number;
    revenue: number;
  };
  bookings: {
    total: number;
    upcoming: number;
    today: number;
    pending: number;
  };
  leads: {
    total: number;
    new: number;
  };
  customers: {
    total: number;
    vip: number;
    new: number;
  };
};

export type RecentActivity = {
  type: "order" | "booking" | "lead";
  id: string;
  title: string;
  subtitle: string;
  status: string;
  createdAt: Date;
};

/**
 * Get comprehensive dashboard statistics
 * Cached to prevent duplicate queries within the same request
 */
export const getDashboardStatsAction = cache(
  async (): Promise<ActionResult<DashboardStats>> => {
    try {
      await requireAdmin();

      // Fetch all stats sequentially to avoid DB pool exhaustion
      const orderStats = await OrderService.getOrderStats();
      const bookingStats = await BookingService.getBookingStats();
      const leadStats = await LeadService.getLeadStats();
      const customerStats = await CustomerService.getCustomerStats();
      const productCounts = await prisma.product.groupBy({
        by: ["isActive"],
        _count: true,
      });
      const lowStockProducts = await ProductService.getLowStockProducts();

      // Calculate product stats
      const activeProducts = productCounts.find((p) => p.isActive)?._count || 0;
      const inactiveProducts =
        productCounts.find((p) => !p.isActive)?._count || 0;

      return {
        success: true,
        data: {
          products: {
            total: activeProducts + inactiveProducts,
            active: activeProducts,
            lowStock: lowStockProducts.length,
          },
          orders: {
            total: orderStats.total,
            new: orderStats.newOrders,
            revenue: orderStats.totalRevenue,
          },
          bookings: {
            total: bookingStats.total,
            upcoming: bookingStats.upcomingBookings,
            today: bookingStats.todayBookings,
            pending: bookingStats.pendingBookings,
          },
          leads: {
            total: leadStats.total,
            new: leadStats.newLeads,
          },
          customers: {
            total: customerStats.total,
            vip: customerStats.vipCount,
            new: customerStats.recentCount,
          },
        },
      };
    } catch (error) {
      console.error("getDashboardStatsAction error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard stats",
      };
    }
  },
);

/**
 * Get recent activity across all entities
 * Cached to prevent duplicate queries within the same request
 */
export const getRecentActivityAction = cache(
  async (limit: number = 10): Promise<ActionResult<RecentActivity[]>> => {
    try {
      await requireAdmin();

      // Fetch recent items from each category (sequential to avoid DB pool exhaustion)
      const recentOrders = await OrderService.getRecentOrders(limit);
      const recentBookings = await BookingService.getUpcomingBookings(limit);
      const recentLeads = await LeadService.getRecentLeads(limit);

      // Combine and format
      const activity: RecentActivity[] = [
        ...recentOrders.map((order) => ({
          type: "order" as const,
          id: order.id,
          title: `Order ${order.orderNumber}`,
          subtitle: `${order.customerName} - PKR ${order.total.toLocaleString()}`,
          status: order.status,
          createdAt: order.createdAt,
        })),
        ...recentBookings.map((booking) => ({
          type: "booking" as const,
          id: booking.id,
          title: `Booking ${booking.bookingNumber}`,
          subtitle: `${booking.customerName} - ${booking.serviceType}`,
          status: booking.status,
          createdAt: booking.createdAt,
        })),
        ...recentLeads.map((lead) => ({
          type: "lead" as const,
          id: lead.id,
          title: `Lead from ${lead.name}`,
          subtitle:
            lead.message.substring(0, 50) +
            (lead.message.length > 50 ? "..." : ""),
          status: lead.status,
          createdAt: lead.createdAt,
        })),
      ];

      // Sort by createdAt desc and limit
      activity.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return { success: true, data: activity.slice(0, limit) };
    } catch (error) {
      console.error("getRecentActivityAction error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch recent activity",
      };
    }
  },
);

/**
 * Get low stock alerts
 */
export async function getLowStockAlertsAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof ProductService.getLowStockProducts>>>
> {
  try {
    await requireAdmin();

    const products = await ProductService.getLowStockProducts();
    return { success: true, data: products };
  } catch (error) {
    console.error("getLowStockAlertsAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch low stock alerts",
    };
  }
}

/**
 * Generate daily summary notification
 */
export async function generateDailySummaryAction(): Promise<
  ActionResult<{ whatsappUrl: string }>
> {
  try {
    await requireAdmin();

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: today } },
      select: { total: true },
    });
    const todayBookings = await prisma.booking.count({
      where: { createdAt: { gte: today } },
    });
    const todayLeads = await prisma.lead.count({
      where: { createdAt: { gte: today } },
    });

    const ordersTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);

    const message = NotificationService.generateDailySummary({
      newOrders: todayOrders.length,
      ordersTotal,
      newBookings: todayBookings,
      newLeads: todayLeads,
    });

    const notification = NotificationService.generateCustomMessage(
      process.env.WHATSAPP_BUSINESS_PHONE || "",
      message,
    );

    return { success: true, data: { whatsappUrl: notification.url! } };
  } catch (error) {
    console.error("generateDailySummaryAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate daily summary",
    };
  }
}

/**
 * Generate low stock alert notification
 */
export async function generateLowStockAlertAction(): Promise<
  ActionResult<{ whatsappUrl: string }>
> {
  try {
    await requireAdmin();

    const products = await ProductService.getLowStockProducts();

    if (products.length === 0) {
      return { success: false, error: "No low stock products found" };
    }

    const message = NotificationService.generateLowStockAlert(
      products.flatMap((p) =>
        p.variants.map((v) => ({
          name: `${p.name} - ${v.name}`,
          stock: v.inventoryQty,
          sku: v.sku,
        })),
      ),
    );

    const notification = NotificationService.generateCustomMessage(
      process.env.WHATSAPP_BUSINESS_PHONE || "",
      message,
    );

    return { success: true, data: { whatsappUrl: notification.url! } };
  } catch (error) {
    console.error("generateLowStockAlertAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate low stock alert",
    };
  }
}
