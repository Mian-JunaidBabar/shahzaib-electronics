"use client";

/**
 * BulkEditModal
 *
 * Modal dialog for bulk-updating selected products:
 *  - Change category (Select)
 *  - Change badge (Select)
 *  - Add tags (CreatableMultiSelect)
 */

import { useState, useEffect, useTransition, useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreatableMultiSelect } from "@/components/ui/creatable-multi-select";
import { getActiveCategoriesAction } from "@/app/actions/categoryActions";
import { getActiveBadgesAction } from "@/app/actions/badgeActions";
import { getAllTagsAction } from "@/app/actions/tagActions";
import { bulkUpdateProductsAction } from "@/app/actions/productActions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess: () => void;
}

type BulkEditFormValues = {
  tags: string[];
};

export function BulkEditModal({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: BulkEditModalProps) {
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [badges, setBadges] = useState<
    { id: string; name: string; color?: string }[]
  >([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);

  // Category and badge use plain state (Select), tags use react-hook-form (CreatableMultiSelect)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>("");

  const { control, reset } = useForm<BulkEditFormValues>({
    defaultValues: { tags: [] },
  });

  // Load options on mount
  useEffect(() => {
    if (!open) return;
    Promise.all([
      getActiveCategoriesAction(),
      getActiveBadgesAction(),
      getAllTagsAction(),
    ]).then(([catResult, badgeResult, tagResult]) => {
      if (catResult.success && catResult.data) {
        setCategories(
          catResult.data.map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          })),
        );
      }
      if (badgeResult.success && badgeResult.data) {
        setBadges(
          badgeResult.data.map(
            (b: { id: string; name: string; color: string }) => ({
              id: b.id,
              name: b.name,
              color: b.color,
            }),
          ),
        );
      }
      if (tagResult.success && tagResult.data) {
        setTags(
          tagResult.data.map((t: { id: string; name: string }) => ({
            id: t.id,
            name: t.name,
          })),
        );
      }
    });
  }, [open]);

  // Wrap onOpenChange to reset form state on open
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setSelectedCategoryId("");
        setSelectedBadgeId("");
        reset({ tags: [] });
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, reset],
  );

  const handleApply = () => {
    startTransition(async () => {
      // Build the update payload — only include fields that were changed
      const payload: Parameters<typeof bulkUpdateProductsAction>[0] = {
        productIds: selectedIds,
      };

      let hasChanges = false;

      if (selectedCategoryId && selectedCategoryId !== "__skip__") {
        payload.categoryId =
          selectedCategoryId === "__none__" ? null : selectedCategoryId;
        hasChanges = true;
      }

      if (selectedBadgeId && selectedBadgeId !== "__skip__") {
        payload.badgeId =
          selectedBadgeId === "__none__" ? null : selectedBadgeId;
        hasChanges = true;
      }

      // Get tags from the form
      const formTags = control._formValues.tags;
      if (formTags && formTags.length > 0) {
        payload.tags = formTags;
        hasChanges = true;
      }

      if (!hasChanges) {
        toast.info("No changes to apply");
        return;
      }

      const result = await bulkUpdateProductsAction(payload);

      if (result.success) {
        toast.success(
          `Updated ${result.data?.updatedCount ?? selectedIds.length} products`,
        );
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || "Failed to update products");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit</DialogTitle>
          <DialogDescription>
            Apply changes to {selectedIds.length} selected product
            {selectedIds.length > 1 ? "s" : ""}. Leave a field unchanged to skip
            it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="— Don't change —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__skip__">— Don&apos;t change —</SelectItem>
                <SelectItem value="__none__">Remove category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Badge */}
          <div className="space-y-2">
            <Label>Badge</Label>
            <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
              <SelectTrigger>
                <SelectValue placeholder="— Don't change —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__skip__">— Don&apos;t change —</SelectItem>
                <SelectItem value="__none__">Remove badge</SelectItem>
                {badges.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <CreatableMultiSelect
              control={control}
              name="tags"
              label="Add Tags"
              placeholder="Search or create tags..."
              description="Tags will be added to selected products"
              availableTags={tags}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Applying...
              </>
            ) : (
              `Apply to ${selectedIds.length} product${selectedIds.length > 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
