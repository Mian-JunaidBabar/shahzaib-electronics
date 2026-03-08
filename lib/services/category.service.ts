import { deleteImage } from "@/lib/cloudinary";
/**
 * Category Service
 *
 * Manages category CRUD operations and retrieval.
 */
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { unstable_cache } = require("next/cache");

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function getAvailableCategorySlug(
  baseSlug: string,
  excludeId?: string,
) {
  const normalizedBase =
    baseSlug
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "category";

  let candidate = normalizedBase;
  let suffix = 2;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return candidate;
    }

    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }
}

/**
 * Create a new category
 */
export async function createCategory(input: CategoryInput) {
  return prisma.category.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      imagePublicId: input.imagePublicId ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

/**
 * Get all categories (admin — includes inactive)
 */
async function _getCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
    },
  });
}

export function getCategories() {
  return unstable_cache(() => _getCategories(), ["categories-all"], {
    tags: ["categories:all"],
    revalidate: 120,
  })();
}

/**
 * Get active categories only (public storefront)
 */
async function _getActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
    },
  });
}

export function getActiveCategories() {
  return unstable_cache(() => _getActiveCategories(), ["categories-active"], {
    tags: ["categories:all"],
    revalidate: 120,
  })();
}

/**
 * Get category by ID
 */
export async function getCategory(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { products: true } },
    },
  });
}

/**
 * Get a category with its related products in one database trip.
 */
export async function getCategoryWithProducts(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isArchived: false, isActive: true },
        include: {
          images: true,
          variants: true,
        },
      },
      _count: { select: { products: true } },
    },
  });
}

/**
 * Update category
 */
export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>,
) {
  // If we're replacing the image, delete the old one from Cloudinary
  if (input.imageUrl !== undefined) {
    const existing = await prisma.category.findUnique({
      where: { id },
      select: { imagePublicId: true },
    });
    if (
      existing?.imagePublicId &&
      existing.imagePublicId !== input.imagePublicId
    ) {
      try {
        await deleteImage(existing.imagePublicId);
      } catch (err) {
        console.error("Failed to delete old category image:", err);
      }
    }
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.imagePublicId !== undefined && {
        imagePublicId: input.imagePublicId,
      }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

/**
 * Delete category
 *
 * Nullifies categoryId on all linked products before deleting.
 * Also removes the category image from Cloudinary if present.
 */
export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { imagePublicId: true },
  });

  // Unlink products
  await prisma.product.updateMany({
    where: { categoryId: id },
    data: { categoryId: null },
  });

  // Delete cloudinary image
  if (category?.imagePublicId) {
    try {
      await deleteImage(category.imagePublicId);
    } catch (err) {
      console.error("Failed to delete category image:", err);
    }
  }

  return prisma.category.delete({ where: { id } });
}
