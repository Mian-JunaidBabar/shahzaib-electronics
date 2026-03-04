import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Top selling categories in the last 7 days
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const items = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: cutoff } } },
    include: {
      variant: {
        include: {
          product: { select: { category: true } },
        },
      },
    },
  });

  const counts: Record<string, number> = {};
  for (const it of items) {
    const cat = it.variant?.product?.category || "Uncategorized";
    counts[cat] = (counts[cat] || 0) + it.quantity;
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);

  return NextResponse.json(sorted);
}
