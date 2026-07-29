import type { ServiceDTO } from "@/lib/types/dto";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomerData {
  fullName: string;
  email: string;
  phone: string;
  vehicleModel: string;
  address: string;
}

interface CheckoutFormProps {
  customerData: CustomerData;
  setCustomerData: (
    data: CustomerData | ((prev: CustomerData) => CustomerData),
  ) => void;
  city: string;
  setCity: (city: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  availableServices: Array<Pick<ServiceDTO, "id" | "title" | "price">>;
  selectedServiceIds: string[];
  onServiceToggle: (id: string) => void;
  bookingDate: string;
  setBookingDate: (date: string) => void;
  fieldErrors?: Record<string, string>;
}

export function CheckoutForm({
  customerData,
  setCustomerData,
  city,
  setCity,
  paymentMethod,
  setPaymentMethod,
  availableServices,
  selectedServiceIds,
  onServiceToggle,
  bookingDate,
  setBookingDate,
  fieldErrors,
}: CheckoutFormProps) {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const inputClasses = (error?: string) =>
    `mt-1 block w-full rounded-xl px-4 h-14 border ${error ? "border-red-400 bg-red-50 focus:ring-red-200" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary"} text-slate-900 dark:text-white outline-none transition-all shadow-sm`;

  return (
    <div className="flex-1 p-0 lg:p-4 space-y-6">
      {/* Section: Contact Information */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">person</span>
          <h2 className="text-xl font-bold dark:text-white">
            Contact Information
          </h2>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">
              Full Name *
            </span>
            <input
              name="fullName"
              value={customerData.fullName}
              onChange={handleInputChange}
              className={inputClasses(fieldErrors?.fullName)}
              placeholder="name"
              type="text"
            />
            {fieldErrors?.fullName && (
              <p className="mt-1 text-xs text-red-600 ml-1">
                {fieldErrors.fullName}
              </p>
            )}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">
                Email Address
              </span>
              <input
                name="email"
                value={customerData.email}
                onChange={handleInputChange}
                className={inputClasses(fieldErrors?.email)}
                placeholder="example@gmail.com"
                type="email"
              />
              {fieldErrors?.email && (
                <p className="mt-1 text-xs text-red-600 ml-1">
                  {fieldErrors.email}
                </p>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">
                Phone Number *
              </span>
              <input
                name="phone"
                value={customerData.phone}
                onChange={handleInputChange}
                className={inputClasses(fieldErrors?.phone)}
                placeholder="123456789"
                type="tel"
              />
              {fieldErrors?.phone && (
                <p className="mt-1 text-xs text-red-600 ml-1">
                  {fieldErrors.phone}
                </p>
              )}
            </label>
          </div>
        </div>
      </section>

      {/* Section: Professional Services (Upsell) */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">build</span>
          <h2 className="text-xl font-bold dark:text-white">
            Professional Services
          </h2>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-medium">
            Select any installation or tuning services to expertly add to your
            order.
          </p>
          {availableServices.map((service) => {
            const isSelected = selectedServiceIds.includes(service.id);
            return (
              <label
                key={service.id}
                className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all duration-200 group hover:shadow-sm ${isSelected
                  ? "bg-slate-900 border-slate-800 text-white dark:bg-primary/10 dark:border-primary/50 dark:text-primary"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onServiceToggle(service.id)}
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span
                      className={`font-medium ${isSelected
                        ? "text-white dark:text-primary-light"
                        : "text-slate-800 dark:text-slate-200"
                        }`}
                    >
                      {service.title}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                        Added to order
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`font-bold ${isSelected
                    ? "text-white dark:text-primary"
                    : "text-slate-600 dark:text-slate-400"
                    }`}
                >
                  + Rs. {service.price.toLocaleString()}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Section: Vehicle & Date (Conditional) */}
      {selectedServiceIds.length > 0 && (
        <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">
              directions_car
            </span>
            <h2 className="text-xl font-bold dark:text-white">
              Vehicle Details
            </h2>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">
                Car Make & Model
              </span>
              <input
                name="vehicleModel"
                value={customerData.vehicleModel}
                onChange={handleInputChange}
                className={inputClasses(fieldErrors?.vehicleModel)}
                placeholder="vehicle model"
                type="text"
              />
              {fieldErrors?.vehicleModel && (
                <p className="mt-1 text-xs text-red-600 ml-1">
                  {fieldErrors.vehicleModel}
                </p>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">
                Preferred Date
              </span>
              <div className="relative">
                <input
                  name="bookingDate"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className={inputClasses(undefined) + " w-full"}
                />
              </div>
            </label>
          </div>
        </section>
      )}

      {/* Section: Delivery Location & Shipping City */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">
            location_on
          </span>
          <h2 className="text-xl font-bold dark:text-white">
            Delivery & Shipping Location
          </h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">
                Shipping City *
              </span>
              <Select
                value={
                  ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"].includes(city)
                    ? city
                    : "Other"
                }
                onValueChange={(val) => {
                  if (val !== "Other") {
                    setCity(val);
                  } else {
                    setCity("Other");
                  }
                }}
              >
                <SelectTrigger
                  className={`mt-1 flex w-full rounded-xl px-4 h-14 border ${fieldErrors?.city ? "border-red-400 bg-red-50 focus:ring-red-200" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary"} text-slate-900 dark:text-white outline-none transition-all shadow-sm text-base font-normal`}
                  data-testid="shipping-city-select"
                >
                  <SelectValue placeholder="Select Shipping City" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="w-[var(--radix-select-trigger-width)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-50 p-1"
                >
                  <SelectItem value="Lahore">Lahore</SelectItem>
                  <SelectItem value="Karachi">Karachi</SelectItem>
                  <SelectItem value="Islamabad">Islamabad</SelectItem>
                  <SelectItem value="Rawalpindi">Rawalpindi</SelectItem>
                  <SelectItem value="Faisalabad">Faisalabad</SelectItem>
                  <SelectItem value="Multan">Multan</SelectItem>
                  <SelectItem value="Peshawar">Peshawar</SelectItem>
                  <SelectItem value="Quetta">Quetta</SelectItem>
                  <SelectItem value="Other">Other City (Outside Lahore)</SelectItem>
                </SelectContent>
              </Select>
              {city.trim().toLowerCase() === "lahore" ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 ml-1">
                  Flat Rs. 300 delivery charge for Lahore.
                </p>
              ) : (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 ml-1 font-medium">
                  + Delivery charges apply for cities outside Lahore (calculated on dispatch).
                </p>
              )}
              {fieldErrors?.city && (
                <p className="mt-1 text-xs text-red-600 ml-1">
                  {fieldErrors.city}
                </p>
              )}
            </label>

            {(!["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"].includes(city) || city === "Other") && (
              <label className="block">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">
                  Custom City Name
                </span>
                <input
                  type="text"
                  name="customCity"
                  value={city === "Other" ? "" : city}
                  placeholder="Enter city name"
                  onChange={(e) => setCity(e.target.value || "Other")}
                  className={inputClasses(undefined)}
                  data-testid="custom-city-input"
                />
              </label>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">
              Full Address / Delivery Details
            </span>
            <textarea
              name="address"
              value={customerData.address}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-xl p-4 border ${fieldErrors?.address ? "border-red-400 bg-red-50 focus:ring-red-200" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary"} text-slate-900 dark:text-white outline-none transition-all shadow-sm resize-none`}
              placeholder="Full delivery address, street, house number, area"
              rows={3}
            ></textarea>
            {fieldErrors?.address && (
              <p className="mt-1 text-xs text-red-600 ml-1">
                {fieldErrors.address}
              </p>
            )}
          </label>
        </div>
      </section>

      {/* Section: Payment Method */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">
            payments
          </span>
          <h2 className="text-xl font-bold dark:text-white">
            Payment Method
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "cod"
              ? "bg-slate-900 text-white border-slate-800 dark:bg-primary/10 dark:border-primary dark:text-white font-semibold"
              : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
              data-testid="payment-cod-radio"
            />
            <div>
              <span className="font-bold block text-sm">Cash on Delivery</span>
              <span className="text-xs opacity-75">Pay on delivery (5% COD Tax applies)</span>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "online"
              ? "bg-slate-900 text-white border-slate-800 dark:bg-primary/10 dark:border-primary dark:text-white font-semibold"
              : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={paymentMethod === "online"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
              data-testid="payment-online-radio"
            />
            <div>
              <span className="font-bold block text-sm">Online Payment</span>
              <span className="text-xs opacity-75">Card or Bank Transfer</span>
            </div>
          </label>
        </div>
      </section>
    </div>
  );
}
