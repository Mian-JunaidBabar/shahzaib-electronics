import {
  getStorefrontProduct,
  getRelatedProducts,
} from "@/lib/services/storefront.service";
import { ProductVariantSelector } from "@/components/store/product-variant-selector";
import { Calendar, Truck, Shield, Headphones, ChevronLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";

import { ImageGallery } from "./image-gallery";

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found | Shahzaib Autos",
    };
  }

  // Use default variant for pricing
  const defaultVariant = product.variants[0];
  const displayPrice =
    (defaultVariant?.salePrice ?? defaultVariant?.price ?? 0) / 100;
  const primaryImage = product.images[0]?.secureUrl ?? "/placeholder.jpg";

  const rawDescription =
    product.description ||
    `Shop ${product.name} at Shahzaib Autos. Premium quality car accessories.`;
  const seoDescription =
    rawDescription.length > 160
      ? rawDescription.substring(0, 157) + "..."
      : rawDescription;

  return {
    title: product.name,
    description: seoDescription,
    openGraph: {
      title: product.name,
      description: seoDescription,
      images: [{ url: primaryImage, alt: product.name }],
      type: "website",
    },
    other: {
      "product:price:amount": displayPrice.toString(),
      "product:price:currency": "PKR",
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);

  if (!product) {
    notFound();
  }

  // Fetch related products
  const relatedProducts = await getRelatedProducts(
    product.id,
    product.category,
    4,
  );

  // Use default variant (first variant)
  const defaultVariant = product.variants[0];
  if (!defaultVariant) {
    notFound(); // Product has no variants
  }

  const primaryImage = product.images[0]?.secureUrl ?? "/placeholder.jpg";

  return (
    <>
      {/* Breadcrumb */}
      <section className="border-b bg-muted/30 pt-6 pb-6">
        <div className="container px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </Link>
          <nav className="flex items-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link
              href="/products"
              className="hover:text-primary transition-colors"
            >
              Products
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* Product Details */}
      <section className="container px-4 md:px-8 lg:px-16 max-w-7xl mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <ImageGallery images={product.images} productName={product.name} />

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Badge */}
            <div className="flex items-center gap-2">
              {product.category && (
                <p className="text-sm text-primary font-medium uppercase tracking-wide">
                  {product.category}
                </p>
              )}
              {product.badge && (
                <Badge
                  style={{ backgroundColor: product.badge.color }}
                  className="text-white"
                >
                  {product.badge.name}
                </Badge>
              )}
            </div>

            {/* Name & Description */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* SKU — shows first variant's SKU for single‑variant products */}
            {defaultVariant.sku && (
              <p className="text-sm text-muted-foreground">
                SKU: {defaultVariant.sku}
              </p>
            )}

            <Separator />

            {/* Variant Selector — handles price, stock, pills, Add-to-Cart, WhatsApp */}
            <ProductVariantSelector
              product={{ id: product.id, name: product.name }}
              variants={product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                sku: v.sku,
                price: v.price,
                salePrice: v.salePrice,
                inventoryQty: v.inventoryQty,
              }))}
              primaryImage={primaryImage}
            />

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Truck className="h-4 w-4" />
                Free Installation
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Shield className="h-4 w-4" />
                Warranty Included
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Headphones className="h-4 w-4" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book Installation CTA */}
      <section className="container px-4 md:px-8 lg:px-16 max-w-7xl mx-auto pb-12">
        <div className="bg-linear-to-r from-primary/10 to-card border rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Need Professional Installation?
            </h2>
            <p className="text-muted-foreground">
              Book a home installation appointment with our expert technicians.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/booking" className="gap-2">
              <Calendar className="h-5 w-5" />
              Book Installation
            </Link>
          </Button>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="container px-4 md:px-8 lg:px-16 max-w-7xl mx-auto pb-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
