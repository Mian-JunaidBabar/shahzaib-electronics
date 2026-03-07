import { OptimizedImage } from "@/components/optimized-image";
import Link from "next/link";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">
                workspace_premium
              </span>{" "}
              2026 Collection
            </div>
            <h2 className="text-5xl lg:text-7xl font-black leading-[1.1] text-slate-900">
              Premium Car Accessories &amp;{" "}
              <span className="text-primary">Upgrades</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              Enhance your driving experience with our curated collection of
              high-end automotive enhancements, from carbon fiber trims to
              audiophile-grade sound systems.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/30 hover:-translate-y-1 transition-transform"
              >
                Shop Now
              </Link>
              <Link
                href="/products"
                className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                View Catalog
              </Link>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-4xl blur-3xl group-hover:bg-primary/30 transition-colors"></div>
            <div className="relative aspect-video lg:aspect-square rounded-4xl shadow-2xl overflow-hidden border-4 border-white dark:border-slate-800">
              <OptimizedImage
                alt="Modern luxury car interior featuring high-end dashboard accessories"
                src="/home/home-hero.png"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
