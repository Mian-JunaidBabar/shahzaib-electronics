"use client";

import { useRouter } from "next/navigation";

const TOP_VEHICLES = [
  "Alto",
  "WagonR",
  "Cultus",
  "City",
  "Yaris",
  "Mira",
  "Corolla",
  "Civic"
];

type TopVehiclesNavProps = {
  basePath?: string;
};

export default function TopVehiclesNav({
  basePath = "/products",
}: TopVehiclesNavProps) {
  const router = useRouter();

  return (
    <section className="w-full bg-slate-50 border-b border-slate-200 dark:bg-slate-900/70 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="shrink-0 text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">
            Top Vehicles
          </span>

          {TOP_VEHICLES.map((vehicle) => (
            <button
              key={vehicle}
              type="button"
              onClick={() =>
                router.push(`${basePath}?q=${encodeURIComponent(vehicle)}`)
              }
              className="shrink-0 rounded-full border border-red-500 px-4 py-1.5 text-sm font-bold text-white hover:text-red-600 transition-colors"
            >
              {vehicle}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
