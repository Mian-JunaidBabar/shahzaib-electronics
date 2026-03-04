-- ============================================
-- SAFE DATA MIGRATION: Product to ProductVariant
-- This migration preserves ALL existing data
-- ============================================

-- Step 1: Add isUniversal to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_universal" BOOLEAN NOT NULL DEFAULT true;

-- Step 2: Create product_variants table
CREATE TABLE IF NOT EXISTS "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "sale_price" INTEGER,
    "cost_price" INTEGER,
    "barcode" TEXT,
    "inventory_qty" INTEGER NOT NULL DEFAULT 0,
    "low_stock_at" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create vehicle_fitments table
CREATE TABLE IF NOT EXISTS "vehicle_fitments" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "start_year" INTEGER,
    "end_year" INTEGER,

    CONSTRAINT "vehicle_fitments_pkey" PRIMARY KEY ("id")
);

-- Step 4: Migrate existing product data to product_variants (Create Default Variant for each product)
INSERT INTO "product_variants" ("id", "product_id", "name", "sku", "price", "sale_price", "cost_price", "barcode", "inventory_qty", "low_stock_at", "created_at", "updated_at")
SELECT 
    gen_random_uuid(),
    p.id,
    'Default',
    p.sku,
    p.price,
    p.sale_price,
    p.cost_price,
    p.barcode,
    COALESCE(i.quantity, 0),
    COALESCE(i.low_stock_at, 5),
    p.created_at,
    NOW()
FROM "products" p
LEFT JOIN "inventory" i ON i.product_id = p.id
WHERE NOT EXISTS (
    SELECT 1 FROM "product_variants" pv WHERE pv.product_id = p.id
);

-- Step 5: Add variant_id column to order_items (temporarily nullable)
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_id" TEXT;

-- Step 6: Migrate order_items to point to the default variant for each product
UPDATE "order_items" oi
SET "variant_id" = pv.id
FROM "product_variants" pv
WHERE pv.product_id = oi.product_id
AND oi.variant_id IS NULL;

-- Step 7: Create indexes and constraints for product_variants
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_sku_key" ON "product_variants"("sku");
CREATE INDEX IF NOT EXISTS "product_variants_product_id_idx" ON "product_variants"("product_id");

-- Step 8: Create indexes for vehicle_fitments
CREATE INDEX IF NOT EXISTS "vehicle_fitments_make_model_idx" ON "vehicle_fitments"("make", "model");
CREATE INDEX IF NOT EXISTS "vehicle_fitments_product_id_idx" ON "vehicle_fitments"("product_id");

-- Step 9: Add foreign key constraints
ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "product_variants_product_id_fkey";
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vehicle_fitments" DROP CONSTRAINT IF EXISTS "vehicle_fitments_product_id_fkey";
ALTER TABLE "vehicle_fitments" ADD CONSTRAINT "vehicle_fitments_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 10: Make variant_id NOT NULL now that data is migrated
ALTER TABLE "order_items" ALTER COLUMN "variant_id" SET NOT NULL;

-- Step 11: Add foreign key for order_items.variant_id
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_variant_id_fkey";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" 
    FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 12: Drop the old inventory table (data already migrated to product_variants)
DROP TABLE IF EXISTS "inventory";

-- Step 13: Drop old columns from products table (data already migrated to product_variants)
ALTER TABLE "products" DROP COLUMN IF EXISTS "sku";
ALTER TABLE "products" DROP COLUMN IF EXISTS "price";
ALTER TABLE "products" DROP COLUMN IF EXISTS "sale_price";
ALTER TABLE "products" DROP COLUMN IF EXISTS "cost_price";
ALTER TABLE "products" DROP COLUMN IF EXISTS "barcode";

-- Step 14: Drop old product_id column from order_items (now using variant_id)
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "product_id";

-- Migration Complete
-- All data preserved and migrated to new schema
