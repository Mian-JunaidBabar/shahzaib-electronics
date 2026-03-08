export function BrandSlider() {
  const brands = ["Toyota", "Honda", "BMW", "Mercedes", "Audi"];

  return (
    <section className="py-12 bg-white/50 dark:bg-background-dark/50 border-y border-primary/10">
      <div className="max-w-7xl mx-auto px-4">
        <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
          Our Trusted Partner Brands
        </h3>
        <div className="flex flex-wrap justify-center gap-8 lg:gap-16 transition-all duration-200">
          {brands.map((brand, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 cursor-pointer group hover:scale-105 transition-transform"
            >
              <div className="w-10 h-10 bg-slate-900 dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-white dark:text-white group-hover:text-primary transition-colors">
                  directions_car
                </span>
              </div>
              <span className="font-bold text-lg text-black dark:text-black">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
