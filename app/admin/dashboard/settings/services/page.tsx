"use client";

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Services & Pricing
        </h2>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">
            Available Services
          </h3>
          <button className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
            Add Service
          </button>
        </div>

        <div className="space-y-4">
          {[
            { name: "Oil Change", price: 45.99, duration: "30 min" },
            { name: "Brake Service", price: 129.99, duration: "2 hours" },
            { name: "Tire Rotation", price: 29.99, duration: "45 min" },
            { name: "Engine Diagnostics", price: 89.99, duration: "1 hour" },
          ].map((service, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 border border-border rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{service.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Duration: {service.duration}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">
                  PKR {service.price}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="text-muted-foreground hover:text-primary">
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button className="text-muted-foreground hover:text-red-500">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">
          Pricing Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              defaultValue="8.5"
              step="0.1"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Currency
            </label>
            <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option>PKR (Pakistani Rupee)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
