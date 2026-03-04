/**
 * Data Transfer Objects (DTOs) and Interfaces
 *
 * Centralized type definitions for all data structures:
 * - API response types
 * - Service layer types
 * - Action result types
 * - Entity DTOs for frontend consumption
 *
 * NOTE: Authentication is handled EXCLUSIVELY by Supabase Auth.
 * User/Role types are defined locally, not from Prisma.
 */
import type { Product, Image, ProductVariant, VehicleFitment, Order, OrderItem, Booking, Lead, Customer, OrderStatus, BookingStatus, LeadStatus, LeadSource, Admin, } from "@prisma/client";


// ============================================
// COMMON TYPES
// ============================================

/**
 * Standard API response wrapper
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================
// USER / AUTH DTOs
// ============================================

/**
 * User DTO - represents Supabase Auth user data
 * NOT stored in Prisma - comes from Supabase Auth
 */
export interface UserDTO {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  image?: string | null;
  createdAt?: string;
}

/**
 * Admin record from Prisma - maps Supabase user to admin access
 */
export interface AdminDTO {
  id: string;
  supabaseUserId: string;
  createdAt: string;
}

export interface SessionDTO {
  user: UserDTO;
  expiresAt: string;
}

// ============================================
// PRODUCT DTOs
// ============================================

/**
 * Product status enum (mirrors Prisma)
 */
export type ProductStatus = "ACTIVE" | "OUT_OF_STOCK" | "DRAFT" | "ARCHIVED";

/**
 * Product Variant DTO
 */
export interface ProductVariantDTO {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  costPrice?: number | null;
  barcode?: string | null;
  inventoryQty: number;
  lowStockAt: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vehicle Fitment DTO
 */
export interface VehicleFitmentDTO {
  id: string;
  make: string;
  model: string;
  startYear: number;
  endYear: number;
  notes?: string | null;
  createdAt: string;
}

/**
 * Product with relations for display
 */
export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  badgeId?: string | null;
  badge?: {
    id: string;
    name: string;
    color: string;
    isActive: boolean;
  } | null;
  status: ProductStatus;
  isActive: boolean;
  isArchived: boolean;
  isUniversal: boolean;
  createdAt: string;
  updatedAt: string;
  images: ImageDTO[];
  variants: ProductVariantDTO[];
  fitments: VehicleFitmentDTO[];
}

/**
 * Unified Image DTO (for both Products and Services)
 */
export interface ImageDTO {
  id: string;
  secureUrl: string;
  publicId: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  productId?: string | null;
  serviceId?: string | null;
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use ImageDTO instead
 */
export type ProductImageDTO = ImageDTO;

/**
 * Product creation input (from form/API)
 */
export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string | null;
  category?: string | null;
  badgeId?: string | null;
  isActive?: boolean;
  isUniversal?: boolean;
  variants: {
    name: string;
    sku: string;
    price: number;
    salePrice?: number | null;
    costPrice?: number | null;
    barcode?: string | null;
    inventoryQty: number;
    lowStockAt?: number;
  }[];
  fitments?: {
    make: string;
    model: string;
    startYear: number;
    endYear: number;
    notes?: string | null;
  }[];
}

/**
 * Product update input
 */
export interface UpdateProductInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  category?: string | null;
  badgeId?: string | null;
  isActive?: boolean;
  isArchived?: boolean;
  isUniversal?: boolean;
  variants?: {
    name: string;
    sku: string;
    price: number;
    salePrice?: number | null;
    costPrice?: number | null;
    barcode?: string | null;
    inventoryQty: number;
    lowStockAt?: number;
  }[];
  fitments?: {
    make: string;
    model: string;
    startYear: number;
    endYear: number;
    notes?: string | null;
  }[];
  keepImagePublicIds?: string[];
}

/**
 * Stock rebalance item
 */
export interface StockRebalanceItem {
  id: string;
  newStock: number;
}

/**
 * Stock rebalance result
 */
export interface StockRebalanceResult {
  success: boolean;
  updatedCount: number;
  errors: string[];
}

/**
 * Delete product result
 */
export interface DeleteProductResult {
  success: boolean;
  deleted?: boolean;
  reason?: string;
  orderCount?: number;
}

/**
 * Lightweight product for rebalance view
 */
export interface ProductRebalanceDTO {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  variants: {
    id: string;
    name: string;
    inventoryQty: number;
    lowStockAt: number;
  }[];
}

/**
 * Product filter/query parameters
 */
export interface ProductFilterInput {
  search?: string;
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  lowStock?: boolean;
  sortBy?: "name" | "price" | "createdAt" | "stock";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ============================================
// PRODUCT IMAGE DTOs
// ============================================

/**
 * Image upload result from Cloudinary
 */
export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Create product image input
 */
/**
 * Create image input (unified for products and services)
 */
export interface CreateImageInput {
  publicId: string;
  secureUrl: string;
  isPrimary?: boolean;
  sortOrder?: number;
  productId?: string;
  serviceId?: string;
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use CreateImageInput instead
 */
export interface CreateProductImageInput {
  productId: string;
  secureUrl: string;
  publicId: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

/**
 * Saved image response (unified)
 */
export interface SavedImageDTO {
  id: string;
  publicId: string;
  secureUrl: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  productId?: string | null;
  serviceId?: string | null;
}

// ============================================
// ORDER DTOs
// ============================================

/**
 * Order with relations for display
 */
export interface OrderDTO {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  address?: string | null;
  subtotal: number;
  total: number;
  status: OrderStatus;
  notes?: string | null;
  whatsappSent: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
  customer?: CustomerDTO | null;
}

/**
 * Order item for display
 */
export interface OrderItemDTO {
  id: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  productId?: string; // Optional for backward compatibility
}

/**
 * Order creation input
 */
export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address?: string;
  items: CreateOrderItemInput[];
  subtotal: number;
  total: number;
  notes?: string;
}

/**
 * Order item creation input
 */
export interface CreateOrderItemInput {
  variantId: string;
  name: string;
  quantity: number;
  price: number;
}

/**
 * Order update input
 */
export interface UpdateOrderInput {
  id: string;
  status?: OrderStatus;
  notes?: string;
}

/**
 * Order filter parameters
 */
export interface OrderFilterInput {
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "createdAt" | "total" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ============================================
// BOOKING DTOs
// ============================================

/**
 * Booking with relations for display
 */
export interface BookingDTO {
  id: string;
  bookingNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  serviceType: string;
  vehicleInfo?: string | null;
  date: string;
  timeSlot?: string | null;
  address: string;
  notes?: string | null;
  status: BookingStatus;
  whatsappSent: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: CustomerDTO | null;
}

/**
 * Booking creation input
 */
export interface CreateBookingInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceType: string;
  vehicleInfo?: string;
  date: Date | string;
  timeSlot?: string;
  address: string;
  notes?: string;
}

/**
 * Booking update input
 */
export interface UpdateBookingInput {
  id: string;
  status?: BookingStatus;
  date?: Date | string;
  timeSlot?: string;
  address?: string;
  notes?: string;
}

/**
 * Booking filter parameters
 */
export interface BookingFilterInput {
  search?: string;
  status?: BookingStatus;
  customerId?: string;
  serviceType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ============================================
// LEAD DTOs
// ============================================

/**
 * Lead for display
 */
export interface LeadDTO {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: LeadSource;
  subject?: string | null;
  message?: string | null;
  status: LeadStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lead creation input
 */
export interface CreateLeadInput {
  name: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  subject?: string;
  message?: string;
}

/**
 * Lead update input
 */
export interface UpdateLeadInput {
  id: string;
  status?: LeadStatus;
  notes?: string;
}

/**
 * Lead filter parameters
 */
export interface LeadFilterInput {
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "createdAt" | "status" | "name";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ============================================
// CUSTOMER DTOs
// ============================================

/**
 * Customer for display
 */
export interface CustomerDTO {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  notes?: string | null;
  isVip: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer with history
 */
export interface CustomerWithHistoryDTO extends CustomerDTO {
  orders: OrderDTO[];
  bookings: BookingDTO[];
  totalOrders: number;
  totalBookings: number;
  totalSpent: number;
}

/**
 * Customer creation input
 */
export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  notes?: string;
  isVip?: boolean;
}

/**
 * Customer update input
 */
export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  id: string;
}

/**
 * Customer filter parameters
 */
export interface CustomerFilterInput {
  search?: string;
  isVip?: boolean;
  sortBy?: "name" | "createdAt" | "totalOrders";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ============================================
// DASHBOARD DTOs
// ============================================

/**
 * Dashboard statistics
 */
export interface DashboardStatsDTO {
  totalRevenue: number;
  totalOrders: number;
  totalBookings: number;
  totalCustomers: number;
  newOrders: number;
  pendingBookings: number;
  newLeads: number;
  lowStockProducts: number;
}

/**
 * Order statistics
 */
export interface OrderStatsDTO {
  total: number;
  newOrders: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenue: number;
}

/**
 * Booking statistics
 */
export interface BookingStatsDTO {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  upcomingBookings: number;
}

/**
 * Lead statistics
 */
export interface LeadStatsDTO {
  total: number;
  newLeads: number;
  contacted: number;
  qualified: number;
  converted: number;
  lost: number;
  conversionRate: number;
}

/**
 * Low stock product alert
 */
export interface LowStockProductDTO {
  id: string;
  name: string;
  slug: string;
  stock: number;
  lowStockAt: number;
  primaryImage?: string | null;
}

// ============================================
// NOTIFICATION DTOs
// ============================================

/**
 * WhatsApp message result
 */
export interface WhatsAppMessageDTO {
  url: string;
  phone: string;
  message: string;
}

/**
 * Low stock alert input
 */
export interface LowStockAlertInput {
  name: string;
  stock: number;
  sku?: string | null;
}

// ============================================
// SERVICE DTOs
// ============================================

/**
 * Service for display (with unified Image relation)
 */
export interface ServiceDTO {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  duration: number; // In minutes
  location?: "WORKSHOP" | "HOME" | "BOTH";
  features?: string[];
  images: ImageDTO[]; // Unified Image model
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service creation input
 */
export interface CreateServiceInput {
  title: string;
  slug?: string; // Auto-generated from title if not provided
  description?: string | null;
  price: number; // In rupees
  duration: number; // In minutes
  location?: "WORKSHOP" | "HOME" | "BOTH";
  features?: string[];
  images?: Array<{ publicId: string; secureUrl: string }>; // Unified Image model
  isActive?: boolean;
}

/**
 * Service update input
 */
export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  id: string;
  keepImagePublicIds?: string[]; // Images to keep (diff strategy)
}

// ============================================
// TYPE GUARDS
// ============================================

export function isActionSuccess<T>(
  result: ActionResult<T>,
): result is ActionResult<T> & { data: T } {
  return result.success && result.data !== undefined;
}

export function isActionError<T>(
  result: ActionResult<T>,
): result is ActionResult<T> & { error: string } {
  return !result.success && result.error !== undefined;
}

// ============================================
// RE-EXPORT PRISMA ENUMS
// ============================================

export type { OrderStatus, BookingStatus, LeadStatus, LeadSource };

// Re-export for convenience
export type {
  Product,
  Image,
  Inventory,
  Order,
  OrderItem,
  Booking,
  Lead,
  Customer,
  Admin,
};
