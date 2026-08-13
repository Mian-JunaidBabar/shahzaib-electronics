"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getPublicServicesAction } from "@/app/actions/serviceActions";
import {
  createPublicBookingAction,
  getAvailableSlotsAction,
  getPublicBookingSettingsAction,
} from "@/app/actions/bookingActions";
import type { OperatingHours } from "@/lib/services/slot.service";

interface BookingSettings {
  slotDuration: number;
  bufferTime: number;
  advanceBookingDays: number;
  allowSameDayBooking: boolean;
  operatingHours: OperatingHours[];
}
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  FileText,
  MessageCircle,
  Car,
  CheckCircle,
  Loader2,
  DollarSign,
  Wrench,
  Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FormData {
  name: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  carModel: string;
  notes: string;
}

type Service = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  duration: number;
  location: string;
  features: string[];
};

export function BookingForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    address: "",
    date: "",
    time: "",
    carModel: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasPreselectedRef = useRef(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [settings, setSettings] = useState<BookingSettings | null>(null);

  // Dynamic Dates
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");

  // Fetch services on mount
  useEffect(() => {
    loadServices();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getPublicBookingSettingsAction();
      if (res.success && res.data) {
        setSettings(res.data);

        // Calculate min/max dates
        const today = new Date();
        if (!res.data.allowSameDayBooking) {
          today.setDate(today.getDate() + 1);
        }
        setMinDate(today.toISOString().split("T")[0]);

        const max = new Date();
        max.setDate(max.getDate() + res.data.advanceBookingDays);
        setMaxDate(max.toISOString().split("T")[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle URL pre-selection
  useEffect(() => {
    if (services.length > 0 && searchParams && !hasPreselectedRef.current) {
      const serviceSlug = searchParams.get("service");
      if (serviceSlug) {
        const service = services.find((s) => s.slug === serviceSlug);
        if (service && !selectedServices.includes(service.id)) {
          setSelectedServices([service.id]);
          toast.success(`Pre-selected: ${service.title}`);
          hasPreselectedRef.current = true;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, searchParams]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (formData.date) {
      fetchAvailableSlots(formData.date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date]);

  const fetchAvailableSlots = async (date: string) => {
    setIsLoadingSlots(true);
    try {
      const result = await getAvailableSlotsAction(date);
      if (result.success && result.data) {
        setAvailableSlots(result.data);
        // Clear selected time if it's no longer available
        if (formData.time && !result.data.includes(formData.time)) {
          setFormData((prev) => ({ ...prev, time: "" }));
        }
      } else {
        setAvailableSlots([]);
        toast.error("No available slots for this date");
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };
  const loadServices = async () => {
    setIsLoadingServices(true);
    try {
      const result = await getPublicServicesAction();
      if (result.success && result.data) {
        setServices(result.data);
      } else {
        toast.error("Failed to load services");
      }
    } catch (error) {
      console.error("Failed to load services:", error);
      toast.error("Failed to load services");
    } finally {
      setIsLoadingServices(false);
    }
  };

  // Calculate total service cost
  const serviceTotal = useMemo(() => {
    return services
      .filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + Number(s.price), 0);
  }, [selectedServices, services]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "date" && settings && settings.operatingHours) {
      const selectedDate = new Date(value);
      if (!isNaN(selectedDate.getTime())) {
        const selectedDay = selectedDate.getDay();
        const dayConfig = settings.operatingHours.find(
          (h) => h.dayOfWeek === selectedDay,
        );
        if (dayConfig && !dayConfig.isOpen) {
          toast.error("We are closed on this day. Please select another date.");
          return;
        }
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.date) newErrors.date = "Please select a date";
    if (!formData.time) newErrors.time = "Please select a time slot";

    if (selectedServices.length === 0) {
      toast.error("Please select at least one service");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create booking in database
      const result = await createPublicBookingAction({
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: "", // Optional field
        address: formData.address,
        date: formData.date,
        timeSlot: formData.time,
        vehicleInfo: formData.carModel,
        serviceIds: selectedServices,
        notes: formData.notes,
      });

      if (result.success && result.data) {
        toast.success(
          `Booking ${result.data.bookingNumber} created! Redirecting to WhatsApp...`,
        );

        // Redirect to WhatsApp
        window.location.href = result.data.whatsappUrl;
      } else {
        toast.error(result.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Column */}
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details Card */}
          <div className="bg-card border border-border rounded-xl p-6 transition-colors duration-300">
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer Details
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                  <User className="h-4 w-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 rounded-lg bg-background border ${
                    errors.name ? "border-red-500" : "border-border"
                  } text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., 03001234567"
                  className={`w-full px-4 py-3 rounded-lg bg-background border ${
                    errors.phone ? "border-red-500" : "border-border"
                  } text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                  <MapPin className="h-4 w-4" />
                  Service Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter your complete address for our visit"
                  className={`w-full px-4 py-3 rounded-lg bg-background border ${
                    errors.address ? "border-red-500" : "border-border"
                  } text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none`}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Appointment Details Card */}
          <div className="bg-card border border-border rounded-xl p-6 transition-colors duration-300">
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Appointment Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                  <Calendar className="h-4 w-4" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={minDate}
                  max={maxDate}
                  className={`w-full px-4 py-3 rounded-lg bg-background border ${
                    errors.date ? "border-red-500" : "border-border"
                  } text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors`}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                )}
              </div>

              {/* Time Slot */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                  <Clock className="h-4 w-4" />
                  Time Slot
                </label>
                {!formData.date ? (
                  <div className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-text-muted">
                    Please select a date first
                  </div>
                ) : isLoadingSlots ? (
                  <div className="flex items-center gap-2 w-full px-4 py-3 rounded-lg bg-background border border-border text-text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading available slots...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="w-full px-4 py-3 rounded-lg bg-background border border-red-200 text-red-600">
                    No available slots for this date. Please select another
                    date.
                  </div>
                ) : (
                  <select
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-background border ${
                      errors.time ? "border-red-500" : "border-border"
                    } text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors`}
                  >
                    <option value="">Select a time slot</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                )}
                {errors.time && (
                  <p className="text-red-500 text-sm mt-1">{errors.time}</p>
                )}
              </div>
            </div>
          </div>

          {/* Services Selection Card */}
          <div className="bg-card border border-border rounded-xl p-6 transition-colors duration-300">
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Select Services
            </h2>

            {isLoadingServices ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-4 border border-border rounded-lg"
                  >
                    <Skeleton className="h-5 w-5 rounded shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                No services available at the moment.
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => {
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`flex gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div
                        className={`mt-1 h-4 w-4 shrink-0 rounded-sm border border-primary flex items-center justify-center ${
                          isSelected ? "bg-primary" : "bg-background"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-text-primary">
                              {service.title}
                            </h3>
                            {service.description && (
                              <p className="text-sm text-text-muted mt-1">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-text-subtle mt-2">
                              <Clock className="h-3 w-3" />
                              <span>{service.duration} min</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-primary">
                              {formatPrice(Number(service.price))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vehicle & Additional Info Card */}
          <div className="bg-card border border-border rounded-xl p-6 transition-colors duration-300">
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Additional Information
            </h2>

            <div className="space-y-4">
              {/* Car Model */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                  <Car className="h-4 w-4" />
                  Vehicle Information (Optional)
                </label>
                <input
                  type="text"
                  name="carModel"
                  value={formData.carModel}
                  onChange={handleChange}
                  placeholder="e.g., Honda Civic 2020"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                  <FileText className="h-4 w-4" />
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional details or requests"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Booking...
              </>
            ) : (
              <>
                <MessageCircle className="h-5 w-5" />
                Confirm Booking via WhatsApp
              </>
            )}
          </button>
        </form>
      </div>

      {/* Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-card border border-border rounded-xl p-6 sticky top-24 transition-colors duration-300">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            Booking Summary
          </h2>

          {selectedServices.length > 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-muted mb-3">
                  Selected Services
                </p>
                <div className="space-y-2">
                  {services
                    .filter((s) => selectedServices.includes(s.id))
                    .map((service) => (
                      <div
                        key={service.id}
                        className="flex justify-between items-start gap-2 text-sm"
                      >
                        <span className="text-text-primary flex-1">
                          {service.title}
                        </span>
                        <span className="font-semibold text-text-primary">
                          {formatPrice(Number(service.price))}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-text-primary">
                    Estimated Total
                  </span>
                  <span className="text-2xl font-black text-primary">
                    {formatPrice(serviceTotal)}
                  </span>
                </div>
              </div>

              <div className="bg-primary/10 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Home Visit Service
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Our expert technicians will come directly to your location
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-text-subtle mx-auto mb-3" />
              <p className="text-text-muted">Select services to see pricing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
