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
      title: "Product Not Found | Shahzaib Electronics",
    };
  }

  // Use default variant for pricing
  const defaultVariant =
    product.variants.find((v) => v.isDefault) || product.variants[0];
  const displayPrice =
    (defaultVariant?.salePrice ?? defaultVariant?.price ?? 0) / 100;
  const primaryImage = product.images[0]?.secureUrl ?? "/placeholder.jpg";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.shahzaibelectronics.pk";
  const productUrl = `${appUrl.replace(/\/$/, "")}/products/${product.slug}`;

  const rawDescription =
    product.description ||
    `Shop ${product.name} at Shahzaib Electronics. Premium quality car accessories.`;
  const seoDescription =
    rawDescription.length > 160
      ? rawDescription.substring(0, 157) + "..."
      : rawDescription;

  return {
    title: product.name,
    description: seoDescription,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: product.name,
      description: seoDescription,
      url: productUrl,
      images: [{ url: primaryImage, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: seoDescription,
      images: [primaryImage],
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
    product.categoryId,
    4,
  );

  // Use default variant
  const defaultVariant =
    product.variants.find((v) => v.isDefault) || product.variants[0];
  if (!defaultVariant) {
    notFound(); // Product has no variants
  }

  const categoryName = product.categoryRelation?.name || "Uncategorized";
  const productBadges =
    product.productBadges?.map((pb) => pb.badge).filter(Boolean) || [];

  const primaryImage = product.images[0]?.secureUrl ?? "/placeholder.jpg";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const productUrl = `${appUrl}/products/${product.slug}`;
  const displayPrice =
    (defaultVariant.salePrice ?? defaultVariant.price ?? 0) / 100;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ||
      `Buy ${product.name} direct from the importer in Lahore.`,
    image: product.images.map((img) => img.secureUrl).filter(Boolean),
    sku: defaultVariant.sku,
    brand: {
      "@type": "Brand",
      name: "Shahzaib Electronics",
    },
    category: categoryName,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "PKR",
      price: displayPrice,
      availability:
        defaultVariant.inventoryQty > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Shahzaib Electronics",
      },
    },
  };

  const faqEntities = product.isUniversal
    ? [
        {
          "@type": "Question",
          name: "Will this fit my car?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Yes, ${product.name} is a universal product and is designed to fit a wide range of compatible vehicles. Contact Shahzaib Electronics for model-specific installation guidance.`,
          },
        },
      ]
    : (product.fitments || []).map((fitment) => ({
        "@type": "Question",
        name: `Will this fit a ${fitment.make} ${fitment.model}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, ${product.name} supports ${fitment.make} ${fitment.model}${fitment.startYear ? ` (${fitment.startYear}${fitment.endYear ? `-${fitment.endYear}` : ""})` : ""}. For perfect compatibility and installation support, contact Shahzaib Electronics before ordering.`,
        },
      }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity:
      faqEntities.length > 0
        ? faqEntities
        : [
            {
              "@type": "Question",
              name: `Is ${product.name} available with installation support?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, Shahzaib Electronics provides product guidance and professional installation support for compatible vehicles.",
              },
            },
          ],
  };

  const categoryUrl = product.categoryRelation?.slug
    ? `${appUrl}/products/category/${product.categoryRelation.slug}`
    : `${appUrl}/products`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: appUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${appUrl}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: categoryUrl,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productJsonLd, faqJsonLd, breadcrumbJsonLd]),
        }}
      />

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
          <nav className="flex flex-wrap items-center gap-y-1 text-sm text-muted-foreground">
            <Link
              href="/"
              className="whitespace-nowrap hover:text-primary transition-colors"
            >
              Home
            </Link>
            <span className="mx-2 text-muted-foreground/70">/</span>
            <Link
              href="/products"
              className="whitespace-nowrap hover:text-primary transition-colors"
            >
              Products
            </Link>
            <span className="mx-2 text-muted-foreground/70">/</span>
            <span className="max-w-full break-words text-muted-foreground">
              {categoryName}
            </span>
            <span className="mx-2 text-muted-foreground/70">/</span>
            <span className="max-w-full break-words font-medium text-foreground">
              {product.name}
            </span>
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
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                {categoryName}
              </p>
              {productBadges.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {productBadges.map((badge) => (
                    <Badge
                      key={badge.id}
                      style={{ backgroundColor: badge.color }}
                      className="text-white"
                    >
                      {badge.name}
                    </Badge>
                  ))}
                </div>
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
                isDefault: v.isDefault,
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
