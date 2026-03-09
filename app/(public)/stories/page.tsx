"use client";

import Image from "next/image";
import { useState } from "react";

// Gallery items
const galleryItems = [
  {
    id: 1,
    title: "Mercedes AMG GT Satin Black Wrap",
    category: "wraps",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCjQj1f5HVACnX-pz3GVVhxJrHgCB-MekBhEvmPY2e9ORwMqvXMRdfcGvPK24QqMYxnpLZeivG4lVdHnN51fVz2NJlLMXMI1GDZBYbWDKiN0LiLcdZpTvpq5Q-lj0cBLKsRqY5jxcTTAG7qbO-z22D6GgxZBqPFIjJLYvA_3L1IqEoTz2qMSPNpXWjGFJfHiG1HMaYaGGJLQQ0i9LMCZiWVaH7Z4kNiV2i6rXZFnRTbQv7-J0Mz8Giq",
    aspectRatio: "portrait",
  },
  {
    id: 2,
    title: "BMW M4 Full Detail & Ceramic Coating",
    category: "detailing",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAjdT7hfoL0bBCuLu0_24Gaz4Ir9HPVZvWNSc6TaIs5OXLLzXvnkrwNEMH2PtnvYU5uwxuO95VEO-wOqlWH_9or9gMhXyIqphJ_K8BTT9WvNJEzT6c6FwwG-Yzle2k5D818OlVKlDxiigZnswdQdQwyo3lQW_0YaoSIXlRwji_3NHgzeHq0r221BBUVWUKJD4Fy7k12ikenxHjpOROfaNIOYZHvNQImHXut9RWaKw9d08nc2k64rC77L9nDcwMzKH-lnU_nw1nFQ8yl",
    aspectRatio: "landscape",
  },
  {
    id: 3,
    title: "Porsche 911 Custom Interior",
    category: "interior",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAAnU8s7DRK05vvR4-i9TX8ECgP8QvLGbjgOB7N3JiPM7Tkx9Y0qWbdhVYzI7RFlEYXaitEbWvV6t5seDCaQZuQymlp_XTueVHAX0zt1gsbh0w9rANbLF9t2vEH4IKs8mcAtxyjhcpdh0d7zgZUESohfW-Hb1LoAGL1ozmgQDSq1qLDmMIcXpQTotUmhFbrnO6ZM0e5Xbe3T6HcXmJBefZ11Sjqnyvjd6H2tBo7dtMpfgtsgeUVz-zdnuZcsHBLM5WIqH0KBRt3dqTP",
    aspectRatio: "square",
  },
  {
    id: 4,
    title: "Audi RS7 Matte Blue Wrap",
    category: "wraps",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAWugNyDlKtNxyczpj97MSJXcpRGmfPUXaSO1GaOpNhX9bXlZqQkMIa047q_4EB9U9E3ohLZlEu5pZJO7tq_hNjHOsFvFhGPUyoP7aeb_hSDw2NINFl29ikGdseQiCOkg8hGK-T_9-7RAff4V25Lwc_lHSBcscdWMgQUqJJFcm7U2qhaES8RV91flNRLb4pqhy11JGClDzC1D87NMirgpD5c_DPDwHty5d2wzeNqyWsXSHTzblsCeu2wTuWCFt8WAr3DCc0lEsU6L3t",
    aspectRatio: "landscape",
  },
  {
    id: 5,
    title: "Range Rover LED Headlight Upgrade",
    category: "lighting",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDEkjgKzomsWIoMV1OXiCPb-0zgpsuQYPf-imPBoqAJFZoqA0-EBUJMNAjFRSan16nAv1AVuaG7YINxpb4PLVUsEz8otwikp00yWVQcchjZ2B4CQcyW9BMpg64F1pwARYmy1WsOcVWSugSdX4AZuUZShXjTuxJLSs_sNC0VDS1Iy_PbUcJ4v7YURYrmCux9PsT3R0t8Jzm-jO2G9rV_gf4RqocbG23SrmvYwbYinqOcZ5prgzCVei0lxnK5TqWh-tjs1xA7G7GwDzEX",
    aspectRatio: "square",
  },
  {
    id: 6,
    title: "Tesla Model 3 PPF Installation",
    category: "protection",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBSAQvQI9ZeWRLqqwHULo7hjYVRmv_zhv_VR_pJxNVVRZZq1o_6V4e9KRe8-A4eK7dkIFumbvk3az_zjwPIfDvUxlWDNWHcHDa8LJWuTzOleCQyUTu-4tHpdFnEDYsedlQkMFL9uVTaxwLChErCFvGD5ipgheJILWknsYoG4TV-HIPtwqMmyDLwjPyb4OaLx_hshMNacNnwo8K79j1SD8uSKb7eV3YvXakE082bGjx1EMJZVMxzrDksYSp4-Th1LTRgrLksjvAZ-d4N",
    aspectRatio: "portrait",
  },
  {
    id: 7,
    title: "Ferrari 488 Caliper Painting",
    category: "detailing",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAzshqibUkfnmrePsD-zVSkACmgO2hNkwpndq_7UQ1kt4FyFmkhbThcP0_mNceFX-Nz9VahL8EsW5eJYv1cnSRkqBHBtdYL7_GqozYjb7i6BqJXA73QfbD6Jcb_ONwZ8wdR6rqJBSHRHkJEZftj8_19v7DAeMDmNrxEfg_MjcH5sP_3e0LyWWCk6M7-KpT-J_wSn5NOpm8ULIb3rbIP5q5_nPfwwKmN78j_5S7lT2AEHrEQSTuSYhU1NrdF2t8f2SitGNwvksMKtUNi",
    aspectRatio: "landscape",
  },
  {
    id: 8,
    title: "Lamborghini Urus Full Transformation",
    category: "wraps",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD_oVI-2UEPOrPZpB27TYqA10_x94-4GfE9rwkHSs_PysDrRiCmv6MhMKtfOe-iHp8bH1CBlNr3JKpqikB9OxLmt4orgRZq-RL64g_9XYTNtYFEV0SkCPSDw7Rd5hvte5I7PlXrr6IOSIBbV0HzJt22TVLdHGYXuDnYdLjsyOZik029nPNYGToyzJ9z1ZVSxWCZXIgDbE3wMExaszFdFVwvLhqNx2n6Si5MwYK7plUz76lirgk55gQFYy64a6zzu8imjLNTFT209kq7",
    aspectRatio: "square",
  },
  {
    id: 9,
    title: "G-Wagon Engine Bay Detailing",
    category: "detailing",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCoAbH75labLjI9IYarI3itXkkAQs2tKh0MhYLu3FpC-wPAUchj2nvP-ET-jZ65bmh8lOd-JlmtUF1QqR_qYshro76zifGO7J7Vl_Ynz4QbsMOpKd5_rfx4RVfCnDXCay2G7JqnygWg6MrIWXgS2FLTSxI612OsefrwVsVYVJRTlNrpXT6jXbDtYUJFWm6l0sE855BarVs3DMHwZjImgSv0k_7w3NRqwVz0rbcFXI4i2mHN2h4gYvCuj5e_dk2oSMFO2pQU98546QdZ",
    aspectRatio: "landscape",
  },
  {
    id: 10,
    title: "McLaren 720S Chrome Delete",
    category: "wraps",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAWugNyDlKtNxyczpj97MSJXcpRGmfPUXaSO1GaOpNhX9bXlZqQkMIa047q_4EB9U9E3ohLZlEu5pZJO7tq_hNjHOsFvFhGPUyoP7aeb_hSDw2NINFl29ikGdseQiCOkg8hGK-T_9-7RAff4V25Lwc_lHSBcscdWMgQUqJJFcm7U2qhaES8RV91flNRLb4pqhy11JGClDzC1D87NMirgpD5c_DPDwHty5d2wzeNqyWsXSHTzblsCeu2wTuWCFt8WAr3DCc0lEsU6L3t",
    aspectRatio: "portrait",
  },
  {
    id: 11,
    title: "Bentley Continental Leather Restoration",
    category: "interior",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAAnU8s7DRK05vvR4-i9TX8ECgP8QvLGbjgOB7N3JiPM7Tkx9Y0qWbdhVYzI7RFlEYXaitEbWvV6t5seDCaQZuQymlp_XTueVHAX0zt1gsbh0w9rANbLF9t2vEH4IKs8mcAtxyjhcpdh0d7zgZUESohfW-Hb1LoAGL1ozmgQDSq1qLDmMIcXpQTotUmhFbrnO6ZM0e5Xbe3T6HcXmJBefZ11Sjqnyvjd6H2tBo7dtMpfgtsgeUVz-zdnuZcsHBLM5WIqH0KBRt3dqTP",
    aspectRatio: "landscape",
  },
  {
    id: 12,
    title: "Rolls Royce Ghost Ceramic Pro",
    category: "protection",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAjdT7hfoL0bBCuLu0_24Gaz4Ir9HPVZvWNSc6TaIs5OXLLzXvnkrwNEMH2PtnvYU5uwxuO95VEO-wOqlWH_9or9gMhXyIqphJ_K8BTT9WvNJEzT6c6FwwG-Yzle2k5D818OlVKlDxiigZnswdQdQwyo3lQW_0YaoSIXlRwji_3NHgzeHq0r221BBUVWUKJD4Fy7k12ikenxHjpOROfaNIOYZHvNQImHXut9RWaKw9d08nc2k64rC77L9nDcwMzKH-lnU_nw1nFQ8yl",
    aspectRatio: "square",
  },
];

// Category filters
const categories = [
  { id: "all", label: "All Work" },
  { id: "wraps", label: "Wraps" },
  { id: "detailing", label: "Detailing" },
  { id: "interior", label: "Interior" },
  { id: "lighting", label: "Lighting" },
  { id: "protection", label: "Protection" },
];

export default function WorkPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);

  const filteredItems = galleryItems.filter(
    (item) => activeCategory === "all" || item.category === activeCategory,
  );

  const openLightbox = (id: number) => {
    setLightboxImage(id);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage(null);
  };

  const currentItem = galleryItems.find((item) => item.id === lightboxImage);

  return (
    <>
      {/* Header Section */}
      <section className="border-b border-border bg-section-bg pt-8 pb-8 transition-colors duration-300">
        <div className="px-4 md:px-8 lg:px-40">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-primary mb-2">
            Our Work
          </h1>
          <p className="text-text-muted max-w-2xl">
            Explore our portfolio of premium transformations. Every project is a
            testament to our dedication to excellence.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 border-b border-border bg-header-bg backdrop-blur supports-backdrop-filter:bg-header-bg/60 transition-colors duration-300">
        <div className="px-4 md:px-8 lg:px-40 py-4">
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeCategory === category.id
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-border bg-card text-text-muted hover:bg-muted hover:text-text-primary"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Masonry Gallery */}
      <section className="px-4 md:px-8 lg:px-40 py-12">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="break-inside-avoid group cursor-pointer"
              onClick={() => openLightbox(item.id)}
            >
              <div
                className={`relative overflow-hidden rounded-xl border border-border bg-card ${
                  item.aspectRatio === "portrait"
                    ? "aspect-3/4"
                    : item.aspectRatio === "square"
                      ? "aspect-square"
                      : "aspect-4/3"
                }`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
                      {categories.find((c) => c.id === item.category)?.label}
                    </p>
                    <h3 className="text-white font-semibold">{item.title}</h3>
                  </div>
                </div>
                {/* Zoom Icon */}
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white text-[20px]">
                    zoom_in
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-12 flex justify-center">
          <button className="px-6 py-2 rounded-md border border-border bg-card hover:bg-muted hover:text-text-primary text-text-muted font-medium text-sm transition-colors flex items-center gap-2">
            Load More
            <span className="material-symbols-outlined text-[18px]">
              expand_more
            </span>
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 md:px-8 lg:px-40 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-card border border-border rounded-xl transition-colors duration-300">
            <div className="text-4xl font-black text-primary mb-2">500+</div>
            <p className="text-text-muted text-sm">Cars Transformed</p>
          </div>
          <div className="text-center p-6 bg-card border border-border rounded-xl transition-colors duration-300">
            <div className="text-4xl font-black text-primary mb-2">50+</div>
            <p className="text-text-muted text-sm">Premium Brands</p>
          </div>
          <div className="text-center p-6 bg-card border border-border rounded-xl transition-colors duration-300">
            <div className="text-4xl font-black text-primary mb-2">10+</div>
            <p className="text-text-muted text-sm">Years Experience</p>
          </div>
          <div className="text-center p-6 bg-card border border-border rounded-xl transition-colors duration-300">
            <div className="text-4xl font-black text-primary mb-2">100%</div>
            <p className="text-text-muted text-sm">Satisfaction</p>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxOpen && currentItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-white text-[28px]">
              close
            </span>
          </button>
          <div
            className="relative max-w-5xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-4/3 rounded-xl overflow-hidden">
              <Image
                src={currentItem.image}
                alt={currentItem.title}
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-primary font-medium uppercase tracking-wide mb-1">
                {categories.find((c) => c.id === currentItem.category)?.label}
              </p>
              <h3 className="text-xl font-bold text-white">
                {currentItem.title}
              </h3>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
