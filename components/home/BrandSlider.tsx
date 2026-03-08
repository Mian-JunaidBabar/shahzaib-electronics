import { SiToyota, SiHonda, SiSuzuki, SiKia, SiNissan } from "react-icons/si";

export function BrandSlider() {
  const vehicleBrands = [
    { name: "Toyota", icon: SiToyota },
    { name: "Honda", icon: SiHonda },
    { name: "Suzuki", icon: SiSuzuki },
    { name: "Kia", icon: SiKia },
    { name: "Nissan", icon: SiNissan },
    { name: "Daihatsu", icon: null },
  ];

  const techBrands = [
    { name: "Pioneer" },
    { name: "JBL" },
    { name: "Kenwood" },
    { name: "Sony" },
    { name: "Nakamichi" },
    { name: "Sansui" },
  ];

  // Duplicate arrays to ensure seamless infinite looping
  const duplicatedVehicles = [
    ...vehicleBrands,
    ...vehicleBrands,
    ...vehicleBrands,
    ...vehicleBrands,
  ];
  const duplicatedTechBrands = [
    ...techBrands,
    ...techBrands,
    ...techBrands,
    ...techBrands,
  ];

  return (
    <section className="py-12 bg-white/50 border-y border-primary/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
          Our Trusted Partner Brands
        </h3>

        <div className="flex flex-col gap-6 w-full relative">
          {/* Top Row: Vehicles - Moves Left */}
          <div className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex shrink-0 animate-marquee-left gap-4 hover:[animation-play-state:paused] w-max">
              {duplicatedVehicles.map((brand, i) => (
                <div
                  key={`vehicle-${i}`}
                  className="flex items-center justify-center w-40 h-16 shrink-0 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold uppercase tracking-wider text-sm hover:border-primary hover:text-primary transition-all cursor-pointer box-border"
                >
                  {brand.icon ? <brand.icon size={40} /> : brand.name}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Row: Tech - Moves Right */}
          <div className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex shrink-0 animate-marquee-right gap-4 hover:[animation-play-state:paused] w-max">
              {duplicatedTechBrands.map((brand, i) => (
                <div
                  key={`tech-${i}`}
                  className="flex items-center justify-center w-40 h-16 shrink-0 rounded-xl border border-slate-300 bg-transparent text-slate-800 font-black text-xl tracking-tighter hover:border-primary hover:text-primary transition-all cursor-pointer box-border"
                >
                  {brand.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
