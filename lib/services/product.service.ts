import type {
  Product,
  Image,
  ProductVariant,
  VehicleFitment,
  Badge,
} from "@prisma/client";
import { deleteImage, extractPublicId } from "@/lib/cloudinary";
import { ProductStatus, Prisma } from "@prisma/client";
/**
 * Product Service
 *
 * Business logic for product management:
 * - CRUD operations with soft-delete
 * - Image management with Cloudinary sync (Unified Image model)
 * - Variant tracking with stock automation
 * - Vehicle fitment support
 * - Safe delete with referential integrity checks
 */
import { prisma } from "@/lib/prisma";

// Cache for store products (5 min TTL)
let storeProductCache: {
  products: StoreProduct[];
  count: number;
  timestamp: number;
} | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid(): boolean {
  return (
    storeProductCache !== null &&
    Date.now() - storeProductCache.timestamp < CACHE_TTL
  );
}

// Types
export type ProductWithRelations = Product & {
  images: Image[];
  variants: ProductVariant[];
  fitments: VehicleFitment[];
  badge: Badge | null;
};

// Store product with limited relations (for listing pages)
export type StoreProduct = Product & {
  images: Image[];
  variants: ProductVariant[];
  badge: Badge | null;
};

// Legacy type for backward compatibility
export type ProductWithImages = ProductWithRelations;

export type CreateProductInput = {
  name: string;
  slug?: string; // Optional - auto-generated from name if not provided
  description?: string | null;
  category?: string | null;
  badgeId?: string | null;
  isActive?: boolean;
  status?: ProductStatus;
  isUniversal?: boolean; // Whether product fits all vehicles

  // Variants (at least one required)
  variants: {
    name: string; // e.g., "Default", "2GB/32GB"
    sku: string;
    price: number; // In cents
    salePrice?: number | null;
    costPrice?: number | null;
    barcode?: string | null;
    inventoryQty?: number; // Stock quantity for this variant
    lowStockAt?: number; // Low stock threshold
  }[];

  // Vehicle Fitment (optional, for non-universal products)
  fitments?: {
    make: string; // e.g., "Toyota"
    model: string; // e.g., "Corolla"
    startYear?: number | null;
    endYear?: number | null;
  }[];
};

export type UpdateProductInput = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  category?: string | null;
  badgeId?: string | null;
  isActive?: boolean;
  isArchived?: boolean;
  status?: ProductStatus;
  isUniversal?: boolean;

  // Variants array — safe upsert strategy:
  //   • If a variant has an `id`  → UPDATE it in place (preserves FK to OrderItems).
  //   • If a variant has no `id`  → CREATE it as a new variant.
  //   • Variants in DB but NOT in this list → DELETE only if not referenced by orders.
  variants?: {
    id?: string; // Present = existing variant, absent = new variant
    name: string;
    sku: string;
    price: number;
    salePrice?: number | null;
    costPrice?: number | null;
    barcode?: string | null;
    inventoryQty?: number;
    lowStockAt?: number;
  }[];

  // Fitments array - will replace existing fitments
  fitments?: {
    make: string;
    model: string;
    startYear?: number | null;
    endYear?: number | null;
  }[];

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

// Helper to build a Prisma where object from StoreFilters
function buildStoreWhere(filters: StoreFilters = {}): Prisma.ProductWhereInput {
  const { q, categories, tags, min, max } = filters;
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    isArchived: false,
  };

  if (q && q.trim()) {
    where.OR = [
      { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
      { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
    ];
  }

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

  if (tags && tags.length > 0) {
    where.badgeId = { in: tags };
  }

  // Price range filters (now searching in variants)
  if (min !== undefined || max !== undefined) {
    const minCents = min !== undefined ? Math.round(min * 100) : undefined;
    const maxCents = max !== undefined ? Math.round(max * 100) : undefined;

    where.variants = {
      some: {
        ...(minCents !== undefined && {
          OR: [
            { salePrice: { gte: minCents } },
            { salePrice: null, price: { gte: minCents } },
          ],
        }),
        ...(maxCents !== undefined && {
          OR: [
            { salePrice: { lte: maxCents } },
            { salePrice: null, price: { lte: maxCents } },
          ],
        }),
      },
    };
  }

  return where;
}

export async function getStoreProducts(filters: StoreFilters = {}) {
  const { sort, limit, offset } = filters;
  const where: Prisma.ProductWhereInput = buildStoreWhere(filters);

  // Sorting (now uses variants for price sorting)
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price-low" || sort === "price-high") {
    // Note: Sorting by variant price requires aggregation
    // For simplicity, we'll sort by the first variant's price
    orderBy = { createdAt: "desc" }; // Fallback for now
  }
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
      variants: {
        orderBy: { createdAt: "asc" }, // First variant is the default
        take: 1, // Only need the first/default variant for listing
      },
      badge: true,
    },
  });

  return products;
}

// returns both list and total count according to filters (ignores limit/offset for count)
export async function getStoreProductsWithCount(
  filters: StoreFilters = {},
): Promise<{ products: StoreProduct[]; count: number }> {
  // Skip cache for filtered queries or with pagination
  const hasFilters =
    filters.q ||
    filters.categories ||
    filters.tags ||
    filters.min ||
    filters.max ||
    filters.sort;
  const hasPagination = filters.offset && filters.offset > 0;

  if (!hasFilters && !hasPagination && isCacheValid()) {
    return storeProductCache!;
  }

  const { limit, offset, sort } = filters;
  const where = buildStoreWhere(filters);

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };

  const [products, count] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
          orderBy: { sortOrder: "asc" },
        },
        variants: { orderBy: { createdAt: "asc" }, take: 1 },
        badge: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  const result = { products, count };

  // Cache only initial page load without filters
  if (!hasFilters && !hasPagination) {
    storeProductCache = { ...result, timestamp: Date.now() };
  }

  return result;
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
      {
        variants: { some: { sku: { contains: search, mode: "insensitive" } } },
      },
      {
        variants: {
          some: { barcode: { contains: search, mode: "insensitive" } },
        },
      },
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

  // Low stock filter - requires checking variants
  if (lowStock) {
    where.variants = {
      some: {
        inventoryQty: {
          lte: 10, // Using default low stock threshold
        },
      },
    };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
      variants: true,
      fitments: true,
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
): Promise<ProductWithRelations | null> {
  return prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      fitments: true,
      badge: true,
    },
  });
}

/**
 * Determine product status based on stock level
 */
function determineStatusFromStock(
  totalStock: number,
  currentStatus?: ProductStatus,
): ProductStatus {
  if (totalStock <= 0) {
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
 * Create a new product with variants and fitments
 */
export async function createProduct(
  input: CreateProductInput,
): Promise<ProductWithRelations> {
  const {
    slug,
    variants = [],
    fitments = [],
    status,
    isUniversal = true,
    ...productData
  } = input;

  // Validate: at least one variant required
  if (variants.length === 0) {
    throw new Error("At least one product variant is required");
  }

  // Calculate total stock from all variants
  const totalStock = variants.reduce(
    (sum, v) => sum + (v.inventoryQty ?? 0),
    0,
  );

  // Auto-determine status based on stock
  const productStatus = determineStatusFromStock(totalStock, status);

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
      status: productStatus,
      isUniversal,
      variants: {
        create: variants.map((variant) => ({
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          salePrice: variant.salePrice ?? null,
          costPrice: variant.costPrice ?? null,
          barcode: variant.barcode ?? null,
          inventoryQty: variant.inventoryQty ?? 0,
          lowStockAt: variant.lowStockAt ?? 5,
        })),
      },
      fitments: {
        create: fitments.map((fitment) => ({
          make: fitment.make,
          model: fitment.model,
          startYear: fitment.startYear ?? null,
          endYear: fitment.endYear ?? null,
        })),
      },
    },
    include: {
      images: true,
      variants: true,
      fitments: true,
      badge: true,
    },
  });
}

/**
 * Update a product with image sync, variant sync, and fitment sync
 *
 * Uses Fetch-Then-Clean strategy for safe deletion:
 * 1. FETCH: Get current state (product + images + variants) from database
 * 2. DIFF & CLEAN: Compare old/new data, delete removed items from Cloudinary/DB
 * 3. COMMIT: Update database with nested writes (atomic operation)
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<ProductWithRelations> {
  const {
    variants,
    fitments,
    keepImagePublicIds,
    status,
    isArchived,
    isUniversal,
    ...productData
  } = input;

  // ==========================================================================
  // STEP 1: FETCH FIRST - Get current product state
  // ==========================================================================
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      variants: true,
      fitments: true,
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
  if (publicIdsToDelete.length > 0) {
    const cloudinaryDeletePromises = publicIdsToDelete
      .filter((publicId): publicId is string => Boolean(publicId))
      .map((publicId) => deleteImage(publicId));

    await Promise.allSettled(cloudinaryDeletePromises);
  }

  // ==========================================================================
  // STEP 3: COMMIT - Update database with nested writes (atomic)
  // ==========================================================================

  // Calculate total stock from variants if provided
  let newStatus = status;
  if (variants && variants.length > 0) {
    const totalStock = variants.reduce(
      (sum, v) => sum + (v.inventoryQty ?? 0),
      0,
    );
    newStatus = determineStatusFromStock(
      totalStock,
      status ?? existingProduct.status,
    );
  }

  // Build update data
  const updateData: Prisma.ProductUpdateInput = {
    ...productData,
    ...(newStatus !== undefined && { status: newStatus }),
    ...(isArchived !== undefined && { isArchived }),
    ...(isUniversal !== undefined && { isUniversal }),
  };

  // Add nested image deletions if needed
  if (publicIdsToDelete.length > 0) {
    updateData.images = {
      deleteMany: {
        publicId: {
          in: publicIdsToDelete,
        },
      },
    };
  }

  // Sync variants — safe upsert/selective-delete strategy
  if (variants !== undefined) {
    // IDs of incoming variants that already exist in the DB
    const incomingIds = variants
      .map((v) => v.id)
      .filter((id): id is string => Boolean(id));

    // Step 1: Delete variants that were removed from the form
    // ONLY delete variants NOT referenced by any OrderItem (FK safety).
    // We try to delete; if a FK violation occurs we skip silently so that
    // historical order records are never broken.
    const variantsToMaybeDelete = existingProduct.variants.filter(
      (ev) => !incomingIds.includes(ev.id),
    );

    for (const variant of variantsToMaybeDelete) {
      try {
        await prisma.productVariant.delete({ where: { id: variant.id } });
      } catch {
        // FK constraint — variant is referenced by an OrderItem; keep it.
        console.warn(
          `Skipped deleting variant ${variant.id} — referenced by existing orders.`,
        );
      }
    }

    // Step 2: Upsert each incoming variant
    for (const variant of variants) {
      if (variant.id) {
        // EXISTING variant — update in place
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            salePrice: variant.salePrice ?? null,
            costPrice: variant.costPrice ?? null,
            barcode: variant.barcode ?? null,
            inventoryQty: variant.inventoryQty ?? 0,
            lowStockAt: variant.lowStockAt ?? 5,
          },
        });
      } else {
        // NEW variant — create it
        await prisma.productVariant.create({
          data: {
            productId: id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            salePrice: variant.salePrice ?? null,
            costPrice: variant.costPrice ?? null,
            barcode: variant.barcode ?? null,
            inventoryQty: variant.inventoryQty ?? 0,
            lowStockAt: variant.lowStockAt ?? 5,
          },
        });
      }
    }
  }

  // Sync fitments (delete all and recreate)
  if (fitments !== undefined) {
    updateData.fitments = {
      deleteMany: {}, // Delete all existing fitments
      create: fitments.map((fitment) => ({
        make: fitment.make,
        model: fitment.model,
        startYear: fitment.startYear ?? null,
        endYear: fitment.endYear ?? null,
      })),
    };
  }

  // Update product with all nested operations (atomic transaction)
  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      fitments: true,
      badge: true,
    },
  });

  return product;
}

/**
 * Soft delete a product (set isActive = false)
 */
export async function deactivateProduct(
  id: string,
): Promise<ProductWithRelations> {
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
    include: {
      images: true,
      variants: true,
      fitments: true,
      badge: true,
    },
  });
}

/**
 * Archive a product (soft delete - keeps data but hides from active views)
 */
export async function archiveProduct(
  id: string,
): Promise<ProductWithRelations> {
  return prisma.product.update({
    where: { id },
    data: {
      isArchived: true,
      status: ProductStatus.ARCHIVED,
      isActive: false,
    },
    include: {
      images: true,
      variants: true,
      fitments: true,
      badge: true,
    },
  });
}

/**
 * Unarchive a product
 */
export async function unarchiveProduct(
  id: string,
): Promise<ProductWithRelations> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  // Determine status based on total stock from all variants
  const totalStock =
    product?.variants.reduce((sum, v) => sum + v.inventoryQty, 0) ?? 0;
  const newStatus = determineStatusFromStock(totalStock);

  return prisma.product.update({
    where: { id },
    data: {
      isArchived: false,
      status: newStatus,
      isActive: true,
    },
    include: {
      images: true,
      variants: true,
      fitments: true,
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
  // Check if any variants of this product are referenced in orders
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!product) {
    return { canDelete: false, orderCount: 0 };
  }

  const variantIds = product.variants.map((v) => v.id);
  const orderCount = await prisma.orderItem.count({
    where: { variantId: { in: variantIds } },
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
 * Get low stock products (based on variants)
 */
export async function getLowStockProducts() {
  return prisma.product.findMany({
    where: {
      isActive: true,
      variants: {
        some: {
          inventoryQty: { lte: 10 },
        },
      },
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: {
        where: {
          inventoryQty: { lte: 10 },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
}

/**
 * Update variant stock
 */
export async function updateVariantStock(
  variantId: string,
  quantity: number,
  operation: "set" | "increment" | "decrement" = "set",
): Promise<void> {
  let newQuantity: number;

  if (operation === "set") {
    const result = await prisma.productVariant.update({
      where: { id: variantId },
      data: { inventoryQty: quantity },
    });
    newQuantity = result.inventoryQty;
  } else if (operation === "increment") {
    const result = await prisma.productVariant.update({
      where: { id: variantId },
      data: { inventoryQty: { increment: quantity } },
    });
    newQuantity = result.inventoryQty;
  } else if (operation === "decrement") {
    const result = await prisma.productVariant.update({
      where: { id: variantId },
      data: { inventoryQty: { decrement: quantity } },
    });
    newQuantity = result.inventoryQty;
  } else {
    return;
  }

  // Auto-update product status based on total stock across all variants
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { include: { variants: true } } },
  });

  if (variant) {
    const totalStock = variant.product.variants.reduce(
      (sum, v) => sum + v.inventoryQty,
      0,
    );
    const newStatus = determineStatusFromStock(
      totalStock,
      variant.product.status,
    );

    if (newStatus !== variant.product.status) {
      await prisma.product.update({
        where: { id: variant.productId },
        data: { status: newStatus },
      });
    }
  }
}

// Backward compatibility: Update stock for a product's default variant
export async function updateStock(
  productId: string,
  quantity: number,
  operation: "set" | "increment" | "decrement" = "set",
): Promise<void> {
  // Get the first (default) variant
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: { take: 1, orderBy: { createdAt: "asc" } } },
  });

  if (!product || product.variants.length === 0) {
    throw new Error("Product or default variant not found");
  }

  await updateVariantStock(product.variants[0].id, quantity, operation);
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
 * Bulk update stock for multiple variants (rebalance)
 * Automatically updates product status based on new stock levels
 * Note: item.id should be variantId, not productId
 */
export async function rebalanceStock(
  items: StockRebalanceItem[],
): Promise<StockRebalanceResult> {
  const errors: string[] = [];
  let updatedCount = 0;

  for (const item of items) {
    try {
      await updateVariantStock(item.id, item.newStock, "set");
      updatedCount++;
    } catch (error) {
      errors.push(
        `Variant ${item.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
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
      variants: {
        select: {
          id: true,
          name: true,
          sku: true,
          inventoryQty: true,
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
 * - available: Current warehouse quantity (sum of all variants)
 * - reserved: Sum of quantities in open orders (NEW, CONFIRMED, PROCESSING)
 * - sold: Sum of quantities in delivered orders
 */
export async function getProductStockDetails(productId: string) {
  // Get warehouse stock from all variants
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      variants: {
        select: { id: true, inventoryQty: true },
      },
    },
  });

  const available =
    product?.variants.reduce((sum, v) => sum + v.inventoryQty, 0) ?? 0;
  const variantIds = product?.variants.map((v) => v.id) ?? [];

  // Get reserved stock (orders in progress)
  const reservedResult = await prisma.orderItem.aggregate({
    where: {
      variantId: { in: variantIds },
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
      variantId: { in: variantIds },
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
