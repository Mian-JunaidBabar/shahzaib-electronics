"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Tag,
  DollarSign,
  Archive,
  TrendingUp,
  Image as ImageIcon,
  Trash2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getProductsAction,
  toggleProductActiveAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/actions/productActions";
import { getBadgesAction } from "@/app/actions/badgeActions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  costPrice: number | null;
  barcode: string | null;
  category: string | null;
  badgeId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: { id: string; secureUrl: string; isPrimary: boolean }[];
  inventory: {
    id: string;
    quantity: number;
    lowStockAt: number;
    reorderPoint: number;
  } | null;
  badge: {
    id: string;
    name: string;
    color: string;
    isActive: boolean;
  } | null;
};

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "LOW" | "OUT">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [badges, setBadges] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const [isApplyingBadge, setIsApplyingBadge] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    const result = await getProductsAction({
      isActive: statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE",
      search: searchQuery || undefined,
      page,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    if (result.success && result.data) {
      setProducts(result.data.products as unknown as Product[]);
      setTotalPages(result.data.pagination.totalPages);
      setTotalCount(result.data.pagination.total);

      // Calculate stats - use variants for stock calculations
      const activeCount = result.data.products.filter((p) => p.isActive).length;
      const lowStockCount = result.data.products.filter((p) => {
        const defaultVariant = p.variants?.[0];
        return (
          defaultVariant &&
          defaultVariant.inventoryQty > 0 &&
          defaultVariant.inventoryQty <= defaultVariant.lowStockAt
        );
      }).length;
      const outOfStockCount = result.data.products.filter((p) => {
        const defaultVariant = p.variants?.[0];
        return defaultVariant && defaultVariant.inventoryQty === 0;
      }).length;

      setStats({
        total: result.data.pagination.total,
        active: activeCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      });
    } else {
      setError(result.error || "Failed to fetch products");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  useEffect(() => {
    // Fetch badges on mount
    const loadBadges = async () => {
      const result = await getBadgesAction();
      if (result.success && result.data) {
        setBadges(result.data);
      }
    };
    loadBadges();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchProducts();
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    startTransition(async () => {
      const result = await toggleProductActiveAction(id, !currentActive);

      if (result.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, isActive: !currentActive } : p,
          ),
        );
        toast.success(
          currentActive ? "Product deactivated" : "Product activated",
        );
      } else {
        toast.error(result.error || "Failed to update status");
      }
    });
  };

  const handleDeleteProduct = async (id: string) => {
    startTransition(async () => {
      const result = await deleteProductAction(id);

      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        toast.success("Product deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete product");
      }
    });
    setDeleteConfirmId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsBulkDeleting(true);
    let successCount = 0;
    let failureCount = 0;

    for (const id of Array.from(selectedIds)) {
      const result = await deleteProductAction(id);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setIsBulkDeleting(false);

    if (failureCount === 0) {
      toast.success(`${successCount} product(s) deleted successfully`);
    } else {
      toast.error(
        `Deleted ${successCount} product(s). ${failureCount} failed (may have active orders).`,
      );
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const toggleSelectProduct = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleApplyBadge = async () => {
    if (selectedIds.size === 0) return;

    setIsApplyingBadge(true);
    let successCount = 0;
    let failureCount = 0;

    for (const id of Array.from(selectedIds)) {
      const result = await updateProductAction({
        id,
        badgeId: selectedBadgeId,
      });
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    // Refresh products to show updated badges
    await fetchProducts();
    setSelectedIds(new Set());
    setIsApplyingBadge(false);
    setShowBadgeDialog(false);
    setSelectedBadgeId(null);

    if (failureCount === 0) {
      const action = selectedBadgeId ? "Badge applied" : "Badge removed";
      toast.success(`${action} to ${successCount} product(s)`);
    } else {
      toast.error(
        `Updated ${successCount} product(s). ${failureCount} failed.`,
      );
    }
  };

  const formatPrice = (price: number) => {
    return `PKR ${(price / 100).toLocaleString()}`;
  };

  const getStockStatus = (product: Product) => {
    if (!product.inventory || product.inventory.quantity === 0) {
      return {
        label: "Out of Stock",
        color: "bg-red-100 text-red-700",
        icon: XCircle,
      };
    }
    if (product.inventory.quantity <= product.inventory.lowStockAt) {
      return {
        label: "Low Stock",
        color: "bg-orange-100 text-orange-700",
        icon: AlertTriangle,
      };
    }
    return {
      label: "In Stock",
      color: "bg-green-100 text-green-700",
      icon: CheckCircle,
    };
  };

  if (isLoading && products.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">
            Manage products and stock levels
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/dashboard/inventory/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">{stats.lowStock}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold">{stats.outOfStock}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-md"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val as "ALL" | "ACTIVE" | "INACTIVE");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active Only</SelectItem>
            <SelectItem value="INACTIVE">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {selectedIds.size > 0 && (
            <div className="border-b bg-blue-50 p-4 flex justify-between items-center dark:bg-blue-950">
              <span className="text-sm font-medium">
                {selectedIds.size} product(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBadgeDialog(true)}
                  disabled={isApplyingBadge || isPending}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Manage Badge
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkDelete()}
                  disabled={isBulkDeleting || isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={
                      products.length > 0 &&
                      selectedIds.size === products.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 cursor-pointer"
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">SKU</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No products found</p>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const StockIcon = stockStatus.icon;
                  const primaryImage =
                    product.images.find((img) => img.isPrimary) ||
                    product.images[0];

                  return (
                    <TableRow
                      key={product.id}
                      className={
                        selectedIds.has(product.id)
                          ? "bg-blue-100/50 dark:bg-blue-950/50"
                          : ""
                      }
                    >
                      {/* Checkbox Column */}
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelectProduct(product.id)}
                          className="rounded border-gray-300 cursor-pointer"
                        />
                      </TableCell>
                      {/* Image Column */}
                      <TableCell>
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {primaryImage ? (
                            <img
                              src={primaryImage.secureUrl}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      {/* Product Name Column */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">{product.name}</p>
                          {product.badge && (
                            <Badge
                              variant="outline"
                              className="text-xs w-fit"
                              style={{
                                backgroundColor: product.badge.color,
                                color: "white",
                                borderColor: product.badge.color,
                              }}
                            >
                              {product.badge.name}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {/* SKU Column - hidden on mobile */}
                      <TableCell className="hidden md:table-cell">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {product.sku}
                        </code>
                      </TableCell>
                      {/* Category Column - hidden on small screens */}
                      <TableCell className="hidden lg:table-cell">
                        {product.category ? (
                          <Badge variant="outline">
                            <Tag className="h-3 w-3 mr-1" />
                            {product.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {/* Price Column with sale price support */}
                      <TableCell>
                        <div className="flex flex-col">
                          {product.salePrice ? (
                            <>
                              <span className="font-medium text-green-600">
                                {formatPrice(product.salePrice)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(product.price)}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={stockStatus.color}>
                            <StockIcon className="h-3 w-3 mr-1" />
                            {product.inventory?.quantity ?? 0} units
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={product.isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            handleToggleActive(product.id, product.isActive)
                          }
                          disabled={isPending}
                        >
                          {product.isActive ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Archive className="h-4 w-4 mr-1" />
                              Inactive
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/admin/dashboard/inventory/${product.id}/edit`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/admin/dashboard/inventory/${product.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(product.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {products.length} of {totalCount} products
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Badge Management Dialog */}
      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Product Badge</DialogTitle>
            <DialogDescription>
              Apply or remove a badge for {selectedIds.size} selected product(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Badge</label>
              <Select
                value={selectedBadgeId || "none"}
                onValueChange={(value) =>
                  setSelectedBadgeId(value === "none" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a badge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      No Badge (Remove)
                    </div>
                  </SelectItem>
                  {badges.map((badge) => (
                    <SelectItem key={badge.id} value={badge.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: badge.color }}
                        />
                        {badge.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBadgeDialog(false);
                setSelectedBadgeId(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleApplyBadge} disabled={isApplyingBadge}>
              {isApplyingBadge ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone. If this product has active orders, deletion will be
              blocked.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) {
                  handleDeleteProduct(deleteConfirmId);
                }
              }}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
