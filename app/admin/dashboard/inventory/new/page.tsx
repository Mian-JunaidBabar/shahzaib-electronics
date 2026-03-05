"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import Link from "next/link";
import {
  Plus,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BadgeSelector } from "@/components/ui/badge-selector";
import { Switch } from "@/components/ui/switch";
import { uploadImageToCloudinary } from "@/lib/cloudinary-client";
import { createProductAction } from "@/app/actions/productActions";
import { getActiveBadgesAction } from "@/app/actions/badgeActions";
import { saveProductImage } from "@/app/actions/imageActions";
import { toast } from "sonner";

interface Badge {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface ImagePreview {
  file: File;
  preview: string;
}

type FormData = {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  badgeId?: string;
  isActive: boolean;
  isUniversal: boolean;
  variants: Array<{
    name: string;
    sku: string;
    price: number;
    salePrice?: number | null;
    costPrice?: number | null;
    barcode?: string;
    inventoryQty: number;
    lowStockAt: number;
    isDefault: boolean;
  }>;
  fitments: Array<{
    make: string;
    model: string;
    startYear?: number | null;
    endYear?: number | null;
  }>;
};

export default function NewProductPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // React Hook Form setup
  const {
    register,
    control,
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      category: "",
      badgeId: "",
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

  // Field arrays for variants and fitments
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const {
    fields: fitmentFields,
    append: appendFitment,
    remove: removeFitment,
  } = useFieldArray({
    control,
    name: "fitments",
  });

  const isUniversal = watch("isUniversal");
  const name = watch("name");

  // Auto-generate slug from name
  useEffect(() => {
    if (name) {
      const normalized = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", normalized);
    }
  }, [name, setValue]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      imageFiles.forEach((img) => {
        URL.revokeObjectURL(img.preview);
      });
    };
  }, [imageFiles]);

  useEffect(() => {
    const loadBadges = async () => {
      const result = await getActiveBadgesAction();
      if (result.success && result.data) {
        setBadges(result.data as Badge[]);
      }
      setIsLoadingBadges(false);
    };
    loadBadges();
  }, []);

  const onSubmit = (data: FormData) => {
    setSubmitError(null);
    startTransition(async () => {
      // Convert prices from PKR to cents
      const variantsData = data.variants.map((v) => ({
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

      const result = await createProductAction({
        name: data.name,
        slug: data.slug || undefined,
        description: data.description || undefined,
        category: data.category || undefined,
        badgeId: data.badgeId || undefined,
        isActive: data.isActive,
        isUniversal: data.isUniversal,
        variants: variantsData,
        fitments: data.isUniversal ? [] : data.fitments,
      });

      if (result.success && result.data) {
        // Upload images to Cloudinary in parallel, then save to DB
        if (imageFiles.length > 0) {
          try {
            const uploadPromises = imageFiles.map((img) =>
              uploadImageToCloudinary(img.file),
            );
            const uploadResults = await Promise.all(uploadPromises);

            const savePromises = uploadResults.map((upload, i) =>
              saveProductImage({
                productId: result.data!.id,
                secureUrl: upload.secure_url,
                publicId: upload.public_id,
                isPrimary: i === 0,
                sortOrder: i,
              }),
            );

            const saveResults = await Promise.all(savePromises);
            const successCount = saveResults.filter((r) => r.success).length;

            if (successCount > 0) {
              toast.success(`Product created with ${successCount} image(s)`);
            } else {
              toast.success("Product created (but images failed to save)");
            }
          } catch (error) {
            console.error("Image upload error:", error);
            toast.success("Product created (but images failed to upload)");
          }
        } else {
          toast.success("Product created");
        }

        router.push(`/admin/dashboard/inventory/${result.data.id}`);
      } else {
        let errorMessage = result.error || "Failed to create product";
        try {
          const parsed = JSON.parse(errorMessage);
          if (Array.isArray(parsed) && parsed.length > 0) {
            errorMessage = parsed[0].message || errorMessage;
          }
        } catch {
          // Not JSON, use as-is
        }
        setSubmitError(errorMessage);
      }
    });
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("Only image files are allowed");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File size must be less than 5MB");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    if (imageFiles.length + validFiles.length > 10) {
      setUploadError("Maximum 10 images allowed");
      return;
    }

    setUploadError(null);

    const newPreviews = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImageFiles((prev) => [...prev, ...newPreviews]);
    setSuccessMessage(`${validFiles.length} image(s) ready to upload`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
    setSuccessMessage("Image removed");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("ring-2", "ring-blue-400");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("ring-2", "ring-blue-400");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-2", "ring-blue-400");
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Add Product</h1>
          <p className="text-muted-foreground">
            Create a new product with variants and fitments.
          </p>
          {submitError && (
            <p className="text-sm text-destructive mt-2">{submitError}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild type="button">
            <Link href="/admin/dashboard/inventory">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {isPending ? "Saving..." : "Create"}
          </Button>
        </div>
      </div>

      {/* Product Details */}
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
              <Label>Slug (auto-generated)</Label>
              <Input
                {...register("slug")}
                placeholder="premium-air-filter"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                {...register("category")}
                placeholder="Engine Parts, Body Parts, etc"
              />
            </div>
            {!isLoadingBadges && (
              <div className="space-y-2">
                <BadgeSelector
                  badges={badges}
                  value={watch("badgeId") || ""}
                  onChange={(badgeId) => setValue("badgeId", badgeId || "")}
                  label="Badge (optional)"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              {...register("description")}
              placeholder="Product description"
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

      {/* Product Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Product Variants (Pricing & Stock)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {variantFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Variant #{index + 1}</h4>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Variant Name *</Label>
                    <Input
                      {...register(`variants.${index}.name` as const, {
                        required: "Variant name is required",
                      })}
                      placeholder="e.g., Default, Red, Large"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU *</Label>
                    <Input
                      {...register(`variants.${index}.sku` as const, {
                        required: "SKU is required",
                      })}
                      placeholder="ABC-123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Barcode</Label>
                    <Input
                      {...register(`variants.${index}.barcode` as const)}
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
                      {...register(`variants.${index}.price` as const, {
                        required: "Price is required",
                        min: 0,
                      })}
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Price (PKR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.salePrice` as const)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Price (PKR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.costPrice` as const)}
                      placeholder="Internal use"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stock Quantity *</Label>
                    <Input
                      type="number"
                      {...register(`variants.${index}.inventoryQty` as const, {
                        required: "Stock is required",
                        min: 0,
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Low Stock Alert</Label>
                    <Input
                      type="number"
                      {...register(`variants.${index}.lowStockAt` as const, {
                        min: 1,
                      })}
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
                isDefault: variantFields.length === 0,
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </CardContent>
      </Card>

      {/* Vehicle Fitments */}
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
                <Card key={field.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Fitment #{index + 1}</h4>
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
                          {...register(`fitments.${index}.make` as const, {
                            required: "Make is required",
                          })}
                          placeholder="Toyota"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Model *</Label>
                        <Input
                          {...register(`fitments.${index}.model` as const, {
                            required: "Model is required",
                          })}
                          placeholder="Corolla"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Year</Label>
                        <Input
                          type="number"
                          {...register(`fitments.${index}.startYear` as const)}
                          placeholder="2014"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Year</Label>
                        <Input
                          type="number"
                          {...register(`fitments.${index}.endYear` as const)}
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

      {/* Product Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition-colors dark:border-gray-600 dark:bg-gray-900"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={imageFiles.length >= 10}
              className="absolute inset-0 cursor-pointer opacity-0"
            />

            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Drop images here or click to upload
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {imageFiles.length}/10 images • Max 5MB per image
              </p>
            </div>
          </div>

          {uploadError && (
            <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {uploadError}
              </span>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center space-x-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                {successMessage}
              </span>
            </div>
          )}

          {imageFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {imageFiles.map((image, index) => (
                <div
                  key={index}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-transparent bg-gray-100 transition-all hover:border-gray-300 dark:bg-gray-800"
                >
                  <img
                    src={image.preview}
                    alt={`Upload ${index + 1}`}
                    className="h-full w-full object-cover"
                  />

                  {index === 0 && (
                    <Badge className="absolute left-1 top-1 bg-blue-500 text-white hover:bg-blue-600">
                      Primary
                    </Badge>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-2 top-2 hidden rounded-full bg-red-500 p-1.5 text-white transition-all hover:bg-red-600 group-hover:block"
                    aria-label="Delete image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {imageFiles.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No images selected. Upload images above (optional).
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
