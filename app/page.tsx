import HomePageClient from "@/components/home/HomePageClient";
import { WeeklyBestSellers } from "@/components/home/WeeklyBestSellers";
import WhatsAppFab from "@/components/layout/whatsapp-fab";
import {
  getFeaturedVehicleProducts,
  getTopSellers,
} from "@/lib/services/product.service";
import { detectBrand } from "@/lib/seo/brand-detection";
import type { Metadata } from "next";

const title =
  "Shahzaib Electronics - Premium Car Accessories & Android Panels in Lahore";
const description =
  "Shahzaib Electronics is the leading direct importer and wholesale distributor of premium car accessories, Android panels, and audio systems in Lahore, Pakistan.";

export const metadata: Metadata = {
  title,
  description,
  // The root layout's openGraph/twitter defaults are generic
  // ("...Automotive Accessories & Services") and don't match this page's
  // own title/description — without an override here, Next.js inherits
  // that generic block wholesale, so shared links show a different title
  // than the browser tab and Google's index.
  openGraph: {
    title,
    description,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

// Same Product + Offer shape as the product detail page's `productJsonLd`
// (app/(public)/products/[slug]/page.tsx), built from the real data these
// homepage sections already render — no fabricated ratings or reviews.
function buildProductJsonLd({
  name,
  productDescription,
  images,
  productUrl,
  sku,
  price,
  salePrice,
  inventoryQty,
}: {
  name: string;
  productDescription: string | null;
  images: string[];
  productUrl: string;
  sku: string | null;
  price: number;
  salePrice: number | null;
  inventoryQty: number;
}) {
  const detectedBrand = detectBrand(name);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description:
      productDescription ||
      `Buy ${name} direct from the importer in Lahore.`,
    image: images.filter(Boolean),
    sku,
    ...(detectedBrand
      ? { brand: { "@type": "Brand", name: detectedBrand } }
      : {}),
    identifier_exists: false,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "PKR",
      price: (salePrice ?? price) / 100,
      availability:
        inventoryQty > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Shahzaib Electronics" },
    },
  };
}

export default async function HomePage() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.shahzaibelectronics.pk";

  // getTopSellers(2) shares an unstable_cache entry with the identical call
  // inside WeeklyBestSellers, so this doesn't add a second DB round-trip
  // and can't drift from what that component actually renders.
  const [featuredProducts, topSellers] = await Promise.all([
    getFeaturedVehicleProducts(),
    getTopSellers(2),
  ]);

  const homepageProductsJsonLd = [
    ...featuredProducts.map((product) => {
      const variant =
        product.variants.find((v) => v.isDefault) ?? product.variants[0];
      if (!variant) return null;
      return buildProductJsonLd({
        name: product.name,
        productDescription: product.description,
        images: product.images.map((img) => img.secureUrl),
        productUrl: `${appUrl}/products/${product.slug}`,
        sku: variant.sku,
        price: variant.price,
        salePrice: variant.salePrice,
        inventoryQty: variant.inventoryQty,
      });
    }),
    ...topSellers.map((item) =>
      buildProductJsonLd({
        name: item.name,
        productDescription: item.description,
        images: item.image ? [item.image] : [],
        productUrl: `${appUrl}/products/${item.slug}`,
        sku: null,
        price: item.price,
        salePrice: item.salePrice,
        inventoryQty: item.inventoryQty,
      }),
    ),
  ].filter((entry) => entry !== null);

  return (
    <>
      {homepageProductsJsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(homepageProductsJsonLd),
          }}
        />
      )}
      {/* WeeklyBestSellers is an async Server Component — it's rendered
          here (in this Server Component) and handed down to the client
          tree as a prop, rather than imported inside HomePageClient. */}
      <HomePageClient weeklyBestSellers={<WeeklyBestSellers />} />
      <WhatsAppFab />
    </>
  );
}
