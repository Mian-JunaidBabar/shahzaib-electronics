/**
 * Service Server Actions
 *
 * RBAC-protected actions for service management.
 * All actions require admin authentication.
 */

"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/services/auth.service";
import * as ServiceService from "@/lib/services/service.service";
import {
  serviceCreateSchema,
  serviceUpdateSchema,
  serviceFilterSchema,
  ServiceCreateInput,
  ServiceUpdateInput,
  ServiceFilterInput,
} from "@/lib/validations";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Helper: Extract user-friendly error message from Prisma errors
 */
function getPrismaErrorMessage(error: unknown): string {
  const e = error as { code?: string; meta?: { target?: string[] } };
  if (e && typeof e.code === "string") {
    if (e.code === "P2002") {
      const field = (e.meta?.target as string[])?.[0] || "field";
      const fieldLabels: Record<string, string> = {
        slug: "URL slug",
        title: "Title",
      };
      const label = fieldLabels[field] || field;
      return `This ${label} is already in use. Please choose another.`;
    }

    if (e.code === "P2003") {
      return "This operation references data that doesn't exist.";
    }

    if (e.code === "P2025") {
      return "The service you're trying to update or delete doesn't exist.";
    }
  }

  // Fallback for other errors
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Get services with filters and pagination
 */
export async function getServicesAction(
  input: ServiceFilterInput,
): Promise<
  ActionResult<Awaited<ReturnType<typeof ServiceService.getServices>>>
> {
  try {
    await requireAdmin();

    const validated = serviceFilterSchema.parse(input);
    const result = await ServiceService.getServices(validated);

    return { success: true, data: result };
  } catch (error) {
    console.error("getServicesAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch services",
    };
  }
}

/**
 * Get single service by ID
 */
export async function getServiceAction(
  id: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof ServiceService.getService>>>
> {
  try {
    await requireAdmin();

    const service = await ServiceService.getService(id);
    if (!service) {
      return { success: false, error: "Service not found" };
    }

    return { success: true, data: service };
  } catch (error) {
    console.error("getServiceAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch service",
    };
  }
}

/**
 * Create new service
 */
export async function createServiceAction(
  input: ServiceCreateInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const validated = serviceCreateSchema.parse(input);
    const service = await ServiceService.createService(validated);

    revalidateTag("services:all", undefined as any);
    revalidatePath("/admin/dashboard/services");
    revalidatePath("/services");

    return { success: true, data: { id: service.id } };
  } catch (error) {
    console.error("createServiceAction error:", error);
    return {
      success: false,
      error: getPrismaErrorMessage(error),
    };
  }
}

/**
 * Update existing service
 */
export async function updateServiceAction(
  input: ServiceUpdateInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const validated = serviceUpdateSchema.parse(input);
    const service = await ServiceService.updateService(validated.id, validated);

    revalidateTag("services:all", undefined as any);
    if (validated.slug) revalidateTag(`services:${validated.slug}`, undefined as any);
    revalidatePath("/admin/dashboard/services");
    revalidatePath("/services");

    return { success: true, data: { id: service.id } };
  } catch (error) {
    console.error("updateServiceAction error:", error);
    return {
      success: false,
      error: getPrismaErrorMessage(error),
    };
  }
}

/**
 * Delete service (includes Cloudinary cleanup)
 */
export async function deleteServiceAction(
  id: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const result = await ServiceService.deleteService(id);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidateTag("services:all", undefined as any);
    revalidatePath("/admin/dashboard/services");
    revalidatePath("/services");

    return { success: true };
  } catch (error) {
    console.error("deleteServiceAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete service",
    };
  }
}

/**
 * Toggle service active status
 */
export async function toggleServiceActiveAction(
  id: string,
): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    await requireAdmin();

    const service = await ServiceService.toggleServiceActive(id);

    revalidateTag("services:all", undefined as any);
    revalidatePath("/admin/dashboard/services");
    revalidatePath("/services");

    return { success: true, data: { isActive: service.isActive } };
  } catch (error) {
    console.error("toggleServiceActiveAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to toggle service status",
    };
  }
}

/**
 * Get service statistics
 */
export async function getServiceStatsAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof ServiceService.getServiceStats>>>
> {
  try {
    await requireAdmin();

    const stats = await ServiceService.getServiceStats();

    return { success: true, data: stats };
  } catch (error) {
    console.error("getServiceStatsAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch service stats",
    };
  }
}

// ============ Public Actions (No Admin Required) ============

/**
 * Get all active services (PUBLIC - No admin auth required)
 * Used by customers on the booking page to select services
 */
export async function getPublicServicesAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      title: string;
      slug: string;
      description: string | null;
      price: number;
      duration: number;
      location: string;
      features: string[];
    }>
  >
> {
  try {
    const services = await ServiceService.getServices(
      {
        isActive: true,
      },
      {
        sortBy: "title",
        sortOrder: "asc",
      },
    );

    // Return only the services array, not the pagination wrapper
    const servicesData = services.services.map((service) => ({
      id: service.id,
      title: service.title,
      slug: service.slug,
      description: service.description,
      price: service.price,
      duration: service.duration,
      location: service.location,
      features: service.features,
    }));

    return { success: true, data: servicesData };
  } catch (error) {
    console.error("getPublicServicesAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch services",
    };
  }
}
