import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    // Group order items by variantId and sum quantities for orders in the last 7 days
    const grouped = await prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      where: { order: { createdAt: { gte: since } } },
      orderBy: { _sum: { quantity: "desc" } },
      take: 4,
    });

    const variantIds = grouped.map((g) => g.variantId);

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          where: { isArchived: false, isActive: true },
          include: { images: true },
        },
      },
    });

    // preserve order based on grouped results
    const payload = grouped
      .map((g) => {
        const v = variants.find((x) => x.id === g.variantId);
        if (!v || !v.product) return null;

        const p = v.product;
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: v.price,
          description: p.description,
          image: p.images?.[0]?.secureUrl ?? null,
          sold: g._sum.quantity ?? 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ data: payload });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch top sellers" },
      { status: 500 },
    );
  }
}
