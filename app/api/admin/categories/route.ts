import { getActiveCategories } from "@/lib/services/category.service";
import { NextResponse } from "next/server";

export async function GET() {
  const categories = await getActiveCategories();

  return NextResponse.json(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      productCount: c._count.products,
    })),
  );
}
