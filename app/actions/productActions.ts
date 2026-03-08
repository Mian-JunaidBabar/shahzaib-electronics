/**
 * Product Server Actions
 *
 * RBAC-protected actions for product management.
 * All actions require admin authentication.
 */

"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/services/auth.service";
import * as ProductService from "@/lib/services/product.service";
import { prisma } from "@/lib/prisma";
import {
  productCreateSchema,
  productUpdateSchema,
  productFilterSchema,
  ProductCreateInput,
  ProductUpdateInput,
  ProductFilterInput,
} from "@/lib/validations";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

/**
 * Helper: Extract user-friendly error message from Prisma errors
 */
function getPrismaErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const field = (error.meta?.target as string[])?.[0] || "field";
      const fieldLabels: Record<string, string> = {
        sku: "SKU",
        slug: "URL slug",
        barcode: "Barcode",
      };
      const label = fieldLabels[field] || field;
      return `This ${label} is already in use. Please choose another.`;
    }

    if (error.code === "P2003") {
      return "This operation references data that doesn't exist.";
    }

    if (error.code === "P2025") {
      return "The record you're trying to update or delete doesn't exist.";
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    if (error.message.includes("Unknown argument")) {
      return "Database schema mismatch detected. Please restart the server and try again.";
    }
    return "Invalid product data format sent to the database. Please review the form and try again.";
  }

  if (error instanceof Error) {
    if (error.message.includes("Unknown argument")) {
      return "Database schema mismatch detected. Please restart the server and try again.";
    }

    if (error.message.includes("ZodError")) {
      return "Some product fields are invalid. Please review the form and try again.";
    }

    return "Failed to save the product. Please check your inputs and try again.";
  }

  return "Failed to save the product. Please try again.";
}

/**
 * Get products with filters and pagination
 */
export async function getProductsAction(
  input: ProductFilterInput,
): Promise<
  ActionResult<Awaited<ReturnType<typeof ProductService.getProducts>>>
> {
  try {
    await requireAdmin();

    const validated = productFilterSchema.parse(input);
    const result = await ProductService.getProducts(validated);

    return { success: true, data: result };
  } catch (error) {
    console.error("getProductsAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch products",
    };
  }
}

/**
 * Get single product by ID
 */
export async function getProductAction(
  id: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof ProductService.getProduct>>>
> {
  try {
    await requireAdmin();

    const product = await ProductService.getProduct(id);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    return { success: true, data: product };
  } catch (error) {
    console.error("getProductAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch product",
    };
  }
}

/**
 * Create new product
 */
export async function createProductAction(
  input: ProductCreateInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const validated = productCreateSchema.parse(input);
    const product = await ProductService.createProduct(validated);

    revalidateTag(
      "products:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "categories:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "dashboard:stats",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidatePath("/admin/dashboard/products");
    revalidatePath("/products");

    return {
      success: true,
      data: { id: product.id },
      message: "Product created successfully.",
    };
  } catch (error) {
    console.error("createProductAction error:", error);
    if (error instanceof ZodError) {
      // Return structured Zod issues so the client can highlight fields
      return { success: false, error: JSON.stringify(error.issues) };
    }

    return {
      success: false,
      error: getPrismaErrorMessage(error),
    };
  }
}

/**
 * Update existing product
 */
export async function updateProductAction(
  input: ProductUpdateInput,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const validated = productUpdateSchema.parse(input);
    const { id, ...data } = validated;
    await ProductService.updateProduct(id, data);

    revalidateTag(
      "products:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "categories:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "dashboard:stats",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    if (data.slug)
      revalidateTag(
        `products:${data.slug}`,
        undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
      );

    revalidatePath("/admin/dashboard/products");
    revalidatePath(`/products/${id}`);
    revalidatePath("/products");

    return {
      success: true,
      message: "Product updated successfully.",
    };
  } catch (error) {
    console.error("updateProductAction error:", error);
    if (error instanceof ZodError) {
      return { success: false, error: JSON.stringify(error.issues) };
    }

    return {
      success: false,
      error: getPrismaErrorMessage(error),
    };
  }
}

/**
 * Toggle product active status
 */
export async function toggleProductActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await ProductService.updateProduct(id, { isActive });

    revalidateTag(
      "products:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "categories:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidatePath("/admin/dashboard/products");
    revalidatePath("/admin/dashboard/inventory");
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("toggleProductActiveAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to toggle product status",
    };
  }
}

/**
 * Deactivate product (soft delete)
 */
export async function deactivateProductAction(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await ProductService.deactivateProduct(id);

    revalidateTag(
      "products:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "categories:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );

    revalidatePath("/admin/dashboard/products");
    revalidatePath("/admin/dashboard/inventory");
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("deactivateProductAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to deactivate product",
    };
  }
}

/**
 * Archive product (soft delete with isArchived flag)
 */
export async function archiveProductAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await ProductService.archiveProduct(id);

    revalidateTag(
      "products:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "categories:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "dashboard:stats",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidatePath("/admin/dashboard/products");
    revalidatePath("/admin/dashboard/inventory");
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("archiveProductAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to archive product",
    };
  }
}

/**
 * Unarchive product
 */
export async function unarchiveProductAction(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await ProductService.unarchiveProduct(id);

    revalidateTag(
      "products:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "categories:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );

    revalidatePath("/admin/dashboard/products");
    revalidatePath("/admin/dashboard/inventory");
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("unarchiveProductAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unarchive product",
    };
  }
}

/**
 * Permanently delete product (with referential integrity check)
 * Will fail if product has order history - returns reason to archive instead
 */
export async function deleteProductAction(
  id: string,
): Promise<ActionResult<ProductService.DeleteProductResult>> {
  try {
    await requireAdmin();

    const result = await ProductService.deleteProduct(id);

    if (result.deleted) {
      revalidateTag(
        "products:all",
        undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
      );
      revalidateTag(
        "categories:all",
        undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
      );
      revalidateTag(
        "dashboard:stats",
        undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
      );
      revalidatePath("/admin/dashboard/products");
      revalidatePath("/admin/dashboard/inventory");
      revalidatePath("/products");
    }

    return {
      success: result.success,
      data: result,
      error: result.reason,
    };
  } catch (error) {
    console.error("deleteProductAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}

/**
 * Bulk archive products
 */
export async function bulkArchiveProductsAction(
  ids: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin();

    const result = await ProductService.bulkArchiveProducts(ids);

    revalidatePath("/admin/dashboard/products");
    revalidatePath("/admin/dashboard/inventory");
    revalidatePath("/products");

    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error("bulkArchiveProductsAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to archive products",
    };
  }
}

/**
 * Bulk delete products (only those without order history)
 */
export async function bulkDeleteProductsAction(ids: string[]): Promise<
  ActionResult<{
    deletedCount: number;
    blockedCount: number;
    blockedIds: string[];
  }>
> {
  try {
    await requireAdmin();

    const result = await ProductService.bulkDeleteProducts(ids);

    revalidatePath("/admin/dashboard/products");
    revalidatePath("/admin/dashboard/inventory");
    revalidatePath("/products");

    return {
      success: true,
      data: {
        deletedCount: result.deletedCount,
        blockedCount: result.blockedCount,
        blockedIds: result.blockedIds,
      },
    };
  } catch (error) {
    console.error("bulkDeleteProductsAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete products",
    };
  }
}

/**
 * Update product stock
 */
export async function updateStockAction(
  productId: string,
  quantity: number,
  operation: "set" | "increment" | "decrement",
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await ProductService.updateStock(productId, quantity, operation);

    revalidatePath("/admin/dashboard/products");
    revalidatePath("/admin/dashboard/inventory");

    return { success: true };
  } catch (error) {
    console.error("updateStockAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update stock",
    };
  }
}

/**
 * Rebalance stock for multiple products
 */
export async function rebalanceStockAction(
  items: ProductService.StockRebalanceItem[],
): Promise<ActionResult<ProductService.StockRebalanceResult>> {
  try {
    await requireAdmin();

    const result = await ProductService.rebalanceStock(items);

    revalidatePath("/admin/dashboard/products");
    revalidatePath("/admin/dashboard/inventory");

    return {
      success: result.success,
      data: result,
      error: result.errors.join(", ") || undefined,
    };
  } catch (error) {
    console.error("rebalanceStockAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to rebalance stock",
    };
  }
}

/**
 * Get products for rebalance view
 */
export async function getProductsForRebalanceAction(): Promise<
  ActionResult<
    Awaited<ReturnType<typeof ProductService.getProductsForRebalance>>
  >
> {
  try {
    await requireAdmin();

    const products = await ProductService.getProductsForRebalance();
    return { success: true, data: products };
  } catch (error) {
    console.error("getProductsForRebalanceAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch products for rebalance",
    };
  }
}

/**
 * Get product categories
 */
export async function getCategoriesAction(): Promise<ActionResult<string[]>> {
  try {
    await requireAdmin();

    const categories = await ProductService.getCategories();
    return { success: true, data: categories };
  } catch (error) {
    console.error("getCategoriesAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch categories",
    };
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProductsAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof ProductService.getLowStockProducts>>>
> {
  try {
    await requireAdmin();

    const products = await ProductService.getLowStockProducts();
    return { success: true, data: products };
  } catch (error) {
    console.error("getLowStockProductsAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch low stock products",
    };
  }
}

/**
 * Get product stock details (breakdown of available, reserved, sold)
 */
export async function getProductStockDetailsAction(
  productId: string,
): Promise<
  ActionResult<
    Awaited<ReturnType<typeof ProductService.getProductStockDetails>>
  >
> {
  try {
    await requireAdmin();

    const stockDetails = await ProductService.getProductStockDetails(productId);
    return { success: true, data: stockDetails };
  } catch (error) {
    console.error("getProductStockDetailsAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch stock details",
    };
  }
}

/**
 * Fetch more products for public store pagination
 * Note: this is a public action and does not require admin authentication.
 */
export async function fetchMoreProductsAction(
  offset: number,
  filters: ProductService.StoreFilters = {},
): Promise<
  ActionResult<Awaited<ReturnType<typeof ProductService.getStoreProducts>>>
> {
  try {
    const products = await ProductService.getStoreProducts({
      ...filters,
      offset,
      limit: filters.limit || 12, // default take to 12
    });
    return { success: true, data: products };
  } catch (error) {
    console.error("fetchMoreProductsAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch more products",
    };
  }
}

export type BulkProductUpdates = {
  categoryId?: string | null;
  tagsToAdd?: string[];
  tagsToRemove?: string[];
  badgesToAdd?: string[];
  badgesToRemove?: string[];
};

/**
 * Bulk update products with safe delta semantics.
 * - Category: set or clear
 * - Tags (implicit m2m): connectOrCreate + disconnect (safe no-op if already missing)
 * - Badges (explicit m2m): createMany skipDuplicates + deleteMany
 */
export async function bulkUpdateProductsAction(
  productIds: string[],
  updates: BulkProductUpdates,
): Promise<ActionResult<{ updatedCount: number }>> {
  try {
    await requireAdmin();

    if (!productIds || productIds.length === 0) {
      return { success: false, error: "No products selected" };
    }

    const clean = (items?: string[]) =>
      (items ?? [])
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item, index, array) => array.indexOf(item) === index);

    const tagsToAdd = clean(updates.tagsToAdd);
    const tagsToRemove = clean(updates.tagsToRemove).filter(
      (name) => !tagsToAdd.includes(name),
    );
    const badgesToAdd = clean(updates.badgesToAdd);
    const badgesToRemove = clean(updates.badgesToRemove).filter(
      (id) => !badgesToAdd.includes(id),
    );

    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      let tagsToDisconnect: { id: string }[] = [];
      if (tagsToRemove.length > 0) {
        const existingTags = await tx.tag.findMany({
          where: { name: { in: tagsToRemove } },
          select: { id: true },
        });
        tagsToDisconnect = existingTags.map((tag) => ({ id: tag.id }));
      }

      for (const productId of productIds) {
        const data: Prisma.ProductUpdateInput = {};

        if (updates.categoryId !== undefined) {
          data.categoryRelation = updates.categoryId
            ? { connect: { id: updates.categoryId } }
            : { disconnect: true };
        }

        if (tagsToAdd.length > 0 || tagsToDisconnect.length > 0) {
          data.tags = {};

          if (tagsToAdd.length > 0) {
            data.tags.connectOrCreate = tagsToAdd.map((name) => ({
              where: { name },
              create: { name },
            }));
          }

          if (tagsToDisconnect.length > 0) {
            data.tags.disconnect = tagsToDisconnect;
          }
        }

        if (Object.keys(data).length > 0) {
          await tx.product.update({ where: { id: productId }, data });
        }

        if (badgesToAdd.length > 0) {
          await tx.productBadge.createMany({
            data: badgesToAdd.map((badgeId) => ({ productId, badgeId })),
            skipDuplicates: true,
          });
        }

        if (badgesToRemove.length > 0) {
          await tx.productBadge.deleteMany({
            where: {
              productId,
              badgeId: { in: badgesToRemove },
            },
          });
        }

        updatedCount += 1;
      }
    });

    revalidatePath("/admin/dashboard/inventory");
    revalidateTag(
      "products:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "categories:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );

    return { success: true, data: { updatedCount } };
  } catch (error) {
    console.error("bulkUpdateProductsAction error:", error);
    return {
      success: false,
      error: getPrismaErrorMessage(error),
    };
  }
}
