import {
  getDashboardSummary,
  getRevenueOverTime,
  getTopSellingProducts,
  getBookingStatusDistribution,
  getRevenueByCategory,
  getTopBookedServices,
  getLowStockAlerts,
  type DateRange,
} from "@/app/actions/analyticsActions";
import {
  Calendar,
  AlertTriangle,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  CheckCircle2,
  Wallet,
  Clock,
  LayoutGrid,
} from "lucide-react";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Overview | Admin",
};

import { getRecentActivityAction } from "@/app/actions/dashboardActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";

// Charts
import { RevenueAreaChart } from "@/components/admin/charts/RevenueAreaChart";
import { TopProductsBarChart } from "@/components/admin/charts/TopProductsBarChart";
import { BookingStatusDonut } from "@/components/admin/charts/BookingStatusDonut";
import { CategoryRevenueBars } from "@/components/admin/charts/CategoryRevenueBars";
import { ChartSkeleton } from "@/components/admin/charts/chart-skeleton";
import { DashboardDateFilter } from "@/components/admin/dashboard-date-filter";
import ExportButton from "@/components/admin/export-button";

export const dynamic = "force-dynamic";

// Helper to parse date range from search params
function parseDateRange(searchParams: {
  from?: string;
  to?: string;
}): DateRange {
  const today = new Date();
  const defaultStart = startOfDay(subDays(today, 29));
  const defaultEnd = endOfDay(today);

  try {
    const from = searchParams.from ? new Date(searchParams.from) : defaultStart;
    const to = searchParams.to ? new Date(searchParams.to) : defaultEnd;

    // Validate dates
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return { startDate: defaultStart, endDate: defaultEnd };
    }

    return {
      startDate: startOfDay(from),
      endDate: endOfDay(to),
    };
  } catch {
    return { startDate: defaultStart, endDate: defaultEnd };
  }
}

// ----------------------------------------------------------------------
// DATA WRAPPERS WITH SUSPENSE (Date-aware)
// ----------------------------------------------------------------------

async function RevenueChartWrapper({ dateRange }: { dateRange: DateRange }) {
  const data = await getRevenueOverTime(dateRange);
  return <RevenueAreaChart data={data} />;
}

async function BookingStatusChartWrapper({
  dateRange,
}: {
  dateRange: DateRange;
}) {
  const data = await getBookingStatusDistribution(dateRange);
  return <BookingStatusDonut data={data} />;
}

async function CategoryRevenueWrapper({ dateRange }: { dateRange: DateRange }) {
  const data = await getRevenueByCategory(dateRange);
  return <CategoryRevenueBars data={data} />;
}

async function TopProductsChartWrapper({
  dateRange,
}: {
  dateRange: DateRange;
}) {
  const data = await getTopSellingProducts(dateRange);
  return <TopProductsBarChart data={data} />;
}

async function LowStockAlertsWrapper() {
  const alerts = await getLowStockAlerts();

  if (alerts.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        All inventory levels are healthy.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-2">
      {alerts.map((item) => (
        <Link
          key={item.id}
          href={`/admin/dashboard/inventory/${item.id}`}
          className="flex justify-between items-start hover:bg-accent p-2 -mx-2 rounded-lg transition-colors cursor-pointer"
        >
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm">
              {item.name}
            </span>
            <span className="text-xs text-muted-foreground uppercase">
              SKU: {item.sku}
            </span>
          </div>
          <span className="font-bold text-red-600 text-sm text-right shrink-0">
            Qty: {item.quantity}
          </span>
        </Link>
      ))}
    </div>
  );
}

async function RecentActivityWrapper() {
  const result = await getRecentActivityAction(5);
  const activities = result.success ? result.data || [] : [];

  if (activities.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        No recent activity
      </div>
    );
  }

  const getActivityIconAndColor = (type: string) => {
    switch (type) {
      case "order":
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          bg: "bg-emerald-100",
          text: "text-emerald-500",
        };
      case "booking":
        return {
          icon: <Calendar className="h-5 w-5" />,
          bg: "bg-blue-100",
          text: "text-blue-500",
        };
      case "lead":
        return {
          icon: <Wallet className="h-5 w-5" />,
          bg: "bg-amber-100",
          text: "text-amber-500",
        };
      default:
        return {
          icon: <Clock className="h-5 w-5" />,
          bg: "bg-muted",
          text: "text-muted-foreground",
        };
    }
  };

  const getActivityLink = (type: string, id: string) => {
    switch (type) {
      case "order":
        return `/admin/dashboard/orders/${id}`;
      case "booking":
        return `/admin/dashboard/bookings/${id}`;
      case "lead":
        return `/admin/dashboard/leads/${id}`;
      default:
        return "#";
    }
  };

  return (
    <div className="flex flex-col gap-3 mt-2">
      {activities.map((activity) => {
        const style = getActivityIconAndColor(activity.type);
        return (
          <Link
            key={activity.id}
            href={getActivityLink(activity.type, activity.id)}
            className="flex items-center gap-4 hover:bg-accent p-2 -mx-2 rounded-lg transition-colors cursor-pointer"
          >
            <div
              className={`p-2.5 rounded-full shrink-0 ${style.bg} ${style.text}`}
            >
              {style.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">
                {activity.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {activity.subtitle}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------
// MAIN DASHBOARD PAGE
// ----------------------------------------------------------------------

type PageProps = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const dateRange = parseDateRange(params);
  const summary = await getDashboardSummary(dateRange);

  return (
    <div className="min-h-screen bg-background pb-20 -mx-4 md:-mx-8 -mt-4 md:-mt-8">
      {/* Top Header Row */}
      <div className="bg-card/80 backdrop-blur-md border-b px-4 py-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black text-primary tracking-tight flex items-center gap-2">
              Shahzaib Autos
            </h1>
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mt-0.5">
              Command Center
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DashboardDateFilter />
            <ExportButton
              from={format(dateRange.startDate, "yyyy-MM-dd")}
              to={format(dateRange.endDate, "yyyy-MM-dd")}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6 mt-6 md:mt-8">
        {/* 4 Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="p-5 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Total Revenue
              </span>
              <span className="text-2xl font-black text-foreground">
                ${summary.totalRevenue.toLocaleString()}
              </span>
              <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+12.5%</span>
              </div>
            </CardContent>
          </Card>

          <Link href="/admin/dashboard/orders?status=NEW" className="block">
            <Card className="rounded-3xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Pending Orders
                </span>
                <span className="text-2xl font-black text-foreground">
                  {summary.pendingOrders}
                </span>
                <div className="flex items-center gap-1 text-red-500 font-bold text-xs mt-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>-2.4%</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/bookings" className="block">
            <Card className="rounded-3xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Active Bookings
                </span>
                <span className="text-2xl font-black text-foreground">
                  {summary.activeBookings}
                </span>
                <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+5.0%</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link
            href="/admin/dashboard/inventory?sort=low_stock"
            className="block"
          >
            <Card className="rounded-3xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Low Stock
                </span>
                <span className="text-2xl font-black text-red-600">
                  {summary.lowStockItems}
                </span>
                <div className="flex items-center gap-1 text-red-600 font-bold text-xs mt-1">
                  <AlertTriangle className="w-3 h-3 fill-current" />
                  <span>Critical</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Large Layout Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Timeline Chart */}
            <Card className="rounded-4xl border-0 shadow-sm overflow-hidden">
              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-sm font-bold m-0 p-0">
                      Revenue & Orders Timeline
                    </CardTitle>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl md:text-3xl font-black">
                        $
                        {(summary.totalRevenue / 3.65)
                          .toFixed(0)
                          .toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        / 30d
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100 border-0 font-bold px-2 py-0.5 shadow-none rounded-md">
                    +8%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Suspense fallback={<ChartSkeleton />}>
                  <RevenueChartWrapper dateRange={dateRange} />
                </Suspense>
              </CardContent>
            </Card>

            {/* Booking Status Donut */}
            <Card className="rounded-4xl border-0 shadow-sm">
              <CardHeader className="p-6 pb-2 border-b-0">
                <CardTitle className="text-sm font-bold m-0 p-0">
                  Booking Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <Suspense fallback={<ChartSkeleton />}>
                  <BookingStatusChartWrapper dateRange={dateRange} />
                </Suspense>
              </CardContent>
            </Card>

            {/* Revenue Category Progress Bars */}
            <Card className="rounded-4xl border-0 shadow-sm">
              <CardHeader className="p-6 pb-2 border-b-0">
                <CardTitle className="text-sm font-bold m-0 p-0">
                  Revenue by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Suspense fallback={<ChartSkeleton />}>
                  <CategoryRevenueWrapper dateRange={dateRange} />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Top Selling Products Bar Chart */}
            <Card className="rounded-4xl border-0 shadow-sm">
              <CardHeader className="p-6 pb-2 border-b-0">
                <CardTitle className="text-sm font-bold m-0 p-0">
                  Top 5 Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Suspense fallback={<ChartSkeleton />}>
                  <TopProductsChartWrapper dateRange={dateRange} />
                </Suspense>
              </CardContent>
            </Card>

            {/* Critical Stock Alerts with striking visual frame */}
            <Card className="rounded-3xl border-0 shadow-sm overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#fb1034]" />
              <CardHeader className="p-6 pb-2 border-b-0 flex flex-row items-center gap-3">
                <div className="p-1.5 bg-red-100 text-red-600 rounded-md">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm font-bold m-0 p-0">
                  Critical Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <Suspense fallback={<ChartSkeleton />}>
                  <LowStockAlertsWrapper />
                </Suspense>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="rounded-4xl border-0 shadow-sm">
              <CardHeader className="p-6 pb-2 border-b-0">
                <CardTitle className="text-sm font-bold m-0 p-0">
                  Recent Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <Suspense fallback={<ChartSkeleton />}>
                  <RecentActivityWrapper />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
