import {
  ArrowLeft,
  Edit,
  Package,
  Tag,
  DollarSign,
  CircleCheck,
  AlertTriangle,
  XCircle,
  Barcode,
  Hash,
  TrendingUp,
  Warehouse,
  Clock,
  ShoppingCart,
} from "lucide-react";
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
  // Get stock from the first variant
  const defaultVariant = product.variants?.[0];
  const stock = defaultVariant?.inventoryQty ?? 0;
  const lowStockAt = defaultVariant?.lowStockAt ?? 0;

  // Fetch stock details
  const stockDetailsResult = await getProductStockDetailsAction(id);
  const stockDetails = stockDetailsResult.success
    ? stockDetailsResult.data
    : null;

  const stockBadge = (() => {
    if (!defaultVariant || stock === 0) {
      return {
        label: "Out of Stock",
        variant: "destructive" as const,
        icon: XCircle,
      };
    }
    if (stock <= lowStockAt) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Details</h1>
          <p className="text-muted-foreground">View product info and status.</p>
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

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
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
            {/* SKU and Barcode prominently displayed */}
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">
                  {defaultVariant?.sku || "N/A"}
                </code>
              </div>
              {defaultVariant?.barcode && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Barcode className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {defaultVariant.barcode}
                  </span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              Slug: {product.slug}
            </p>
          </div>
          <div className="text-right space-y-2 min-w-45">
            <p className="text-sm text-muted-foreground">Selling Price</p>
            {defaultVariant?.salePrice ? (
              <>
                <p className="text-3xl font-bold text-green-600">
                  {formatPrice(defaultVariant.salePrice)}
                </p>
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(defaultVariant.price)}
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold">
                {formatPrice(defaultVariant?.price || 0)}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Category: {product.category || "-"}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {product.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="mt-1 leading-relaxed">{product.description}</p>
            </div>
          )}

          <Separator />

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" /> Selling Price
              </div>
              <p className="text-xl font-semibold">
                {formatPrice(
                  defaultVariant?.salePrice || defaultVariant?.price || 0,
                )}
              </p>
              {defaultVariant?.salePrice && (
                <p className="text-sm text-muted-foreground line-through">
                  Original: {formatPrice(defaultVariant.price)}
                </p>
              )}
            </div>
            <div className="border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" /> Cost Price
              </div>
              <p className="text-xl font-semibold text-muted-foreground">
                {defaultVariant?.costPrice
                  ? formatPrice(defaultVariant.costPrice)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Internal only</p>
            </div>
            <div className="border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" /> Profit
              </div>
              {defaultVariant?.costPrice ? (
                <>
                  <p className="text-xl font-semibold text-green-600">
                    {formatPrice(
                      (defaultVariant.salePrice || defaultVariant.price) -
                        defaultVariant.costPrice,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Margin:{" "}
                    {Math.round(
                      (((defaultVariant.salePrice || defaultVariant.price) -
                        defaultVariant.costPrice) /
                        (defaultVariant.salePrice || defaultVariant.price)) *
                        100,
                    )}
                    %
                  </p>
                </>
              ) : (
                <p className="text-xl font-semibold text-muted-foreground">—</p>
              )}
            </div>
            <div className="border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" /> Stock
              </div>
              <p className="text-xl font-semibold">
                {defaultVariant ? `${stock} units` : "No inventory record"}
              </p>
              {defaultVariant && (
                <p className="text-sm text-muted-foreground">
                  Low stock at {lowStockAt}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Category */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{product.category || "—"}</span>
            </div>
          </div>

          <Separator />

          <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-2">
            <p>Created: {formatDate(product.createdAt)}</p>
            <p>Updated: {formatDate(product.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stock Overview Card */}
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
                  <span className="truncate">{img.secureUrl}</span>
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
