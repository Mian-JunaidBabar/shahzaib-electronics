import { InventoryClient } from "@/components/admin/inventory-client";
import { getAdminProducts } from "@/lib/services/product.service";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory Management | Admin",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const query = typeof sp.q === "string" ? sp.q : undefined;
  const status = typeof sp.status === "string" ? sp.status : "ALL";
  const category = typeof sp.category === "string" ? sp.category : "ALL";
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";

  // Show 30 products per page by default in the admin.
  // When a search query is provided, return all matching results on a single page.
  const { products, metadata } = await getAdminProducts({
    page,
    limit: query ? 10000 : 30,
    query,
    status,
    category,
    sort,
  });

  // Fetch all active categories from the new Category model
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  // Calculate stats for current page (can be expanded later for global stats if needed)
  const activeCount = products.filter((p) => p.isActive).length;
  const lowStockCount = products.filter((p) => {
    const defaultVariant = p.variants?.[0];
    return (
      defaultVariant &&
      defaultVariant.inventoryQty > 0 &&
      defaultVariant.inventoryQty <= defaultVariant.lowStockAt
    );
  }).length;
  const outOfStockCount = products.filter((p) => {
    const defaultVariant = p.variants?.[0];
    return defaultVariant && defaultVariant.inventoryQty === 0;
  }).length;

  const stats = {
    total: metadata.total,
    active: activeCount,
    lowStock: lowStockCount,
    outOfStock: outOfStockCount,
  };

  return (
    <InventoryClient
      initialProducts={products}
      totalPages={metadata.totalPages}
      totalCount={metadata.total}
      stats={stats}
      initialPage={page}
      initialQuery={query || ""}
      initialStatus={status}
      categories={categories}
    />
  );
}
