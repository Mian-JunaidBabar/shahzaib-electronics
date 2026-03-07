/**
 * Category Server Actions
 *
 * RBAC-protected actions for category management.
 */

"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/services/auth.service";
import * as CategoryService from "@/lib/services/category.service";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get all categories (admin)
 */
export async function getCategoriesAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof CategoryService.getCategories>>>
> {
  try {
    const categories = await CategoryService.getCategories();
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
 * Get active categories only (public)
 */
export async function getActiveCategoriesAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof CategoryService.getActiveCategories>>>
> {
  try {
    const categories = await CategoryService.getActiveCategories();
    return { success: true, data: categories };
  } catch (error) {
    console.error("getActiveCategoriesAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch active categories",
    };
  }
}

/**
 * Get single category by ID
 */
export async function getCategoryAction(
  id: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof CategoryService.getCategory>>>
> {
  try {
    const category = await CategoryService.getCategory(id);
    if (!category) {
      return { success: false, error: "Category not found" };
    }
    return { success: true, data: category };
  } catch (error) {
    console.error("getCategoryAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch category",
    };
  }
}

/**
 * Create category
 */
export async function createCategoryAction(
  input: CategoryService.CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const category = await CategoryService.createCategory(input);

    revalidatePath("/admin/dashboard/categories");
    revalidateTag(
      "categories:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "products:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );

    return { success: true, data: { id: category.id } };
  } catch (error) {
    console.error("createCategoryAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

/**
 * Update category
 */
export async function updateCategoryAction(
  id: string,
  input: Partial<CategoryService.CategoryInput>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    await CategoryService.updateCategory(id, input);

    revalidatePath("/admin/dashboard/categories");
    revalidateTag(
      "categories:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "products:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );

    return { success: true, data: { id } };
  } catch (error) {
    console.error("updateCategoryAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

/**
 * Delete category
 */
export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await CategoryService.deleteCategory(id);

    revalidatePath("/admin/dashboard/categories");
    revalidateTag(
      "categories:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );
    revalidateTag(
      "products:all",
      undefined /* eslint-disable-line @typescript-eslint/no-explicit-any */ as any,
    );

    return { success: true };
  } catch (error) {
    console.error("deleteCategoryAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}
