import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function fetchTopSellers() {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  // 1. Group weekly sales by variant
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
    return [];
  }

  // 2. Resolve sold variant -> product and aggregate sales at product level.
  // This avoids showing stale pricing from an older sold variant when the
  // product's default/current variant pricing has changed.
  const soldVariants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: {
      id: true,
      productId: true,
    },
  });

  const productSales = new Map<string, number>();
  const variantToProduct = new Map(
    soldVariants.map((v) => [v.id, v.productId]),
  );

  for (const g of grouped) {
    const productId = variantToProduct.get(g.variantId);
    if (!productId) continue;
    productSales.set(
      productId,
      (productSales.get(productId) ?? 0) + (g._sum.quantity ?? 0),
    );
  }

  const rankedProductIds = [...productSales.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productId]) => productId);

  if (rankedProductIds.length === 0) {
    return [];
  }

  // 3. Fetch ranked products and use current display variant pricing.
  const products = await prisma.product.findMany({
    where: {
      id: { in: rankedProductIds },
      isActive: true,
      isArchived: false,
    },
    include: {
      variants: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { secureUrl: true },
      },
    },
  });

  // 4. Map back into sorted payload based on aggregated product sales ranking.
  const payload = rankedProductIds
    .map((productId) => {
      const p = products.find((prod) => prod.id === productId);
      if (!p || p.variants.length === 0) return null;

      const displayVariant =
        p.variants.find((v) => v.isDefault) ?? p.variants[0];

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: displayVariant.price,
        salePrice: displayVariant.salePrice || null,
        description: p.description,
        image: p.images?.[0]?.secureUrl ?? null,
        sold: productSales.get(productId) ?? 0,
      };
    })
    .filter(Boolean);

  return payload;
}

const getCachedTopSellers = unstable_cache(
  () => fetchTopSellers(),
  ["products:top-sellers"],
  { tags: ["products:all", "products:top-sellers"], revalidate: 30 },
);

export async function GET() {
  try {
    const data = await getCachedTopSellers();
    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch top sellers" },
      { status: 500 },
    );
  }
}
