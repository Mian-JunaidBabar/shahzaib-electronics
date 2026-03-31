"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  ShoppingCart,
  Calendar,
  DollarSign,
  AlertTriangle,
  MessageCircle,
  // Edit,
  // Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCustomerAction,
  // getCustomerHistoryAction,
  toggleVipStatusAction,
} from "@/app/actions/customerActions";
import { toast } from "sonner";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  notes: string | null;
  isVip: boolean;
  createdAt: Date;
  updatedAt: Date;
  orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: Date;
  }>;
  bookings: Array<{
    id: string;
    bookingNumber: string;
    serviceType: string;
    date: Date;
    status: string;
    createdAt: Date;
  }>;
};

const formatCurrency = (amount: number) =>
  `PKR ${(amount / 100).toLocaleString("en-PK")}`;
const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const getOrderStatusColor = (status: string) => {
  const map: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700",
    CONTACTED: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-purple-100 text-purple-700",
    PROCESSING: "bg-orange-100 text-orange-700",
    SHIPPED: "bg-cyan-100 text-cyan-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    STALE: "bg-gray-200 text-gray-800",
  };
  return map[status] || "bg-gray-100 text-gray-700";
};

const getBookingStatusColor = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-orange-100 text-orange-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    NO_SHOW: "bg-gray-200 text-gray-800",
  };
  return map[status] || "bg-gray-100 text-gray-700";
};

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getCustomerAction(id);
    if (result.success && result.data) {
      setCustomer(result.data as Customer);
    } else {
      if (
        result.error?.includes("UNAUTHORIZED") ||
        result.error?.includes("FORBIDDEN")
      ) {
        window.location.href = "/admin/auth/unauthorized";
        return;
      }
      setError(result.error || "Failed to fetch customer");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleVip = async () => {
    if (!customer) return;
    const result = await toggleVipStatusAction(customer.id);
    if (result.success && result.data) {
      setCustomer((prev) =>
        prev ? { ...prev, isVip: result.data!.isVip } : null,
      );
      toast.success(
        result.data.isVip ? "Customer marked as VIP" : "VIP status removed",
      );
    } else {
      toast.error(result.error || "Failed to update VIP status");
    }
  };

  const openWhatsApp = () => {
    if (!customer) return;
    const message = encodeURIComponent(
      `Hello ${customer.name}! This is Shahzaib Electronics...`,
    );
    window.open(
      `https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${message}`,
      "_blank",
    );
  };

  // Calculate Lifetime Value
  const lifetimeValue = customer
    ? customer.orders.reduce((sum, o) => sum + o.total, 0)
    : 0;

  if (isLoading) return <LoadingSkeleton />;

  if (error || !customer) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error || "Customer not found"}</p>
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
            <Link href="/admin/dashboard/customers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{customer.name}</h1>
              {customer.isVip && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  <Star className="h-3 w-3 mr-1 fill-amber-500" /> VIP
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openWhatsApp}>
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" /> WhatsApp
          </Button>
          <Button variant="outline" onClick={handleToggleVip}>
            <Star
              className={`h-4 w-4 mr-2 ${customer.isVip ? "fill-amber-500 text-amber-500" : ""}`}
            />
            {customer.isVip ? "Remove VIP" : "Make VIP"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lifetime Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(lifetimeValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{customer.orders.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{customer.bookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">
                  {customer.isVip ? "VIP" : "Regular"}
                </p>
              </div>
              <User className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">
            Orders ({customer.orders.length})
          </TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings ({customer.bookings.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-primary hover:underline"
                  >
                    {customer.phone}
                  </a>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-primary hover:underline"
                    >
                      {customer.email}
                    </a>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <span className="text-sm">{customer.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.notes ? (
                  <p className="text-sm text-muted-foreground">
                    {customer.notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No notes added.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardContent className="p-0">
              {customer.orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link
                            href={`/admin/dashboard/orders/${order.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            #{order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getOrderStatusColor(order.status)}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/dashboard/orders/${order.id}`}>
                              <ArrowLeft className="h-4 w-4 rotate-180" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardContent className="p-0">
              {customer.bookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bookings yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <Link
                            href={`/admin/dashboard/bookings/${booking.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            #{booking.bookingNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{booking.serviceType}</TableCell>
                        <TableCell>{formatDate(booking.date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getBookingStatusColor(booking.status)}
                          >
                            {booking.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/admin/dashboard/bookings/${booking.id}`}
                            >
                              <ArrowLeft className="h-4 w-4 rotate-180" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
