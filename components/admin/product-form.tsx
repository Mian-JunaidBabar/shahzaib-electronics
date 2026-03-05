"use client";

/**
 * ProductForm
 *
 * Shared react-hook-form component used by both:
 *   - /admin/dashboard/inventory/new     (create mode, no initialData)
 *   - /admin/dashboard/inventory/[id]/edit  (edit mode, initialData hydrated from DB)
 *
 * Features:
 *  • useFieldArray for dynamic variant rows (add / remove)
 *  • useFieldArray for dynamic fitment rows with isUniversal toggle
 *  • Image upload section (new images for create; existing + new for edit)
 *  • Prices stored as PKR floats in the form, converted to cents on submit
 *  • Variant `id` field is preserved on edit so the service can UPDATE in-place
 *    instead of DELETE + CREATE (preserves OrderItem FK references)
 */

import { useEffect, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  X,
  Trash2,
  Save,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
// BadgeSelector replaced by CreatableMultiSelect for multi-badge support
import { CreatableMultiSelect } from "@/components/ui/creatable-multi-select";
import { uploadImageToCloudinary } from "@/lib/cloudinary-client";
import {
  saveProductImage,
  deleteProductImage,
} from "@/app/actions/imageActions";
import { getActiveBadgesAction } from "@/app/actions/badgeActions";
import { getAllTagsAction } from "@/app/actions/tagActions";
import {
  createProductAction,
  updateProductAction,
} from "@/app/actions/productActions";
import { toast } from "sonner";
import type { ProductWithRelations } from "@/lib/services/product.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BadgeOption {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface ExistingImage {
  id: string;
  secureUrl: string;
  publicId: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface NewImagePreview {
  file: File;
  preview: string;
}

/** Internal form shape — prices are PKR floats, variant ids preserved for edit */
type VariantFormRow = {
  /** DB id — present for existing variants (edit mode), absent for new ones */
  _id?: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  costPrice?: number | null;
  barcode?: string;
  inventoryQty: number;
  lowStockAt: number;
  isDefault: boolean;
};

type FitmentFormRow = {
  make: string;
  model: string;
  startYear?: number | null;
  endYear?: number | null;
};

type ProductFormValues = {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  badgeId?: string;
  badges?: string[];
  tags: string[]; // Array of tag names
  isActive: boolean;
  isUniversal: boolean;
  variants: VariantFormRow[];
  fitments: FitmentFormRow[];
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProductFormProps {
  /** Pass existing product data for edit mode; omit for create mode */
  initialData?: ProductWithRelations;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [isPending, startTransition] = useTransition();
  const [badges, setBadges] = useState<BadgeOption[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Image state
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    (initialData?.images ?? []).map((img) => ({
      id: img.id,
      secureUrl: img.secureUrl,
      publicId: img.publicId,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
  );
  const [newImages, setNewImages] = useState<NewImagePreview[]>([]);

  // ---------------------------------------------------------------------------
  // React Hook Form
  // ---------------------------------------------------------------------------

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: isEdit
      ? {
          name: initialData.name ?? "",
          slug: initialData.slug ?? "",
          description: initialData.description ?? "",
          category: initialData.category ?? "",
          badgeId: initialData.badgeId ?? "",
          badges: (
            initialData.badges ?? (initialData.badge ? [initialData.badge] : [])
          ).map((b) => b.name),
          tags: (initialData.tags ?? []).map((t) => t.name),
          isActive: initialData.isActive ?? true,
          isUniversal: initialData.isUniversal ?? true,
          variants: (initialData.variants ?? []).map((v) => ({
            _id: v.id, // preserve DB id for in-place update
            name: v.name,
            sku: v.sku ?? "",
            price: (v.price ?? 0) / 100,
            salePrice: v.salePrice != null ? v.salePrice / 100 : null,
            costPrice: v.costPrice != null ? v.costPrice / 100 : null,
            barcode: v.barcode ?? "",
            inventoryQty: v.inventoryQty ?? 0,
            lowStockAt: v.lowStockAt ?? 5,
            isDefault: v.isDefault ?? false,
          })),
          fitments: (initialData.fitments ?? []).map((f) => ({
            make: f.make,
            model: f.model,
            startYear: f.startYear ?? null,
            endYear: f.endYear ?? null,
          })),
        }
      : {
          name: "",
          slug: "",
          description: "",
          category: "",
          badgeId: "",
          badges: [],
          tags: [],
          isActive: true,
          isUniversal: true,
          variants: [
            {
              name: "Default",
              sku: "",
              price: 0,
              salePrice: null,
              costPrice: null,
              barcode: "",
              inventoryQty: 0,
              lowStockAt: 5,
              isDefault: true,
            },
          ],
          fitments: [],
        },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: "variants" });

  const {
    fields: fitmentFields,
    append: appendFitment,
    remove: removeFitment,
  } = useFieldArray({ control, name: "fitments" });

  const isUniversal = watch("isUniversal");
  const watchedName = watch("name");

  // Auto-generate slug from name (create mode only)
  useEffect(() => {
    if (!isEdit && watchedName) {
      const slug = watchedName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  }, [watchedName, isEdit, setValue]);

  // Load badges and tags
  useEffect(() => {
    Promise.all([getActiveBadgesAction(), getAllTagsAction()]).then(
      ([badgesResult, tagsResult]) => {
        if (badgesResult.success && badgesResult.data) {
          setBadges(badgesResult.data as BadgeOption[]);
        }
        if (tagsResult.success && tagsResult.data) {
          setTags(
            tagsResult.data.map((tag: { id: string; name: string }) => ({
              id: tag.id,
              name: tag.name,
            })),
          );
        }
      },
    );
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  // Map Zod issues returned from server to react-hook-form field errors
  function applyZodIssues(raw?: string) {
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return false;

      let firstField: string | null = null;
      parsed.forEach(
        (issue: { path: (string | number)[]; message?: string }) => {
          const path = issue.path || [];
          if (!Array.isArray(path) || path.length === 0) return;

          // Convert Zod path to RHF field name. Example: ["variants", 0, "sku"] => "variants.0.sku"
          const mapped = path.map((p) => {
            // For variant id field, our form uses `_id` instead of `id`
            if (p === "id" && path[0] === "variants") return "_id";
            return String(p);
          });
          const fieldName = mapped.join(".");
          setError(fieldName as Parameters<typeof setError>[0], {
            type: "server",
            message: issue.message,
          });
          if (!firstField) firstField = fieldName;
        },
      );

      // Set a generic top-level error if fields were handled
      if (firstField) {
        setSubmitError("Please correct the errors highlighted in the form.");
        try {
          setFocus(firstField as Parameters<typeof setFocus>[0]);
        } catch {
          // ignore focus errors
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  const onSubmit = (data: ProductFormValues) => {
    setSubmitError(null);
    startTransition(async () => {
      try {
        const variantsPayload = data.variants.map((v) => ({
          id: v._id || undefined, // undefined for new variants → service will CREATE
          name: v.name,
          sku: v.sku,
          price: Math.round(Number(v.price) * 100),
          salePrice: v.salePrice ? Math.round(Number(v.salePrice) * 100) : null,
          costPrice: v.costPrice ? Math.round(Number(v.costPrice) * 100) : null,
          barcode: v.barcode || null,
          inventoryQty: Number(v.inventoryQty),
          lowStockAt: Number(v.lowStockAt),
          isDefault: v.isDefault,
        }));

        let productId: string;

        if (isEdit) {
          const result = await updateProductAction({
            id: initialData.id,
            name: data.name,
            slug: data.slug || undefined,
            description: data.description || undefined,
            category: data.category || undefined,
            badgeId: data.badgeId || undefined,
            badges: data.badges,
            tags: data.tags,
            isActive: data.isActive,
            isUniversal: data.isUniversal,
            variants: variantsPayload,
            fitments: data.isUniversal ? [] : data.fitments,
            keepImagePublicIds: existingImages.map((img) => img.publicId),
          });

          if (!result.success) {
            // If server returned structured Zod issues, map them to form fields
            const handled = applyZodIssues(result.error);
            const friendlyError = parseErrorMessage(result.error);
            if (!handled) {
              setSubmitError(friendlyError);
              toast.error(friendlyError);
            }
            return;
          }
          productId = initialData.id;
          toast.success("Product updated");
        } else {
          const result = await createProductAction({
            name: data.name,
            slug: data.slug || undefined,
            description: data.description || undefined,
            category: data.category || undefined,
            badgeId: data.badgeId || undefined,
            badges: data.badges,
            tags: data.tags,
            isActive: data.isActive,
            isUniversal: data.isUniversal,
            variants: variantsPayload,
            fitments: data.isUniversal ? [] : data.fitments,
          });

          if (!result.success || !result.data) {
            const handled = applyZodIssues(result.error);
            const friendlyError = parseErrorMessage(result.error);
            if (!handled) {
              setSubmitError(friendlyError);
              toast.error(friendlyError);
            }
            return;
          }
          productId = result.data.id;
        }

        // Upload new images
        if (newImages.length > 0) {
          try {
            const uploadPromises = newImages.map((img, i) =>
              uploadImageToCloudinary(img.file).then((upload) =>
                saveProductImage({
                  productId,
                  secureUrl: upload.secure_url,
                  publicId: upload.public_id,
                  isPrimary: existingImages.length === 0 && i === 0,
                  sortOrder: existingImages.length + i,
                }),
              ),
            );
            const results = await Promise.all(uploadPromises);
            const failed = results.filter((r) => !r.success).length;
            if (failed > 0) {
              toast.warning(`${failed} image(s) failed to upload`);
            }
          } catch (err) {
            console.error("Image upload error:", err);
            toast.warning("Product saved but some images failed to upload");
          }
        }

        if (!isEdit) {
          toast.success("Product created");
        }

        router.push(`/admin/dashboard/inventory/${productId}`);
      } catch (error) {
        console.error("ProductForm submit error:", error);
        const fallbackError =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setSubmitError(fallbackError);
        toast.error(fallbackError);
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Image handling
  // ---------------------------------------------------------------------------

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const total = existingImages.length + newImages.length;
    const valid: File[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: only image files are allowed`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: must be under 5 MB`);
        return;
      }
      if (total + valid.length >= 10) {
        toast.error("Maximum 10 images allowed");
        return;
      }
      valid.push(file);
    });

    if (!valid.length) return;

    setNewImages((prev) => [
      ...prev,
      ...valid.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveExistingImage = async (index: number) => {
    const image = existingImages[index];
    try {
      await deleteProductImage(image.id, image.publicId);
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
      toast.success("Image removed");
    } catch {
      toast.error("Failed to delete image");
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const backHref = isEdit
    ? `/admin/dashboard/inventory/${initialData.id}`
    : "/admin/dashboard/inventory";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Edit Product" : "Add Product"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? "Update product details, variants, and fitments."
              : "Create a new product with variants and fitments."}
          </p>
          {submitError && (
            <p className="text-sm text-destructive mt-2">{submitError}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild type="button">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isEdit ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Saving..." : "Save"}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {isPending ? "Creating..." : "Create"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Product Details ── */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                {...register("name", { required: "Name is required" })}
                placeholder="e.g., Premium Air Filter"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{isEdit ? "Slug" : "Slug (auto-generated)"}</Label>
              <Input
                {...register("slug")}
                placeholder="premium-air-filter"
                disabled={!isEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                {...register("category")}
                placeholder="Engine Parts, Body Parts, etc"
              />
            </div>
            <div className="space-y-2">
              <CreatableMultiSelect
                control={control}
                name="badges"
                label="Badges (optional)"
                placeholder="Search or create badges..."
                description="Assign one or more promotional badges to this product"
                availableTags={badges}
              />
            </div>

            <CreatableMultiSelect
              control={control}
              name="tags"
              label="Tags (optional)"
              placeholder="Search or create tags..."
              description="Add descriptive tags to help customers find this product"
              availableTags={tags}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              {...register("description")}
              placeholder="Brief description of the product"
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label>Active (visible in storefront)</Label>
          </div>
        </CardContent>
      </Card>

      {/* ── Variants ── */}
      <Card>
        <CardHeader>
          <CardTitle>Variants (Pricing & Stock)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {variantFields.map((field, index) => (
            <Card key={field.id} className="p-4 border-dashed">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm">
                    Variant #{index + 1}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Set this one to true, others to false
                        variantFields.forEach((_, i) => {
                          setValue(`variants.${i}.isDefault`, i === index, {
                            shouldDirty: true,
                          });
                        });
                      }}
                      className={
                        watch(`variants.${index}.isDefault`)
                          ? "text-yellow-500"
                          : "text-muted-foreground"
                      }
                      title="Set as Default Variant"
                    >
                      <Star
                        className={`h-4 w-4 ${watch(`variants.${index}.isDefault`) ? "fill-current" : ""}`}
                      />
                    </Button>
                    {variantFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Hidden field to preserve the DB variant id on edit */}
                <input type="hidden" {...register(`variants.${index}._id`)} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Variant Name *</Label>
                    <Input
                      {...register(`variants.${index}.name`, {
                        required: "Variant name is required",
                      })}
                      placeholder="e.g., Default, Red, Large"
                    />
                    {errors.variants?.[index]?.name && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index]?.name?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>SKU *</Label>
                    <Input
                      {...register(`variants.${index}.sku`, {
                        required: "SKU is required",
                      })}
                      placeholder="ABC-123"
                    />
                    {errors.variants?.[index]?.sku && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index]?.sku?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Barcode</Label>
                    <Input
                      {...register(`variants.${index}.barcode`)}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Price (PKR) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`variants.${index}.price`, {
                        required: "Price is required",
                        min: { value: 0, message: "Price must be ≥ 0" },
                      })}
                      placeholder="1000"
                    />
                    {errors.variants?.[index]?.price && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index]?.price?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Price (PKR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`variants.${index}.salePrice`)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Price (PKR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`variants.${index}.costPrice`)}
                      placeholder="Internal use"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stock Quantity *</Label>
                    <Input
                      type="number"
                      min="0"
                      {...register(`variants.${index}.inventoryQty`, {
                        required: "Stock is required",
                        min: { value: 0, message: "Stock must be ≥ 0" },
                      })}
                      placeholder="0"
                    />
                    {errors.variants?.[index]?.inventoryQty && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index]?.inventoryQty?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Low Stock Alert Threshold</Label>
                    <Input
                      type="number"
                      min="1"
                      {...register(`variants.${index}.lowStockAt`)}
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              appendVariant({
                name: "",
                sku: "",
                price: 0,
                salePrice: null,
                costPrice: null,
                barcode: "",
                inventoryQty: 0,
                lowStockAt: 5,
                isDefault: variantFields.length === 0, // auto default if it's the only one
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </CardContent>
      </Card>

      {/* ── Vehicle Compatibility ── */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Compatibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isUniversal}
              onCheckedChange={(checked) => setValue("isUniversal", checked)}
            />
            <Label>Universal Fit (fits all vehicles)</Label>
          </div>

          {!isUniversal && (
            <>
              {fitmentFields.map((field, index) => (
                <Card key={field.id} className="p-4 border-dashed">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm">
                        Fitment #{index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFitment(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Make *</Label>
                        <Input
                          {...register(`fitments.${index}.make`, {
                            required: "Make is required",
                          })}
                          placeholder="Toyota"
                        />
                        {errors.fitments?.[index]?.make && (
                          <p className="text-xs text-destructive">
                            {errors.fitments[index]?.make?.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Model *</Label>
                        <Input
                          {...register(`fitments.${index}.model`, {
                            required: "Model is required",
                          })}
                          placeholder="Corolla"
                        />
                        {errors.fitments?.[index]?.model && (
                          <p className="text-xs text-destructive">
                            {errors.fitments[index]?.model?.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Start Year</Label>
                        <Input
                          type="number"
                          min="1900"
                          max="2100"
                          {...register(`fitments.${index}.startYear`)}
                          placeholder="2014"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Year</Label>
                        <Input
                          type="number"
                          min="1900"
                          max="2100"
                          {...register(`fitments.${index}.endYear`)}
                          placeholder="2026"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendFitment({
                    make: "",
                    model: "",
                    startYear: null,
                    endYear: null,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Images ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing images (edit mode only) */}
          {existingImages.length > 0 && (
            <div>
              <Label className="mb-2 block">Current Images</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingImages.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.secureUrl}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(index)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New images staged for upload */}
          {newImages.length > 0 && (
            <div>
              <Label className="mb-2 block">
                New Images (will upload on save)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {newImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview}
                      alt={`New ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-dashed border-primary"
                    />
                    {existingImages.length === 0 && index === 0 && (
                      <Badge className="absolute top-2 left-2 bg-blue-500 text-white hover:bg-blue-600">
                        Primary
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(index)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload dropzone */}
          {existingImages.length + newImages.length < 10 && (
            <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition-colors dark:border-gray-600 dark:bg-gray-900">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={isPending}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="flex flex-col items-center space-y-2">
                <Upload className="h-10 w-10 text-gray-400" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Drop images here or click to upload
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {existingImages.length + newImages.length}/10 images • Max 5
                  MB each
                </p>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {existingImages.length + newImages.length} / 10 images
            {newImages.length > 0 && (
              <span className="text-blue-600">
                {" "}
                · {newImages.length} new image(s) will upload when you save
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseErrorMessage(raw?: string): string {
  if (!raw) return "An unexpected error occurred";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0].message || raw;
    }
  } catch {
    // not JSON
  }
  return raw;
}
