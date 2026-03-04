import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    // Single optimized query: fetch variants with aggregated order data
    const topVariants = await prisma.productVariant.findMany({
      where: {
        orderItems: {
          some: {
            order: { createdAt: { gte: since } },
          },
        },
        product: {
          isArchived: false,
          isActive: true,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { secureUrl: true },
            },
          },
        },
        orderItems: {
          where: {
            order: { createdAt: { gte: since } },
          },
          select: { quantity: true },
        },
      },
      orderBy: {
        orderItems: {
          _count: "desc",
        },
      },
      take: 4,
    });

    const payload = topVariants.map((v) => {
      const p = v.product;
      const totalSold = v.orderItems.reduce((sum, oi) => sum + oi.quantity, 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: v.price,
        description: p.description,
        image: p.images?.[0]?.secureUrl ?? null,
        sold: totalSold,
      };
    });

    return NextResponse.json({ data: payload });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch top sellers" },
      { status: 500 },
    );
  }
}
