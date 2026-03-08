export function AboutOrigin() {
  return (
    <section className="px-4 py-16 max-w-7xl mx-auto space-y-8 w-full">
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        {/* Left: Image */}
        <div className="flex-1 w-full relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none aspect-video bg-slate-200 border-4 border-white dark:border-slate-800 relative z-10 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="w-full h-full object-cover"
              alt="Interior of a luxury modern automotive garage with specialized tools"
              src="/about/about-hero.png"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 md:-bottom-8 md:-right-8 w-1/2 h-1/2 bg-primary rounded-3xl z-0 -rotate-3 blur-sm opacity-20"></div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-primary">
              The Shahzaib Autos Origin
            </h3>
            <div className="h-1.5 w-16 bg-primary rounded-full"></div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
              Founded on the principles of mechanical excellence, Shahzaib Autos
              has evolved from a boutique restoration shop into a leading
              premium service center.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
              <div className="bg-primary/20 dark:bg-primary/30 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[24px]">
                  verified
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                  Quality
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  Uncompromising standards in every component.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
              <div className="bg-primary/20 dark:bg-primary/30 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[24px]">
                  precision_manufacturing
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                  Precision
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  Calibrated to factory-grade specifications.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
              <div className="bg-primary/20 dark:bg-primary/30 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[24px]">
                  lightbulb
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                  Innovation
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  Leading the edge in diagnostics technology.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
