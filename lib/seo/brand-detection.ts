/**
 * Manufacturer brand detection for Product schema.
 *
 * The SEO audit flagged that every product's JSON-LD `brand.name` was
 * hardcoded to "Shahzaib Electronics" (the retailer) instead of the actual
 * manufacturer (Nakamichi, JBL, Pioneer, etc.) — a leading cause of Google
 * Merchant Center disapproval, since Google cross-checks brand claims.
 *
 * There is no `brand` column on the Product model yet (see prisma/schema.prisma),
 * so this is a heuristic stopgap: it matches known manufacturer names against
 * the product's title. It is NOT a substitute for a real `brand` field —
 * add one to the Product model (with an admin input) and backfill it per
 * SKU as a follow-up; this function should then just read that field.
 *
 * Update KNOWN_BRANDS whenever a new manufacturer is added to the catalog.
 */

// Ordered so multi-word brand names are checked before their shorter
// substrings would otherwise cause a false match (e.g. "Rock Mars" before
// a hypothetical bare "Rock").
const KNOWN_BRANDS: string[] = [
  "Nakamichi",
  "JBL",
  "Kenwood",
  "Sansui",
  "Pioneer",
  "Alpine",
  "Sony Xplod",
  "Sony",
  "Rock Mars",
  "Rockmars",
  "Rock Star",
  "Solid Audio",
  "Audiobank",
  "Audio Bank",
  "Audiobose",
  "Lenovo",
];

/**
 * Returns the detected manufacturer name for a product title, or null if
 * no known brand matches. Callers should omit `brand` from JSON-LD entirely
 * when this returns null, rather than falling back to the retailer name.
 */
export function detectBrand(productName: string): string | null {
  const haystack = productName.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (haystack.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return null;
}
