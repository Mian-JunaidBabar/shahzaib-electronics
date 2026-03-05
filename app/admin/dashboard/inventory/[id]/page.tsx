import {
  ArrowLeft,
  Edit,
  Package,
  Tag,
  CircleCheck,
  AlertTriangle,
  XCircle,
  Hash,
  Warehouse,
  Clock,
  ShoppingCart,
  Car,
  Globe,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getProductAction,
  getProductStockDetailsAction,
} from "@/app/actions/productActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import Link from "next/link";

function formatPrice(price: number) {
  return `PKR ${(price / 100).toLocaleString()}`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProductAction(id);

  if (!result.success || !result.data) {
    return notFound();
  }

  const product = result.data;
  const variants = product.variants ?? [];
  const fitments = product.fitments ?? [];

  // Overall stock status based on all variants
  const totalStock = variants.reduce((sum, v) => sum + v.inventoryQty, 0);
  const isAnyLowStock = variants.some(
    (v) => v.inventoryQty > 0 && v.inventoryQty <= v.lowStockAt,
  );

  const stockBadge = (() => {
    if (variants.length === 0 || totalStock === 0) {
      return {
        label: "Out of Stock",
        variant: "destructive" as const,
        icon: XCircle,
      };
    }
    if (isAnyLowStock) {
      return {
        label: "Low Stock",
        variant: "secondary" as const,
        icon: AlertTriangle,
      };
    }
    return {
      label: "In Stock",
      variant: "default" as const,
      icon: CircleCheck,
    };
  })();

  const StockIcon = stockBadge.icon;

  // Fetch aggregated stock details
  const stockDetailsResult = await getProductStockDetailsAction(id);
  const stockDetails = stockDetailsResult.success
    ? stockDetailsResult.data
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Details</h1>
          <p className="text-muted-foreground">
            View product info and inventory.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard/inventory">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/admin/dashboard/inventory/${product.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── Main Product Card ─────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge
                variant={stockBadge.variant}
                className="flex items-center gap-1"
              >
                <StockIcon className="h-3 w-3" />
                {stockBadge.label}
              </Badge>
              {product.badge && (
                <Badge
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
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {product.name}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Slug: <code className="font-mono">{product.slug}</code>
            </p>
          </div>
          <div className="text-right space-y-1 min-w-40">
            <p className="text-sm text-muted-foreground">Category</p>
            <div className="flex items-center justify-end gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{product.category || "—"}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {variants.length} variant{variants.length !== 1 ? "s" : ""}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {product.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="leading-relaxed">{product.description}</p>
            </div>
          )}

          <Separator />

          <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-2">
            <p>Created: {formatDate(product.createdAt)}</p>
            <p>Updated: {formatDate(product.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Variants & Pricing Card ───────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Variants &amp; Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <p className="text-muted-foreground text-sm">No variants found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => {
                  const isLow =
                    variant.inventoryQty > 0 &&
                    variant.inventoryQty <= variant.lowStockAt;
                  const isOut = variant.inventoryQty === 0;
                  return (
                    <TableRow key={variant.id}>
                      <TableCell className="font-medium">
                        {variant.name}
                      </TableCell>
                      <TableCell>
                        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          {variant.sku}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(variant.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {variant.salePrice ? (
                          <span className="text-green-600 font-medium">
                            {formatPrice(variant.salePrice)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {variant.costPrice
                          ? formatPrice(variant.costPrice)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${
                            isOut
                              ? "text-red-600"
                              : isLow
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {isOut ? (
                            <XCircle className="h-3.5 w-3.5" />
                          ) : isLow ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : (
                            <CircleCheck className="h-3.5 w-3.5" />
                          )}
                          {variant.inventoryQty} units
                          {isLow && (
                            <span className="text-xs font-normal">
                              (low ≤{variant.lowStockAt})
                            </span>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ─── Vehicle Fitment Card ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Vehicle Fitment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {product.isUniversal ? (
            <Badge className="gap-1.5 text-sm bg-green-600 hover:bg-green-600 text-white">
              <Globe className="h-4 w-4" />
              Universal Fit — Compatible with all vehicles
            </Badge>
          ) : fitments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No fitment data specified.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Make</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Start Year</TableHead>
                  <TableHead>End Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fitments.map((fitment) => (
                  <TableRow key={fitment.id}>
                    <TableCell className="font-medium">
                      {fitment.make}
                    </TableCell>
                    <TableCell>{fitment.model}</TableCell>
                    <TableCell>{fitment.startYear ?? "—"}</TableCell>
                    <TableCell>{fitment.endYear ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ─── Stock Overview Card ───────────────────────────────── */}
      {stockDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-primary" />
              Stock Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Warehouse className="h-4 w-4 text-blue-500" />
                  Available in Warehouse
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {stockDetails.available}
                </p>
                <p className="text-xs text-muted-foreground">
                  Units ready to ship
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Reserved in Open Orders
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  {stockDetails.reserved}
                </p>
                <p className="text-xs text-muted-foreground">
                  Units in NEW, CONFIRMED, or PROCESSING orders
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingCart className="h-4 w-4 text-green-500" />
                  Total Units Sold
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {stockDetails.sold}
                </p>
                <p className="text-xs text-muted-foreground">
                  Units in DELIVERED orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Product Images ────────────────────────────────────── */}
      {product.images && product.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {product.images.map((img) => (
              <div key={img.id} className="border rounded-lg overflow-hidden">
                <div
                  className="aspect-video bg-muted"
                  style={{
                    backgroundImage: `url(${img.secureUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="truncate text-xs text-muted-foreground">
                    {img.publicId}
                  </span>
                  {img.isPrimary && <Badge variant="outline">Primary</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
