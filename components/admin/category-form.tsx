"use client";

/**
 * CategoryForm
 *
 * Shared form used by:
 *   - /admin/dashboard/categories/new     (create)
 *   - /admin/dashboard/categories/[id]/edit (edit)
 *
 * Features:
 *  - Name, slug (auto-generated), description
 *  - Single image upload via Cloudinary unsigned upload
 *  - Sort order & active toggle
 */

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Upload, X, Save, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { uploadImageToCloudinary } from "@/lib/cloudinary-client";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/app/actions/categoryActions";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  sortOrder: number;
  isActive: boolean;
}

type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

interface CategoryFormProps {
  initialData?: CategoryData;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Image state
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.imageUrl ?? null,
  );
  const [imagePublicId, setImagePublicId] = useState<string | null>(
    initialData?.imagePublicId ?? null,
  );
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    defaultValues: isEdit
      ? {
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description ?? "",
          sortOrder: initialData.sortOrder,
          isActive: initialData.isActive,
        }
      : {
          name: "",
          slug: "",
          description: "",
          sortOrder: 0,
          isActive: true,
        },
  });

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

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    };
  }, [newImagePreview]);

  // ---------------------------------------------------------------------------
  // Image handling
  // ---------------------------------------------------------------------------

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    // Clear old preview
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);

    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImageFile(null);
    setNewImagePreview(null);
    setImageUrl(null);
    setImagePublicId(null);
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const onSubmit = (data: CategoryFormValues) => {
    setSubmitError(null);
    startTransition(async () => {
      try {
        let finalImageUrl = imageUrl;
        let finalImagePublicId = imagePublicId;

        // Upload new image if selected
        if (newImageFile) {
          setIsUploading(true);
          try {
            const upload = await uploadImageToCloudinary(newImageFile);
            finalImageUrl = upload.secure_url;
            finalImagePublicId = upload.public_id;
          } catch (err) {
            console.error("Image upload error:", err);
            toast.error("Failed to upload image");
            setIsUploading(false);
            return;
          }
          setIsUploading(false);
        }

        const payload = {
          name: data.name.trim(),
          slug: data.slug.trim(),
          description: data.description?.trim() || null,
          imageUrl: finalImageUrl,
          imagePublicId: finalImagePublicId,
          sortOrder: Number(data.sortOrder),
          isActive: data.isActive,
        };

        if (isEdit) {
          const result = await updateCategoryAction(initialData.id, payload);
          if (!result.success) {
            setSubmitError(result.error || "Failed to update category");
            toast.error(result.error || "Failed to update category");
            return;
          }
          toast.success("Category updated");
        } else {
          const result = await createCategoryAction(payload);
          if (!result.success) {
            setSubmitError(result.error || "Failed to create category");
            toast.error(result.error || "Failed to create category");
            return;
          }
          toast.success("Category created");
        }

        router.push("/admin/dashboard/categories");
      } catch (error) {
        console.error("CategoryForm submit error:", error);
        const msg =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setSubmitError(msg);
        toast.error(msg);
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const displayImage = newImagePreview || imageUrl;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Edit Category" : "Add Category"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? "Update category details and image."
              : "Create a new product category."}
          </p>
          {submitError && (
            <p className="text-sm text-destructive mt-2">{submitError}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild type="button">
            <Link href="/admin/dashboard/categories">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
          <Button type="submit" disabled={isPending || isUploading}>
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

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                {...register("name", { required: "Name is required" })}
                placeholder="e.g., Android Panels"
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
                {...register("slug", { required: "Slug is required" })}
                placeholder="android-panels"
              />
              {errors.slug && (
                <p className="text-sm text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                {...register("sortOrder", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
              <Label>Active (visible in storefront)</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              {...register("description")}
              placeholder="Brief description of this category"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Image */}
      <Card>
        <CardHeader>
          <CardTitle>Category Image</CardTitle>
        </CardHeader>
        <CardContent>
          {displayImage ? (
            <div className="relative w-full max-w-sm">
              <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                <Image
                  src={displayImage}
                  alt="Category preview"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center w-full max-w-sm h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files);
              }}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click or drag & drop an image
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Max 5 MB
                  </span>
                </>
              )}
            </label>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
