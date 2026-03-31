"use client";

import {
  getBookingAction,
  getAvailableSlotsAction,
  rescheduleBookingAction,
  updateBookingStatusAction,
} from "@/app/actions/bookingActions";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Calendar as CalendarIcon,
  MessageCircle,
  Wrench,
  CalendarClock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

type BookingDetailsPageProps = {
  params: Promise<{ id: string }>;
};

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  address: string;
  serviceType: string;
  vehicleInfo: string;
  date: Date;
  timeSlot: string | null;
  status: string;
  notes?: string;
  orderId?: string | null;
  order?: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
  } | null;
  activityLog?: Array<{
    id: string;
    activity: string;
    createdAt: Date;
  }>;
}

const BOOKING_STATUSES = [
  {
    value: "PENDING",
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    value: "CONFIRMED",
    label: "Confirmed",
    icon: CheckCircle,
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    icon: Wrench,
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    icon: CheckCircle,
    color: "bg-green-100 text-green-700",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-100 text-red-700",
  },
  {
    value: "NO_SHOW",
    label: "No Show",
    icon: AlertTriangle,
    color: "bg-gray-200 text-gray-700",
  },
];

const getStatusMeta = (status: string) =>
  BOOKING_STATUSES.find((s) => s.value === status) || BOOKING_STATUSES[0];

const formatOrderCurrency = (amount: number) =>
  `PKR ${(amount / 100).toLocaleString("en-PK")}`;

// Timeline step order for visualization
const TIMELINE_ORDER = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-10 w-64 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-36 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailsPage({
  params,
}: BookingDetailsPageProps) {
  const [id, setId] = useState<string>("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
      const result = await getBookingAction(resolvedParams.id);
      if (result.success && result.data) {
        const data = result.data as Booking;
        setBooking({
          ...data,
          date: new Date(data.date),
          activityLog: data.activityLog?.map((log) => ({
            ...log,
            createdAt: new Date(log.createdAt),
          })),
        });
      }
      setLoading(false);
    };
    fetchBooking();
  }, [params]);

  const fetchTimeSlots = async (selectedDate: Date) => {
    setSlotsLoading(true);
    try {
      const result = await getAvailableSlotsAction(selectedDate.toISOString());
      if (result.success && result.data) {
        setTimeSlots(result.data);
        if (rescheduleTime && !result.data.includes(rescheduleTime)) {
          setRescheduleTime("");
        }
      } else {
        setTimeSlots([]);
      }
    } catch {
      setTimeSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (rescheduleDate) fetchTimeSlots(rescheduleDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rescheduleDate]);

  const handleOpenReschedule = () => {
    if (booking?.date) setRescheduleDate(booking.date);
    if (booking?.timeSlot) setRescheduleTime(booking.timeSlot);
    setIsRescheduleOpen(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    setIsUpdating(true);
    try {
      const result = await updateBookingStatusAction(id, newStatus);
      if (result.success) {
        setBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
        toast.success(`Status updated to ${getStatusMeta(newStatus).label}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Error updating status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Please select date and time");
      return;
    }
    if (!id) return;
    setIsUpdating(true);
    try {
      const result = await rescheduleBookingAction(
        id,
        rescheduleDate,
        rescheduleTime,
      );
      if (result.success) {
        setBooking((prev) =>
          prev
            ? { ...prev, date: rescheduleDate, timeSlot: rescheduleTime }
            : null,
        );
        setIsRescheduleOpen(false);
        toast.success("Booking rescheduled successfully");
      } else {
        toast.error("Failed to reschedule booking");
      }
    } catch {
      toast.error("Error rescheduling booking");
    } finally {
      setIsUpdating(false);
    }
  };

  const openWhatsApp = () => {
    if (!booking) return;
    const message = encodeURIComponent(
      `Hello ${booking.customerName}! Regarding your booking #${booking.bookingNumber} at Shahzaib Electronics...`,
    );
    window.open(
      `https://wa.me/${booking.customerPhone.replace(/\D/g, "")}?text=${message}`,
      "_blank",
    );
  };

  if (loading) return <LoadingSkeleton />;

  if (!booking) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" asChild>
          <Link href="/admin/dashboard/bookings">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
        </Button>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>Booking not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMeta = getStatusMeta(booking.status);
  const services = booking.serviceType
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const currentStepIndex = TIMELINE_ORDER.indexOf(booking.status);
  const isCancelledOrNoShow = ["CANCELLED", "NO_SHOW"].includes(booking.status);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/dashboard/bookings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                Booking #{booking.bookingNumber}
              </h1>
              <Badge className={statusMeta.color}>{statusMeta.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              Scheduled for {format(booking.date, "PPP")} at{" "}
              {booking.timeSlot || "TBD"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openWhatsApp}>
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" /> WhatsApp
          </Button>
          <Button variant="outline" onClick={handleOpenReschedule}>
            <CalendarClock className="h-4 w-4 mr-2" /> Reschedule
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column — Customer + Vehicle + Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{booking.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${booking.customerPhone}`}
                    className="text-primary hover:underline"
                  >
                    {booking.customerPhone}
                  </a>
                </div>
                {booking.customerEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${booking.customerEmail}`}
                      className="text-primary hover:underline"
                    >
                      {booking.customerEmail}
                    </a>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {booking.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <span className="text-sm">{booking.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" /> Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {booking.vehicleInfo || "Not provided"}
              </p>
            </CardContent>
          </Card>

          {/* Services Requested */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" /> Services Requested
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.length > 0 ? (
                services.map((service) => (
                  <div key={service} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>{service}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No services listed</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {booking.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{booking.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Linked Order */}
          {booking.order && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Wrench className="h-5 w-5" /> Linked Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      Order #{booking.order.orderNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total: {formatOrderCurrency(booking.order.total)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/dashboard/orders/${booking.order.id}`}>
                      View Order{" "}
                      <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column — Status & Timeline */}
        <div className="space-y-6">
          {/* Status Control */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge className={`text-sm px-3 py-1 ${statusMeta.color}`}>
                {statusMeta.label}
              </Badge>
              <Select
                value={booking.status}
                onValueChange={handleStatusChange}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {BOOKING_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        <s.icon className="h-4 w-4" />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {isCancelledOrNoShow ? (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {booking.status === "CANCELLED"
                      ? "Booking Cancelled"
                      : "Customer No Show"}
                  </span>
                </div>
              ) : (
                <div className="space-y-0">
                  {TIMELINE_ORDER.map((step, index) => {
                    const meta = getStatusMeta(step);
                    const isActive = step === booking.status;
                    const isCompleted = currentStepIndex > index;
                    const IconComponent = meta.icon;

                    return (
                      <div key={step} className="flex gap-3">
                        {/* Vertical line + dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                              isCompleted
                                ? "bg-green-100 border-green-500 text-green-600"
                                : isActive
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "bg-muted border-border text-muted-foreground"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <IconComponent className="h-4 w-4" />
                            )}
                          </div>
                          {index < TIMELINE_ORDER.length - 1 && (
                            <div
                              className={`w-0.5 h-8 ${
                                isCompleted ? "bg-green-500" : "bg-border"
                              }`}
                            />
                          )}
                        </div>
                        {/* Label */}
                        <div className="pt-1">
                          <p
                            className={`text-sm font-medium ${
                              isActive
                                ? "text-primary"
                                : isCompleted
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {meta.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.activityLog && booking.activityLog.length > 0 ? (
                booking.activityLog.map((log) => (
                  <div
                    key={log.id}
                    className="space-y-1 border-b border-border last:border-0 pb-3 last:pb-0"
                  >
                    <p className="text-sm">{log.activity}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(log.createdAt, "PPP p")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No activity logged yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Update the date and time for booking #{booking?.bookingNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Select Date</Label>
              <div className="flex justify-center border rounded-lg p-4 bg-muted/30">
                <Calendar
                  mode="single"
                  selected={rescheduleDate}
                  onSelect={setRescheduleDate}
                  initialFocus
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Select Time Slot</Label>
              {slotsLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading time slots...
                </p>
              ) : timeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No available time slots for this date.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setRescheduleTime(slot)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        rescheduleTime === slot
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRescheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={isUpdating || !rescheduleDate || !rescheduleTime}
            >
              {isUpdating ? "Rescheduling..." : "Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
