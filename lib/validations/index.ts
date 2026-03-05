/**
 * Zod Validation Schemas
 *
 * Centralized validation for all inputs:
 * - Auth validation
 * - Product validation
 * - Order validation
 * - Booking validation
 * - Lead validation
 * - Customer validation
 */
import { z } from "zod";


// ============ Common Schemas ============

export const phoneSchema = z
  .string()
  .min(11, "Phone number must be at least 11 digits")
  .max(15, "Phone number must not exceed 15 digits")
  .regex(/^[\d+\-\s()]+$/, "Invalid phone number format");

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .optional()
  .or(z.literal(""));

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const idSchema = z.string().uuid();

// ============ Auth Schemas ============

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number",
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============ Product Schemas ============

// Helper function to generate/normalize slug
const normalizeSlug = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const generateSlug = (name: string): string => normalizeSlug(name);

// Product status enum
export const productStatusSchema = z.enum([
  "ACTIVE",
  "OUT_OF_STOCK",
  "DRAFT",
  "ARCHIVED",
]);

// SKU validation - alphanumeric with dashes, required and unique
export const skuSchema = z
  .string()
  .min(3, "SKU must be at least 3 characters")
  .max(50, "SKU must not exceed 50 characters")
  .regex(/^[A-Z0-9\-]+$/i, "SKU must be alphanumeric (dashes allowed)");

// Variant schema
const variantSchema = z.object({
  id: z.string().uuid().optional(), // For updates
  name: z.string().min(1, "Variant name is required").max(100),
  sku: skuSchema,
  price: z.coerce
    .number()
    .int()
    .min(0, "Price must be non-negative (in cents)"),
  salePrice: z.coerce.number().int().min(0).optional().nullable(),
  costPrice: z.coerce.number().int().min(0).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  inventoryQty: z.coerce.number().int().min(0).default(0),
  lowStockAt: z.coerce.number().int().min(1).default(5),
  isDefault: z.boolean().default(false),
});

// Vehicle fitment schema
const fitmentSchema = z.object({
  id: z.string().uuid().optional(), // For updates
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  startYear: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  endYear: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
});

// Base product schema
const productBaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  slug: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = normalizeSlug(value);
      return normalized.length > 0 ? normalized : undefined;
    },
    z
      .string()
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only")
      .optional()
      .nullable(),
  ),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  badgeId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
  isUniversal: z.boolean().default(true),

  // Variants (at least one required)
  variants: z.array(variantSchema).min(1, "At least one variant is required"),

  // Fitments (optional)
  fitments: z.array(fitmentSchema).default([]),
});

// Create schema with slug auto-generation
export const productCreateSchema = productBaseSchema.transform((data) => ({
  ...data,
  slug: data.slug || generateSlug(data.name),
}));

// Update schema - make all fields optional and add ID
export const productUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200)
    .optional(),
  slug: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = normalizeSlug(value);
      return normalized.length > 0 ? normalized : undefined;
    },
    z
      .string()
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only")
      .optional()
      .nullable(),
  ),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  badgeId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isUniversal: z.boolean().optional(),

  // Optional variant and fitment updates
  variants: z.array(variantSchema).optional(),
  fitments: z.array(fitmentSchema).optional(),

  keepImagePublicIds: z.array(z.string()).optional(),
});

export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  status: productStatusSchema.optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  lowStock: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["name", "price", "createdAt", "stock"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  ...paginationSchema.shape,
});

// Stock rebalance schemas
export const stockRebalanceItemSchema = z.object({
  id: z.string().uuid(),
  newStock: z.coerce.number().int().min(0),
});

export const stockRebalanceSchema = z.array(stockRebalanceItemSchema);

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type StockRebalanceInput = z.infer<typeof stockRebalanceSchema>;

// ============ Product Image Schemas ============

export const productImageCreateSchema = z.object({
  productId: z.string().uuid(),
  secureUrl: z.string().url(),
  publicId: z.string().min(1),
  isPrimary: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const productImageUpdateSchema = z.object({
  id: z.string().uuid(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export type ProductImageCreateInput = z.infer<typeof productImageCreateSchema>;
export type ProductImageUpdateInput = z.infer<typeof productImageUpdateSchema>;

// ============ Order Schemas ============

// Matches Prisma OrderItem model
export const orderItemSchema = z.object({
  variantId: z.string().uuid(),
  name: z.string().min(1, "Product name is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  price: z.coerce
    .number()
    .int()
    .min(0, "Price must be non-negative (in cents)"),
});

// Matches Prisma Order model
export const orderCreateSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: phoneSchema,
  customerEmail: emailSchema,
  address: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  subtotal: z.coerce.number().int().min(0),
  total: z.coerce.number().int().min(0),
  notes: z.string().optional(),
});

export const orderUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "NEW",
    "CONTACTED",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "STALE",
  ]),
  notes: z.string().optional(),
});

export const orderFilterSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum([
      "NEW",
      "CONTACTED",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "STALE",
    ])
    .optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minTotal: z.coerce.number().optional(),
  maxTotal: z.coerce.number().optional(),
  sortBy: z
    .enum(["createdAt", "total", "status"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  ...paginationSchema.shape,
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;

// ============ Booking Schemas ============

export const bookingCreateSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: phoneSchema,
  serviceType: z.string().min(1, "Service type is required"),
  date: z.coerce
    .date()
    .refine(
      (date) => date > new Date(),
      "Scheduled date must be in the future",
    ),
  timeSlot: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  vehicleInfo: z.string().optional(),
  notes: z.string().optional(),
});

export const bookingUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ]),
  date: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const bookingFilterSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ])
    .optional(),
  serviceType: z.string().optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(["date", "createdAt", "status"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  ...paginationSchema.shape,
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
export type BookingFilterInput = z.infer<typeof bookingFilterSchema>;

// ============ Lead Schemas ============

// Matches Prisma LeadSource enum
export const leadSourceEnum = z.enum([
  "CONTACT_FORM",
  "WHATSAPP",
  "PHONE",
  "REFERRAL",
  "OTHER",
]);

export const leadCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema.optional(),
  email: emailSchema,
  subject: z.string().optional(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .optional(),
  source: leadSourceEnum.default("CONTACT_FORM"),
});

export const leadUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]),
  notes: z.string().optional(),
});

export const leadFilterSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"])
    .optional(),
  source: leadSourceEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z
    .enum(["createdAt", "status", "source"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  ...paginationSchema.shape,
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type LeadFilterInput = z.infer<typeof leadFilterSchema>;

// ============ Customer Schemas ============

export const customerCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().optional(),
  notes: z.string().optional(),
  isVip: z.boolean().default(false),
});

export const customerUpdateSchema = customerCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const customerFilterSchema = z.object({
  search: z.string().optional(),
  isVip: z.coerce.boolean().optional(),
  hasOrders: z.coerce.boolean().optional(),
  hasBookings: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["name", "createdAt", "totalSpent"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  ...paginationSchema.shape,
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type CustomerFilterInput = z.infer<typeof customerFilterSchema>;

// ============ Service Schemas ============

// Helper for slug normalization
const normalizeServiceSlug = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const generateServiceSlug = (title: string): string =>
  normalizeServiceSlug(title);

// Service location enum
export const serviceLocationEnum = z.enum(["WORKSHOP", "HOME", "BOTH"]);

// Base service schema
const serviceBaseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  slug: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = normalizeServiceSlug(value);
      return normalized.length > 0 ? normalized : undefined;
    },
    z
      .string()
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only")
      .optional()
      .nullable(),
  ),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  duration: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute"),
  location: serviceLocationEnum.default("BOTH"),
  features: z.array(z.string()).default([]),
  // Unified Image model - array of images
  images: z
    .array(
      z.object({
        publicId: z.string(),
        secureUrl: z.string().url(),
      }),
    )
    .optional()
    .default([]),
  // For update operations - which images to keep (diff strategy)
  keepImagePublicIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

// Create schema with slug auto-generation
export const serviceCreateSchema = serviceBaseSchema.transform((data) => ({
  ...data,
  slug: data.slug || generateServiceSlug(data.title),
}));

// Update schema - make all fields optional and add ID
export const serviceUpdateSchema = z.object({
  id: z.string().cuid(),
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200)
    .optional(),
  slug: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = normalizeServiceSlug(value);
      return normalized.length > 0 ? normalized : undefined;
    },
    z
      .string()
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only")
      .optional()
      .nullable(),
  ),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be a positive number").optional(),
  duration: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute")
    .optional(),
  location: serviceLocationEnum.optional(),
  features: z.array(z.string()).optional(),
  // Unified Image model - array of images to add
  images: z
    .array(
      z.object({
        publicId: z.string(),
        secureUrl: z.string().url(),
      }),
    )
    .optional(),
  // For update operations - which images to keep (diff strategy)
  keepImagePublicIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const serviceFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["title", "price", "duration", "createdAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  ...paginationSchema.shape,
});

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>;

// ============ Bulk Upload Schemas ============

export const bulkProductSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().int().min(0),
  description: z.string().optional(),
  category: z.string().optional(),
  badgeId: z.string().uuid().optional(),
  stock: z.coerce.number().int().min(0).default(0),
});

export const bulkUploadSchema = z.object({
  products: z.array(bulkProductSchema).min(1, "At least one product required"),
});

export type BulkProductInput = z.infer<typeof bulkProductSchema>;
export type BulkUploadInput = z.infer<typeof bulkUploadSchema>;

// ============ Checkout Schemas (Public - No Admin Required) ============

// Cart item from the public storefront
export const checkoutCartItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  name: z.string().min(1, "Product name is required"),
  price: z.coerce.number().int().min(0, "Price must be non-negative"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  image: z.string().optional(),
});

// Customer details for checkout
export const checkoutCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(5, "Please provide a delivery address"),
});

// Full checkout payload
export const checkoutSchema = z.object({
  customer: checkoutCustomerSchema,
  items: z.array(checkoutCartItemSchema).min(1, "Cart is empty"),
  serviceIds: z.array(z.string().uuid()).optional(), // Optional linked services
});

export type CheckoutCartItem = z.infer<typeof checkoutCartItemSchema>;
export type CheckoutCustomer = z.infer<typeof checkoutCustomerSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
