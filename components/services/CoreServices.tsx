import { Service, Image as DbImage } from "@prisma/client";
import Link from "next/link";

type ServiceWithImages = Service & { images: DbImage[] };

export function CoreServices({
  dbServices,
}: {
  dbServices: ServiceWithImages[];
}) {
  if (!dbServices || dbServices.length === 0) {
    return (
      <section className="px-4 py-16 text-center max-w-7xl mx-auto w-full">
        <h2 className="text-slate-900 border-b border-transparent text-xl font-bold">
          No Services Available Currently
        </h2>
      </section>
    );
  }

  return (
    <section
      id="pricing"
      className="px-4 py-16 max-w-7xl mx-auto w-full space-y-12"
    >
      <div className="flex flex-col gap-2 items-center text-center">
        <h2 className="text-slate-900 dark:text-white text-3xl font-black">
          Our Core Services
        </h2>
        <div className="h-1.5 w-16 bg-primary rounded-full mt-2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {dbServices.map((service) => {
          const imageSrc =
            service.images?.[0]?.secureUrl || "/placeholder-image.jpg";

          return (
            <div
              key={service.id}
              className="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="h-56 w-full bg-cover bg-center overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                  style={{ backgroundImage: `url("${imageSrc}")` }}
                />
              </div>
              <div className="p-8 flex flex-col flex-1">
                <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-1">
                  {service.title}
                </h3>
                <p className="text-primary font-black mb-3">
                  Starting at Rs. {service.price.toLocaleString()}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                  {service.description ||
                    "Premium automotive service by Shahzaib Autos."}
                </p>

                <Link
                  href={`/checkout?service=${service.slug}`}
                  className="w-full"
                >
                  <button className="w-full h-12 rounded-xl bg-primary/10 hover:bg-primary dark:bg-primary/20 dark:hover:bg-black text-primary hover:text-white text-sm font-bold transition-colors">
                    Book Now
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
