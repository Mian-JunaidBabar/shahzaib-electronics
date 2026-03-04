"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BadgeSelector } from "@/components/ui/badge-selector";
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

export default function NewProductPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    stock: "0",
    lowStockThreshold: "10",
    isActive: true,
  });

  const margin = (() => {
    const selling = parseFloat(form.salePrice || form.price) || 0;
    const cost = parseFloat(form.costPrice) || 0;
    if (selling <= 0 || cost <= 0) return null;
    return (((selling - cost) / selling) * 100).toFixed(1);
  })();

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      imageFiles.forEach((img) => {
        URL.revokeObjectURL(img.preview);
      });
    };
  }, [imageFiles]);

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
    setSubmitError(null);
    startTransition(async () => {
      const price = Math.round(Number(form.price || 0) * 100);
      const salePrice = form.salePrice
        ? Math.round(Number(form.salePrice || 0) * 100)
        : undefined;
      const costPrice = form.costPrice
        ? Math.round(Number(form.costPrice || 0) * 100)
        : undefined;
      const stock = Number(form.stock || 0);
      const lowStockThreshold = Number(form.lowStockThreshold || 0);

      const result = await createProductAction({
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        category: form.category || undefined,
        badgeId: form.badgeId || undefined,
        isActive: form.isActive,
        isUniversal: true,
        variants: [
          {
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
        fitments: [],
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

    // Create local previews only - no upload yet
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Add Product</h1>
          <p className="text-muted-foreground">
            Create a new product and set initial stock levels.
          </p>
          {submitError && (
            <p className="text-sm text-destructive mt-2">{submitError}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard/inventory">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {isPending ? "Saving..." : "Create"}
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
                placeholder="1200000"
              />
            </div>
            <div className="space-y-2">
              <Label>Sale Price (optional)</Label>
              <Input
                type="number"
                min="0"
                value={form.salePrice}
                onChange={(e) => handleChange("salePrice", e.target.value)}
                placeholder="1000000"
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
                placeholder="800000"
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

          {!isLoadingBadges && (
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
            <Label>Initial Stock</Label>
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
          {/* Upload Area */}
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

          {/* Messages */}
          {uploadError && (
            <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {uploadError}
              </span>
              <button
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

          {/* Image Grid */}
          {imageFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {imageFiles.map((image, index) => (
                <div
                  key={index}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-transparent bg-gray-100 transition-all hover:border-gray-300 dark:bg-gray-800"
                >
                  {/* Image */}
                  <img
                    src={image.preview}
                    alt={`Upload ${index + 1}`}
                    className="h-full w-full object-cover"
                  />

                  {/* Primary Badge */}
                  {index === 0 && (
                    <Badge className="absolute left-1 top-1 bg-blue-500 text-white hover:bg-blue-600">
                      Primary
                    </Badge>
                  )}

                  {/* Delete Button */}
                  <button
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
    </div>
  );
}
