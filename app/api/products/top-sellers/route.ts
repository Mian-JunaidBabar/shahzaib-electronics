import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    // 1. Group by variantId
    const grouped = await prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      where: {
        order: { createdAt: { gte: since } },
      },
      orderBy: {
        _sum: { quantity: "desc" },
      },
      take: 5,
    });

    const variantIds = grouped.map((g) => g.variantId);

    // If no sales this week, return empty early
    if (variantIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. Fetch products containing these variants in ONE query
    const products = await prisma.product.findMany({
      where: {
        variants: {
          some: { id: { in: variantIds } },
        },
        isActive: true,
        isArchived: false,
      },
      include: {
        variants: {
          where: { id: { in: variantIds } },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { secureUrl: true },
        },
      },
    });

    // 3. Map back into sorted payload based on GROUP BY order
    const payload = grouped
      .map((g) => {
        const p = products.find((prod) =>
          prod.variants.some((v) => v.id === g.variantId)
        );
        if (!p) return null;

        const v = p.variants.find((v) => v.id === g.variantId);
        if (!v) return null;

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
