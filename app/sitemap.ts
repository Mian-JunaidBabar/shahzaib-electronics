import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.shahzaibelectronics.pk";

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${normalizedBaseUrl}/`,
      lastModified: new Date(),
    },
    {
      url: `${normalizedBaseUrl}/products`,
      lastModified: new Date(),
    },
    {
      url: `${normalizedBaseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${normalizedBaseUrl}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${normalizedBaseUrl}/services`,
      lastModified: new Date(),
    },
    {
      url: `${normalizedBaseUrl}/stories`,
      lastModified: new Date(),
    },
  ];

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, isArchived: false },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${normalizedBaseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map(
      (category) => ({
        url: `${normalizedBaseUrl}/products/category/${category.slug}`,
        lastModified: category.updatedAt,
      }),
    );

    return [...staticRoutes, ...productRoutes, ...categoryRoutes];
  } catch (error) {
    console.error("Failed to generate sitemap dynamic routes:", error);
    // Return static routes so /sitemap.xml still renders valid XML.
    return staticRoutes;
  }
}
