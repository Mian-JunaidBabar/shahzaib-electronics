import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isArchived: false, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        variants: { take: 1, orderBy: { price: "asc" } },
      },
    });

    const payload = products.map((p) => {
      const defaultVariant = p.variants[0];
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: defaultVariant?.price || 0,
        description: p.description,
        image: p.images?.[0]?.secureUrl ?? null,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({ data: payload });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch latest products" },
      { status: 500 },
    );
  }
}
