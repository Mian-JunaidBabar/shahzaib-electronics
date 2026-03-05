import { deleteImage, extractPublicId } from "@/lib/cloudinary";
import type { Service, Image } from "@prisma/client";
import { Prisma } from "@prisma/client";
/**
 * Service Service
 *
 * Business logic for service management:
 * - CRUD operations for offered services
 * - Image management with Cloudinary cleanup (Unified Image model)
 * - Supports multiple images per service
 * - Public/Active service queries
 */
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Types
export type ServiceWithImages = Service & {
  images: Image[];
};

export type CreateServiceInput = {
  title: string;
  slug?: string;
  description?: string | null;
  price: number;
  duration: number;
  location?: "WORKSHOP" | "HOME" | "BOTH";
  features?: string[];
  isActive?: boolean;
  // Image data for unified Image model
  images?: Array<{ publicId: string; secureUrl: string }>;
};

export type UpdateServiceInput = Partial<CreateServiceInput> & {
  id?: string;
  // For image sync - array of publicIds to keep
  keepImagePublicIds?: string[];
};

export type ServiceFilters = {
  search?: string;
  isActive?: boolean;
};

export type ServicePaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

/**
 * Generate a unique slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Get paginated list of services
 */
export async function getServices(
  filters: ServiceFilters = {},
  pagination: ServicePaginationOptions = {},
) {
  const { search, isActive } = filters;
  const {
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = pagination;

  const where: Prisma.ServiceWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  // Build orderBy clause
  const orderBy: Prisma.ServiceOrderByWithRelationInput = {};
  const validSortFields = ["title", "price", "duration", "createdAt"];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  orderBy[sortField as keyof Prisma.ServiceOrderByWithRelationInput] =
    sortOrder;

  const services = await prisma.service.findMany({
    where,
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  });
  const total = await prisma.service.count({ where });

  return {
    services,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

/**
 * Get all active services (for public display)
 */
async function _getActiveServices() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return services;
}

/**
 * Get single service by ID
 */
export async function getService(
  id: string,
): Promise<ServiceWithImages | null> {
  return prisma.service.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

/**
 * Get single service by slug
 */
async function _getServiceBySlug(
  slug: string,
): Promise<ServiceWithImages | null> {
  return prisma.service.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

/**
 * Create a new service with optional images
 */
export async function createService(
  input: CreateServiceInput,
): Promise<ServiceWithImages> {
  const slug = input.slug || generateSlug(input.title);

  // Check for duplicate slug
  const existing = await prisma.service.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new Error(`A service with slug "${slug}" already exists`);
  }

  return prisma.service.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      price: input.price,
      duration: input.duration,
      location: input.location ?? "BOTH",
      features: input.features ?? [],
      isActive: input.isActive ?? true,
      // Create images using nested write
      images: input.images?.length
        ? {
          create: input.images.map((img, index) => ({
            publicId: img.publicId,
            secureUrl: img.secureUrl,
            isPrimary: index === 0, // First image is primary
            sortOrder: index,
          })),
        }
        : undefined,
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

/**
 * Update an existing service with Fetch-Then-Clean image strategy
 */
export async function updateService(
  id: string,
  input: UpdateServiceInput,
): Promise<ServiceWithImages> {
  // Step 1: Fetch service with current images
  const existing = await prisma.service.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!existing) {
    throw new Error("Service not found");
  }

  // Check for duplicate slug if slug is being updated
  if (input.slug && input.slug !== existing.slug) {
    const slugExists = await prisma.service.findFirst({
      where: {
        slug: input.slug,
        NOT: { id },
      },
    });

    if (slugExists) {
      throw new Error(`A service with slug "${input.slug}" already exists`);
    }
  }

  // Step 2: Handle image sync using Fetch-Then-Clean (Diff Strategy)
  if (input.keepImagePublicIds !== undefined) {
    const imagesToDelete = existing.images.filter(
      (img) => !input.keepImagePublicIds!.includes(img.publicId),
    );

    if (imagesToDelete.length > 0) {
      // Step 3: Delete from Cloudinary (soft-fail)
      const deletePromises = imagesToDelete
        .map((img) => img.publicId ?? extractPublicId(img.secureUrl))
        .filter((publicId): publicId is string => Boolean(publicId))
        .map((publicId) => deleteImage(publicId));

      await Promise.allSettled(deletePromises);

      // Step 4: Delete from database
      await prisma.image.deleteMany({
        where: {
          id: { in: imagesToDelete.map((img) => img.id) },
        },
      });
    }
  }

  // Step 5: Create new images if provided
  if (input.images?.length) {
    const existingPublicIds = existing.images.map((img) => img.publicId);
    const newImages = input.images.filter(
      (img) => !existingPublicIds.includes(img.publicId),
    );

    if (newImages.length > 0) {
      const currentMaxOrder = existing.images.reduce(
        (max, img) => Math.max(max, img.sortOrder),
        -1,
      );

      await prisma.image.createMany({
        data: newImages.map((img, index) => ({
          serviceId: id,
          publicId: img.publicId,
          secureUrl: img.secureUrl,
          isPrimary: existing.images.length === 0 && index === 0,
          sortOrder: currentMaxOrder + 1 + index,
        })),
      });
    }
  }

  // Step 6: Update service fields
  return prisma.service.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.features !== undefined && { features: input.features }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

/**
 * Delete a service with Fetch-Then-Clean for Cloudinary cleanup
 * IMPORTANT: Deletes ALL images from Cloudinary before removing DB record
 */
export async function deleteService(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  // Step 1: Fetch service with images
  const service = await prisma.service.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!service) {
    return { success: false, error: "Service not found" };
  }

  // Step 2: Delete ALL images from Cloudinary (soft-fail with Promise.allSettled)
  if (service.images.length > 0) {
    const deletePromises = service.images
      .map((img) => img.publicId ?? extractPublicId(img.secureUrl))
      .filter((publicId): publicId is string => Boolean(publicId))
      .map((publicId) => deleteImage(publicId));

    await Promise.allSettled(deletePromises);
  }

  // Step 3: Delete from database (Prisma cascades to Image rows via onDelete: Cascade)
  await prisma.service.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Toggle service active status
 */
export async function toggleServiceActive(id: string) {
  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  return prisma.service.update({
    where: { id },
    data: { isActive: !service.isActive },
  });
}

/**
 * Get service statistics
 */
export async function getServiceStats() {
  const total = await prisma.service.count();
  const active = await prisma.service.count({ where: { isActive: true } });
  const inactive = await prisma.service.count({ where: { isActive: false } });

  return { total, active, inactive };
}

// --- Cached Exports ---

export const getActiveServices = unstable_cache(
  async () => {
    return await _getActiveServices();
  },
  ["public-services-list"],
  { tags: ["services:all"], revalidate: 3600 }
);

export const getServiceBySlug = async (slug: string) => {
  return unstable_cache(
    async () => {
      return await _getServiceBySlug(slug);
    },
    [`service-detail-${slug}`],
    { tags: ["services:all", `services:${slug}`], revalidate: 3600 }
  )();
};
