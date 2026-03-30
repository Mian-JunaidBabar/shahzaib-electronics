import { getFeaturedVehicleProducts } from "@/lib/services/product.service";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

async function fetchFeaturedProducts() {
  const products = await getFeaturedVehicleProducts();

  return products.map((p) => {
    // Select the default variant (or fallback to first variant) - matching product page behavior
    const defaultVariant =
      p.variants?.find((v) => v.isDefault) ?? p.variants?.[0];

    // Return all variants with their pricing info
    const variants =
      p.variants?.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        salePrice: v.salePrice || null,
        isDefault: v.isDefault,
      })) || [];

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: defaultVariant?.price || 0,
      salePrice: defaultVariant?.salePrice || null,
      description: p.description,
      image: p.images?.[0]?.secureUrl ?? null,
      createdAt: p.createdAt,
      variantId: defaultVariant?.id || "",
      variantName: defaultVariant?.name || "Default",
      variants: variants,
    };
  });
}

const getCachedFeaturedProducts = unstable_cache(
  () => fetchFeaturedProducts(),
  ["products:featured"],
  { tags: ["products:all"], revalidate: 60 },
);

export async function GET() {
  try {
    const payload = await getCachedFeaturedProducts();
    return NextResponse.json({ data: payload });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch featured products" },
      { status: 500 },
    );
  }
}
