"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft, Image as ImageIcon, X, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeSelector } from "@/components/ui/badge-selector";
import {
  getProductAction,
  updateProductAction,
} from "@/app/actions/productActions";
import { getActiveBadgesAction } from "@/app/actions/badgeActions";
import {
  getProductImages,
  deleteProductImage,
  saveProductImage,
} from "@/app/actions/imageActions";
import { uploadImageToCloudinary } from "@/lib/cloudinary-client";
import { toast } from "sonner";

interface Badge {
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImagePreview[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Track the existing variant's DB id so we can UPDATE it in place
  // rather than DELETE + RECREATE (which would break OrderItem FK references).
  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    sku: "",
    description: "",
    price: "",
    salePrice: "",
    costPrice: "",
    barcode: "",
    category: "",
    badgeId: "",
    stock: "",
    lowStockThreshold: "",
    isActive: true,
  });

  // Calculate margin percentage
  const calculateMargin = () => {
    const price = parseFloat(form.salePrice || form.price) || 0;
    const cost = parseFloat(form.costPrice) || 0;
    if (price <= 0 || cost <= 0) return null;
    const marginValue = ((price - cost) / price) * 100;
    return marginValue.toFixed(1);
  };

  const margin = calculateMargin();

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;

      // Load badges
      const badgesResult = await getActiveBadgesAction();
      if (badgesResult.success && badgesResult.data) {
        setBadges(badgesResult.data as Badge[]);
      }

      // Load product
      const result = await getProductAction(params.id);
      if (!result.success || !result.data) {
        toast.error(result.error || "Product not found");
        router.push("/admin/dashboard/inventory");
        return;
      }
      const p = result.data;
      // Get the first variant (default variant) for pricing and inventory
      const defaultVariant = p.variants?.[0];

      // Store the existing variant ID so we can update-in-place on submit
      setVariantId(defaultVariant?.id);

      setForm({
        name: p.name || "",
        slug: p.slug || "",
        sku: defaultVariant?.sku || "",
        description: p.description || "",
        price: ((defaultVariant?.price || 0) / 100).toString(),
        salePrice: defaultVariant?.salePrice
          ? (defaultVariant.salePrice / 100).toString()
          : "",
        costPrice: defaultVariant?.costPrice
          ? (defaultVariant.costPrice / 100).toString()
          : "",
        barcode: defaultVariant?.barcode || "",
        category: p.category || "",
        badgeId: p.badgeId || "",
        stock: (defaultVariant?.inventoryQty ?? 0).toString(),
        lowStockThreshold: (defaultVariant?.lowStockAt ?? 10).toString(),
        isActive: p.isActive,
      });

      // Load existing images
      const imagesResult = await getProductImages(params.id);
      if (imagesResult.success && imagesResult.data) {
        setExistingImages(imagesResult.data);
      }

      setIsLoading(false);
    };

    load();
  }, [params?.id, router]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [newImages]);

  const normalizeSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => {
      // Auto-generate slug when name changes
      if (field === "name" && typeof value === "string") {
        return { ...prev, name: value, slug: normalizeSlug(value) };
      }

      // Allow manual slug editing
      if (field === "slug" && typeof value === "string") {
        return { ...prev, slug: normalizeSlug(value) };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = () => {
    if (!params?.id) return;
    setSubmitError(null); // Clear previous errors
    startTransition(async () => {
      try {
        const price = Math.round(Number(form.price || 0) * 100);
        const salePrice = form.salePrice
          ? Math.round(Number(form.salePrice || 0) * 100)
          : undefined;
        const costPrice = form.costPrice
          ? Math.round(Number(form.costPrice || 0) * 100)
          : undefined;
        const stock = Number(form.stock || 0);
        const lowStockThreshold = Number(form.lowStockThreshold || 0);

        // Update product first
        const result = await updateProductAction({
          id: params.id,
          name: form.name,
          slug: form.slug || undefined,
          description: form.description || undefined,
          category: form.category || undefined,
          badgeId: form.badgeId || undefined,
          isActive: form.isActive,
          variants: [
            {
              // Pass the existing variant id so the service UPDATEs in place
              // instead of DELETE + CREATE (preserves OrderItem FK references).
              id: variantId,
              name: "Default",
              sku: form.sku,
              price,
              salePrice,
              costPrice,
              barcode: form.barcode || undefined,
              inventoryQty: stock,
              lowStockAt: lowStockThreshold,
            },
          ],
          keepImagePublicIds: existingImages.map((img) => img.publicId),
        });

        if (!result.success) {
          // Parse validation errors if they exist
          let errorMessage = result.error || "Failed to update product";
          try {
            const parsed = JSON.parse(errorMessage);
            if (Array.isArray(parsed) && parsed.length > 0) {
              errorMessage = parsed[0].message || errorMessage;
            }
          } catch {
            // Not JSON, use as-is
          }
          setSubmitError(errorMessage);
          return;
        }

        // Upload new images in parallel
        if (newImages.length > 0) {
          const uploadPromises = newImages.map((img, index) =>
            uploadImageToCloudinary(img.file).then((uploadResult) =>
              saveProductImage({
                productId: params.id,
                secureUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                isPrimary: existingImages.length === 0 && index === 0,
                sortOrder: existingImages.length + index,
              }),
            ),
          );

          const imageResults = await Promise.all(uploadPromises);
          const failedUploads = imageResults.filter((r) => !r.success);

          if (failedUploads.length > 0) {
            toast.warning(
              `Product updated but ${failedUploads.length} image(s) failed to upload`,
            );
          }
        }

        toast.success("Product updated");
        router.push(`/admin/dashboard/inventory/${params.id}`);
      } catch (error) {
        console.error("Update error:", error);
        setSubmitError(
          error instanceof Error ? error.message : "Failed to update product",
        );
      }
    });
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const totalImages =
      existingImages.length + newImages.length + validFiles.length;
    if (totalImages > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    const newPreviews = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveNewImage = (index: number) => {
    const imageToRemove = newImages[index];
    URL.revokeObjectURL(imageToRemove.preview);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = async (index: number) => {
    const image = existingImages[index];
    try {
      await deleteProductImage(image.id, image.publicId);
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
      toast.success("Image removed");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    }
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading product...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">
            Update product details and stock.
          </p>
          {submitError && (
            <p className="text-sm text-destructive mt-2">{submitError}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/dashboard/inventory/${params?.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Toyota Corolla"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (optional)</Label>
              <Input
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="toyota-corolla"
              />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={form.sku}
                onChange={(e) =>
                  handleChange("sku", e.target.value.toUpperCase())
                }
                placeholder="ABC-1234"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="SUV, Sedan, etc"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Selling Price (PKR)</Label>
              <Input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sale Price (optional)</Label>
              <Input
                type="number"
                min="0"
                value={form.salePrice}
                onChange={(e) => handleChange("salePrice", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Cost Price (internal)
                {margin && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    Margin: {margin}%
                  </span>
                )}
              </Label>
              <Input
                type="number"
                min="0"
                value={form.costPrice}
                onChange={(e) => handleChange("costPrice", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Tabs defaultValue="edit">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <Textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Short description of the product"
                  rows={4}
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="min-h-30 rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                  {form.description || "No description"}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {badges.length > 0 && (
            <BadgeSelector
              badges={badges}
              value={form.badgeId}
              onChange={(badgeId) => handleChange("badgeId", badgeId || "")}
              label="Badge (optional)"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Stock</Label>
            <Input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Low Stock Threshold</Label>
            <Input
              type="number"
              min="0"
              value={form.lowStockThreshold}
              onChange={(e) =>
                handleChange("lowStockThreshold", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Barcode (optional)</Label>
            <Input
              value={form.barcode}
              onChange={(e) => handleChange("barcode", e.target.value)}
              placeholder="Scan or type barcode"
            />
          </div>
          <div className="space-y-2 flex items-center justify-between border rounded-md px-3 py-2">
            <div>
              <Label className="block">Active</Label>
              <p className="text-sm text-muted-foreground">
                Product visible in storefront
              </p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={form.isActive}
              onChange={(e) => handleChange("isActive", e.target.checked)}
            />
          </div>
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
          {/* Existing Images */}
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

          {/* New Images (not uploaded yet) */}
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
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      New
                    </div>
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

          {/* Upload Area */}
          {existingImages.length + newImages.length < 10 && (
            <div>
              <Label className="mb-2 block">Add More Images</Label>
              <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition-colors dark:border-gray-600 dark:bg-gray-900">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  disabled={
                    isPending || existingImages.length + newImages.length >= 10
                  }
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-10 w-10 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Drop images here or click to upload
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {existingImages.length + newImages.length}/10 images • Max
                    5MB per image
                  </p>
                </div>
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
    </div>
  );
}
