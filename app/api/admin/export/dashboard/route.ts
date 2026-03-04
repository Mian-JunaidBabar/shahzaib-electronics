import {
  getRevenueOverTime,
  getTopSellingProducts,
  type DateRange,
} from "@/app/actions/analyticsActions";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { requireAdmin } from "@/lib/services/auth.service";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    // ensure admin
    await requireAdmin();

    const url = new URL(request.url);
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    const today = new Date();
    const defaultStart = startOfDay(subDays(today, 29));
    const defaultEnd = endOfDay(today);

    const startDate = fromParam
      ? startOfDay(new Date(fromParam))
      : defaultStart;
    const endDate = toParam ? endOfDay(new Date(toParam)) : defaultEnd;

    const dateRange: DateRange = { startDate, endDate };

    // Fetch data in parallel
    const [revenueData, topProducts] = await Promise.all([
      getRevenueOverTime(dateRange),
      getTopSellingProducts(dateRange),
    ]);

    // Orders detail (limit to 1000)
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // Prepare sheets
    const wb = XLSX.utils.book_new();

    // Sheet 1: Daily Sales
    const dailyRows = revenueData.map((d) => ({
      Date: d.date,
      Revenue: d.revenue,
      Orders: d.orders,
    }));
    const ws1 = XLSX.utils.json_to_sheet(dailyRows);
    XLSX.utils.book_append_sheet(wb, ws1, "Daily Sales");

    // Sheet 2: Top Products
    const topRows = topProducts.map((p) => ({
      Name: p.name,
      Quantity: p.quantity,
      VariantId: p.variantId,
    }));
    const ws2 = XLSX.utils.json_to_sheet(topRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Top Products");

    // Sheet 3: Orders Detail
    const orderRows = orders.map((o) => ({
      OrderID: o.id,
      CustomerName: o.customer?.name || "",
      Total: (o.total || 0) / 100,
      Status: o.status,
      Date: o.createdAt.toISOString(),
    }));
    const ws3 = XLSX.utils.json_to_sheet(orderRows);
    XLSX.utils.book_append_sheet(wb, ws3, "Orders");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    const fileName = `Shahzaib_Autos_Report_${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Export dashboard error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Export failed" },
      { status: 500 },
    );
  }
}
