"use client";

import { useState, useEffect, useTransition, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Clock,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Truck,
  XCircle,
  Wrench,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOrderAction,
  updateOrderStatusAction,
} from "@/app/actions/orderActions";
import type { OrderStatus } from "@prisma/client";
import { toast } from "sonner";

type OrderDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  product?: {
    images?: { secureUrl: string; isPrimary: boolean }[];
  } | null;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string | null;
  subtotal: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  whatsappSent: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  booking?: {
    id: string;
    bookingNumber: string;
    serviceType: string;
    date: Date;
    timeSlot: string | null;
    status: string;
    notes: string | null;
  } | null;
};

const statusOptions: {
  value: OrderStatus;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "NEW", label: "New", icon: Clock },
  { value: "CONTACTED", label: "Contacted", icon: Phone },
  { value: "CONFIRMED", label: "Confirmed", icon: CheckCircle },
  { value: "PROCESSING", label: "Processing", icon: Package },
  { value: "SHIPPED", label: "Shipped", icon: Truck },
  { value: "DELIVERED", label: "Delivered", icon: CheckCircle },
  { value: "CANCELLED", label: "Cancelled", icon: XCircle },
  { value: "STALE", label: "Stale", icon: Clock },
];

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "NEW":
      return "bg-blue-100 text-blue-700";
    case "CONTACTED":
      return "bg-yellow-100 text-yellow-700";
    case "CONFIRMED":
      return "bg-purple-100 text-purple-700";
    case "PROCESSING":
      return "bg-orange-100 text-orange-700";
    case "SHIPPED":
      return "bg-cyan-100 text-cyan-700";
    case "DELIVERED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "STALE":
      return "bg-gray-200 text-gray-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: OrderDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);

    const result = await getOrderAction(id);

    if (result.success && result.data) {
      setOrder(result.data as Order);
    } else {
      setError(result.error || "Failed to fetch order");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;

    startTransition(async () => {
      const result = await updateOrderStatusAction({
        id: order.id,
        status: newStatus,
      });

      if (result.success) {
        setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        toast.success(`Order status updated to ${newStatus}`);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    });
  };

  const openWhatsApp = () => {
    if (!order) return;
    const message = encodeURIComponent(
      `Hello ${order.customerName}! Regarding your order #${order.orderNumber} at Shahzaib Electronics...`,
    );
    window.open(
      `https://wa.me/${order.customerPhone.replace(/\D/g, "")}?text=${message}`,
      "_blank",
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${(amount / 100).toLocaleString("en-PK")}`;
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error || "Order not found"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/dashboard/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openWhatsApp}>
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
            WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {item.product?.images?.[0]?.secureUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.product.images[0].secureUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Linked Booking */}
          {order.booking && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Wrench className="h-5 w-5" />
                  Scheduled Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Booking Number
                  </span>
                  <Badge variant="outline" className="font-mono">
                    {order.booking.bookingNumber}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Wrench className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Services</p>
                      <p className="font-medium">{order.booking.serviceType}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Scheduled Date
                      </p>
                      <p className="font-medium">
                        {formatDate(order.booking.date)}
                      </p>
                      {order.booking.timeSlot && (
                        <p className="text-sm text-muted-foreground">
                          {order.booking.timeSlot}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant={
                          order.booking.status === "CONFIRMED"
                            ? "default"
                            : "secondary"
                        }
                        className="mt-1"
                      >
                        {order.booking.status}
                      </Badge>
                    </div>
                  </div>

                  {order.booking.notes && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">
                        Booking Notes
                      </p>
                      <p className="text-sm">{order.booking.notes}</p>
                    </div>
                  )}
                </div>

                <Link
                  href={`/admin/dashboard/bookings/${order.booking.id}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  View Full Booking Details
                  <ArrowLeft className="h-3 w-3 rotate-180" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge
                className={`text-sm px-3 py-1 ${getStatusColor(order.status)}`}
              >
                {order.status}
              </Badge>
              <Select
                value={order.status}
                onValueChange={(value) =>
                  handleStatusChange(value as OrderStatus)
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${order.customerPhone}`}
                  className="text-primary hover:underline"
                >
                  {order.customerPhone}
                </a>
              </div>
              {order.customerEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="text-primary hover:underline"
                  >
                    {order.customerEmail}
                  </a>
                </div>
              )}
              {order.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <span className="text-sm">{order.address}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
