import type { Product, Image, Inventory, Badge } from "@prisma/client";
import { deleteImage, extractPublicId } from "@/lib/cloudinary";
import { ProductStatus, Prisma } from "@prisma/client";
/**
 * Product Service
 *
 * Business logic for product management:
 * - CRUD operations with soft-delete
 * - Image management with Cloudinary sync (Unified Image model)
 * - Inventory tracking with stock automation
 * - Safe delete with referential integrity checks
 */
import { prisma } from "@/lib/prisma";

// Types
export type ProductWithImages = Product & {
  images: Image[];
  inventory: Inventory | null;
  badge: Badge | null;
};

export type CreateProductInput = {
  name: string;
  slug?: string; // Optional - auto-generated from name if not provided
  sku: string; // Required - unique product identifier
  description?: string | null;
  price: number; // In cents
  salePrice?: number | null; // Discounted price in cents
  costPrice?: number | null; // Cost price for margin tracking
  barcode?: string | null; // Optional barcode for scanning
  category?: string | null;
  badgeId?: string | null;
  isActive?: boolean;
  status?: ProductStatus;
  stock?: number; // Alias for initialStock
  initialStock?: number;
  lowStockThreshold?: number; // Alias for lowStockAt
  lowStockAt?: number;
};

export type UpdateProductInput = Partial<CreateProductInput> & {
  id?: string;
  isActive?: boolean;
  isArchived?: boolean;
  // For image sync - array of publicIds to keep
  keepImagePublicIds?: string[];
};

export type ProductFilters = {
  search?: string;
  category?: string;
  isActive?: boolean;
  isArchived?: boolean;
  status?: ProductStatus;
  lowStock?: boolean;
};

export type PaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// New E-commerce filter types
export type StoreFilters = {
  q?: string; // Search query
  categories?: string[]; // Array of category names
  tags?: string[]; // Array of badge IDs
  min?: number; // Min price in dollars
  max?: number; // Max price in dollars
  sort?: string; // Sorting option
  limit?: number; // Number of items to take
  offset?: number; // Number of items to skip
};

/**
 * Get top 3 most popular tags (badges) based on product usage
 */
export async function getTopTags(limit: number = 3) {
  const badges = await prisma.badge.findMany({
    where: {
      products: {
        some: {
          isActive: true,
          isArchived: false,
        },
      },
    },
    include: {
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
              isArchived: false,
            },
          },
        },
      },
    },
    orderBy: {
      products: {
        _count: "desc",
      },
    },
    take: limit,
  });

  return badges.map((badge) => ({
    id: badge.id,
    name: badge.name,
    color: badge.color,
    usageCount: badge._count.products,
  }));
}

/**
 * Advanced product filtering for e-commerce storefront
 * Supports: search, multi-category, multi-tag, price range, sorting
 */
export async function getStoreProducts(filters: StoreFilters = {}) {
  const { q, categories, tags, min, max, sort, limit, offset } = filters;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    isArchived: false,
  };

  // Search: name OR description
  if (q && q.trim()) {
    where.OR = [
      { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
      { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
    ];
  }

  // Multi-category filtering
  if (categories && categories.length > 0) {
    if (categories.length === 1) {
      where.category = {
        contains: categories[0],
        mode: Prisma.QueryMode.insensitive,
      };
    } else {
      where.OR = [
        ...(where.OR || []),
        ...categories.map((cat) => ({
          category: { contains: cat, mode: Prisma.QueryMode.insensitive },
        })),
      ];
    }
  }

  // Multi-tag filtering (badgeId)
  if (tags && tags.length > 0) {
    where.badgeId = { in: tags };
  }

  // Price range (convert dollars to cents)
  // Price range (convert dollars to cents)
  // Use effective price: salePrice if present, otherwise price
  const priceFilters: Prisma.ProductWhereInput[] = [];
  if (min !== undefined) {
    const minCents = Math.round(min * 100);
    priceFilters.push({
      OR: [
        { salePrice: { gte: minCents } },
        { salePrice: null, price: { gte: minCents } },
      ],
    });
  }
  if (max !== undefined) {
    const maxCents = Math.round(max * 100);
    priceFilters.push({
      OR: [
        { salePrice: { lte: maxCents } },
        { salePrice: null, price: { lte: maxCents } },
      ],
    });
  }

  if (priceFilters.length > 0) {
    const existingAnd: Prisma.ProductWhereInput[] = Array.isArray(where.AND)
      ? (where.AND as Prisma.ProductWhereInput[])
      : where.AND
        ? [where.AND as Prisma.ProductWhereInput]
        : [];

    where.AND = [...existingAnd, ...priceFilters];
  }

  // Sorting
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price-low") orderBy = { price: "asc" };
  if (sort === "price-high") orderBy = { price: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: limit,
    skip: offset,
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
      badge: true,
    },
  });

  return products;
}

/**
 * Get paginated list of products
 */
export async function getProducts(
  filters: ProductFilters = {},
  pagination: PaginationOptions = {},
) {
  const { search, category, isActive, isArchived, status, lowStock } = filters;
  const {
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = pagination;

  const where: Prisma.ProductWhereInput = {};

  // By default, exclude archived products unless explicitly requested
  if (typeof isArchived === "boolean") {
    where.isArchived = isArchived;
  } else {
    where.isArchived = false;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  if (status) {
    where.status = status;
  }

  // Low stock filter - requires subquery
  if (lowStock) {
    where.inventory = {
      quantity: {
        lte: prisma.inventory.fields.lowStockAt,
      },
    };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
      inventory: true,
      badge: true,
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });
  const total = await prisma.product.count({ where });

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single product by ID or slug
 */
export async function getProduct(
  idOrSlug: string,
): Promise<ProductWithImages | null> {
  return prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      inventory: true,
      badge: true,
    },
  });
}

/**
 * Determine product status based on stock level
 */
function determineStatusFromStock(
  quantity: number,
  currentStatus?: ProductStatus,
): ProductStatus {
  if (quantity <= 0) {
    return ProductStatus.OUT_OF_STOCK;
  }
  // If stock > 0 and was OUT_OF_STOCK, switch to ACTIVE
  if (currentStatus === ProductStatus.OUT_OF_STOCK) {
    return ProductStatus.ACTIVE;
  }
  // Keep current status if set, otherwise ACTIVE
  return currentStatus || ProductStatus.ACTIVE;
}

/**
 * Create a new product with inventory
 */
export async function createProduct(
  input: CreateProductInput,
): Promise<ProductWithImages> {
  const {
    initialStock,
    stock,
    lowStockAt,
    lowStockThreshold,
    slug,
    salePrice,
    costPrice,
    status,
    ...productData
  } = input;

  // Use stock or initialStock (validation uses stock, service historically used initialStock)
  const quantity = stock ?? initialStock ?? 0;
  const lowStockLevel = lowStockThreshold ?? lowStockAt ?? 10;

  // Auto-determine status based on stock
  const productStatus = determineStatusFromStock(quantity, status);

  // Auto-generate slug from name if not provided
  const productSlug =
    slug ||
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return prisma.product.create({
    data: {
      ...productData,
      slug: productSlug,
      salePrice: salePrice ?? null,
      costPrice: costPrice ?? null,
      status: productStatus,
      inventory: {
        create: {
          quantity,
          lowStockAt: lowStockLevel,
        },
      },
    },
    include: {
      images: true,
      inventory: true,
      badge: true,
    },
  });
}

/**
 * Update a product with image sync and stock automation
 *
 * Uses Fetch-Then-Clean strategy for safe image deletion:
 * 1. FETCH: Get current state (product + images) from database
 * 2. DIFF & CLEAN: Compare old/new images, delete removed ones from Cloudinary
 * 3. COMMIT: Update database with nested writes (atomic operation)
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<ProductWithImages> {
  const {
    initialStock,
    stock,
    lowStockAt,
    lowStockThreshold,
    // id from input intentionally ignored
    keepImagePublicIds,
    salePrice,
    costPrice,
    status,
    isArchived,
    ...productData
  } = input;

  // Use stock or initialStock
  const quantity = stock ?? initialStock;
  const lowStockLevel = lowStockThreshold ?? lowStockAt;

  // ==========================================================================
  // STEP 1: FETCH FIRST - Get current product state including all images
  // ==========================================================================
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      inventory: true,
    },
  });

  if (!existingProduct) {
    throw new Error(`Product not found: ${id}`);
  }

  // ==========================================================================
  // STEP 2: DIFF & CLEAN - Compare images and delete removed ones from Cloudinary
  // ==========================================================================
  const existingPublicIds = existingProduct.images.map((img) => img.publicId);
  const publicIdsToDelete: string[] = [];

  // If keepImagePublicIds is provided, calculate which images were removed
  if (keepImagePublicIds !== undefined) {
    for (const existingId of existingPublicIds) {
      if (!keepImagePublicIds.includes(existingId)) {
        publicIdsToDelete.push(existingId);
      }
    }
  }

  // Delete removed images from Cloudinary BEFORE touching the database
  // Using Promise.allSettled for soft-fail (log errors, don't crash)
  if (publicIdsToDelete.length > 0) {
    const cloudinaryDeletePromises = publicIdsToDelete
      .filter((publicId): publicId is string => Boolean(publicId))
      .map((publicId) => deleteImage(publicId));

    await Promise.allSettled(cloudinaryDeletePromises);
  }

  // ==========================================================================
  // STEP 3: COMMIT LAST - Update database with nested writes (atomic)
  // ==========================================================================

  // Determine new status based on stock automation
  let newStatus = status;
  if (quantity !== undefined) {
    newStatus = determineStatusFromStock(
      quantity,
      status ?? existingProduct.status,
    );
  }

  // Build update data
  const updateData: Prisma.ProductUpdateInput = {
    ...productData,
    ...(salePrice !== undefined && { salePrice }),
    ...(costPrice !== undefined && { costPrice }),
    ...(newStatus !== undefined && { status: newStatus }),
    ...(isArchived !== undefined && { isArchived }),
  };

  // Add nested image operations if we need to delete images
  if (publicIdsToDelete.length > 0) {
    updateData.images = {
      deleteMany: {
        publicId: {
          in: publicIdsToDelete,
        },
      },
    };
  }

  // Update product with nested image deletions (atomic transaction)
  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      inventory: true,
      badge: true,
    },
  });

  // Update inventory if provided
  if (quantity !== undefined || lowStockLevel !== undefined) {
    await prisma.inventory.upsert({
      where: { productId: id },
      update: {
        ...(quantity !== undefined && { quantity }),
        ...(lowStockLevel !== undefined && { lowStockAt: lowStockLevel }),
      },
      create: {
        productId: id,
        quantity: quantity || 0,
        lowStockAt: lowStockLevel || 10,
      },
    });
  }

  return product;
}

/**
 * Soft delete a product (set isActive = false)
 */
export async function deactivateProduct(
  id: string,
): Promise<ProductWithImages> {
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
    include: {
      images: true,
      inventory: true,
      badge: true,
    },
  });
}

/**
 * Archive a product (soft delete - keeps data but hides from active views)
 */
export async function archiveProduct(id: string): Promise<ProductWithImages> {
  return prisma.product.update({
    where: { id },
    data: {
      isArchived: true,
      status: ProductStatus.ARCHIVED,
      isActive: false,
    },
    include: {
      images: true,
      inventory: true,
      badge: true,
    },
  });
}

/**
 * Unarchive a product
 */
export async function unarchiveProduct(id: string): Promise<ProductWithImages> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { inventory: true },
  });

  // Determine status based on stock
  const quantity = product?.inventory?.quantity ?? 0;
  const newStatus = determineStatusFromStock(quantity);

  return prisma.product.update({
    where: { id },
    data: {
      isArchived: false,
      status: newStatus,
      isActive: true,
    },
    include: {
      images: true,
      inventory: true,
      badge: true,
    },
  });
}

export type DeleteProductResult = {
  success: boolean;
  deleted?: boolean;
  reason?: string;
  orderCount?: number;
};

/**
 * Check if a product can be safely deleted (no order history)
 */
export async function canDeleteProduct(id: string): Promise<{
  canDelete: boolean;
  orderCount: number;
}> {
  const orderCount = await prisma.orderItem.count({
    where: { productId: id },
  });

  return {
    canDelete: orderCount === 0,
    orderCount,
  };
}

/**
 * Hard delete a product with referential integrity check
 * Will fail if product has order history - must archive instead
 * Uses Fetch-Then-Clean strategy for Cloudinary cleanup
 */
export async function deleteProduct(id: string): Promise<DeleteProductResult> {
  // Step 1: Check for order history
  const { canDelete, orderCount } = await canDeleteProduct(id);

  if (!canDelete) {
    return {
      success: false,
      deleted: false,
      reason: `Cannot delete product with ${orderCount} order(s). Archive it instead.`,
      orderCount,
    };
  }

  // Step 2: Fetch product with images for Cloudinary cleanup
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!product) {
    return {
      success: false,
      deleted: false,
      reason: "Product not found",
    };
  }

  // Step 3: Delete ALL images from Cloudinary (soft-fail with Promise.allSettled)
  if (product.images.length > 0) {
    const deletePromises = product.images
      .map((img) => img.publicId ?? extractPublicId(img.secureUrl))
      .filter((publicId): publicId is string => Boolean(publicId))
      .map((publicId) => deleteImage(publicId));

    await Promise.allSettled(deletePromises);
  }

  // Step 4: Delete from database (Prisma cascades to Image rows via onDelete: Cascade)
  await prisma.product.delete({ where: { id } });

  return {
    success: true,
    deleted: true,
  };
}

/**
 * Bulk archive products
 */
export async function bulkArchiveProducts(
  ids: string[],
): Promise<{ success: boolean; count: number }> {
  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: {
      isArchived: true,
      status: ProductStatus.ARCHIVED,
      isActive: false,
    },
  });

  return {
    success: true,
    count: result.count,
  };
}

/**
 * Bulk delete products (only those without order history)
 */
export async function bulkDeleteProducts(ids: string[]): Promise<{
  success: boolean;
  deletedCount: number;
  blockedCount: number;
  blockedIds: string[];
}> {
  const results = {
    deletedCount: 0,
    blockedCount: 0,
    blockedIds: [] as string[],
  };

  for (const id of ids) {
    const deleteResult = await deleteProduct(id);
    if (deleteResult.deleted) {
      results.deletedCount++;
    } else {
      results.blockedCount++;
      results.blockedIds.push(id);
    }
  }

  return {
    success: true,
    ...results,
  };
}

/**
 * Get all unique categories
 */
export async function getCategories(): Promise<string[]> {
  const categories = await prisma.product.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });

  return categories
    .map((p) => p.category)
    .filter((c): c is string => c !== null);
}

/**
 * Get low stock products
 */
export async function getLowStockProducts() {
  return prisma.product.findMany({
    where: {
      isActive: true,
      inventory: {
        quantity: {
          lte: prisma.inventory.fields.lowStockAt,
        },
      },
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      inventory: true,
    },
    orderBy: {
      inventory: { quantity: "asc" },
    },
    take: 10,
  });
}

/**
 * Update product stock
 */
export async function updateStock(
  productId: string,
  quantity: number,
  operation: "set" | "increment" | "decrement" = "set",
): Promise<void> {
  let newQuantity: number;

  if (operation === "set") {
    await prisma.inventory.upsert({
      where: { productId },
      update: { quantity },
      create: { productId, quantity },
    });
    newQuantity = quantity;
  } else if (operation === "increment") {
    const result = await prisma.inventory.update({
      where: { productId },
      data: { quantity: { increment: quantity } },
    });
    newQuantity = result.quantity;
  } else if (operation === "decrement") {
    const result = await prisma.inventory.update({
      where: { productId },
      data: { quantity: { decrement: quantity } },
    });
    newQuantity = result.quantity;
  } else {
    return;
  }

  // Auto-update product status based on new stock level
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { status: true },
  });

  if (product) {
    const newStatus = determineStatusFromStock(newQuantity, product.status);
    if (newStatus !== product.status) {
      await prisma.product.update({
        where: { id: productId },
        data: { status: newStatus },
      });
    }
  }
}

export type StockRebalanceItem = {
  id: string;
  newStock: number;
};

export type StockRebalanceResult = {
  success: boolean;
  updatedCount: number;
  errors: string[];
};

/**
 * Bulk update stock for multiple products (rebalance)
 * Automatically updates product status based on new stock levels
 */
export async function rebalanceStock(
  items: StockRebalanceItem[],
): Promise<StockRebalanceResult> {
  const errors: string[] = [];
  let updatedCount = 0;

  for (const item of items) {
    try {
      // Update inventory
      await prisma.inventory.upsert({
        where: { productId: item.id },
        update: { quantity: item.newStock },
        create: {
          productId: item.id,
          quantity: item.newStock,
          lowStockAt: 10,
        },
      });

      // Get current product status
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { status: true, isArchived: true },
      });

      // Only auto-update status for non-archived products
      if (product && !product.isArchived) {
        const newStatus = determineStatusFromStock(
          item.newStock,
          product.status,
        );
        if (newStatus !== product.status) {
          await prisma.product.update({
            where: { id: item.id },
            data: { status: newStatus },
          });
        }
      }

      updatedCount++;
    } catch (error) {
      errors.push(
        `Product ${item.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return {
    success: errors.length === 0,
    updatedCount,
    errors,
  };
}

/**
 * Get all products for rebalance view (lightweight)
 */
export async function getProductsForRebalance() {
  return prisma.product.findMany({
    where: { isArchived: false },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      inventory: {
        select: {
          quantity: true,
          lowStockAt: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Generate unique slug from name
 */
export async function generateSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let slug = baseSlug;
  let counter = 1;

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Get detailed stock breakdown for a product
 * Returns:
 * - available: Current warehouse quantity (from Inventory)
 * - reserved: Sum of quantities in open orders (NEW, CONFIRMED, PROCESSING)
 * - sold: Sum of quantities in delivered orders
 */
export async function getProductStockDetails(productId: string) {
  // Get warehouse stock
  const inventory = await prisma.inventory.findUnique({
    where: { productId },
    select: { quantity: true },
  });

  const available = inventory?.quantity ?? 0;

  // Get reserved stock (orders in progress)
  const reservedResult = await prisma.orderItem.aggregate({
    where: {
      productId,
      order: {
        status: {
          in: ["NEW", "CONFIRMED", "PROCESSING"],
        },
      },
    },
    _sum: {
      quantity: true,
    },
  });

  const reserved = reservedResult._sum.quantity ?? 0;

  // Get sold stock (delivered orders)
  const soldResult = await prisma.orderItem.aggregate({
    where: {
      productId,
      order: {
        status: "DELIVERED",
      },
    },
    _sum: {
      quantity: true,
    },
  });

  const sold = soldResult._sum.quantity ?? 0;

  return {
    available,
    reserved,
    sold,
  };
}
