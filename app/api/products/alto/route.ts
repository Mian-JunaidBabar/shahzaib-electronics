import { getAltoProducts } from "@/lib/services/product.service";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";


async function fetchAltoProducts() {
  const products = await getAltoProducts();

  return products.map((p) => {
    const defaultVariant = p.variants?.[0];
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
}

const getCachedAltoProducts = unstable_cache(
  () => fetchAltoProducts(),
  ["products:alto"],
  { tags: ["products:all"], revalidate: 60 }
);

export async function GET() {
  try {
    const payload = await getCachedAltoProducts();
    return NextResponse.json({ data: payload });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch alto products" },
      { status: 500 },
    );
  }
}
