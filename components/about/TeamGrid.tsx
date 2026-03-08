const team = [
  {
    name: "Marcus Sterling",
    role: "Master Technician",
    bio: "20+ years specialized in European luxury engines.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCrkPUfYOBhTwzFvy2vgBy_P-HbZnkXR8CaT1XGyCVjkLBAt75GVWz4jtnWwgfVAebbBmVDMsCmqRTQtTs3QW2Ie28Q4Xsecbsd0_rAzIRUOEm5xE7yRtV8kXL7vpFt3RubqhglEQiQiUgTEqSrEmI1CJYNA9Y7ldEMfoVfL5efRo9WanUQERCDErW-Bd4Dz8XdV7EM5ASPBT7lagg5JrbZTIjSZgohf7VZBNHb3OstHB_IhMtWuBl4V80xWiTVB-cH9yYOXmHRnEzh",
  },
  {
    name: "Elena Vance",
    role: "Service Advisor",
    bio: "Ensuring seamless client experiences since 2012.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBqjewFDiZ_TWS8SYXMRbK5mHc1u_kCAWN38sSP49vMeMLaduR7umjzXpeeUKMQ_rSHdIZ-WK5FQD7-4MXmWz7aDtaAo0Lmsv-q0kd3dKRFWGIJ-BU5i1TjqJEQNiKQQamEfsytKZJIF1wqHAdg1ExEp2zGIFk8TtbhhYduC5LT08-3n1VR61LBnpyBlcQtMlKQNuD60CSRyuRnfer0AkELQfUZIPSL_uHCvn_DTM6GBRFp76i6RWk8w_J51vLEhXj9SCRRRHPz4Vhj",
  },
  {
    name: "David Chen",
    role: "Performance Lead",
    bio: "Specialist in custom tuning and aerodynamics.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAYRdbDUFOYXy0g8hXhmUBl3Kzx-XFpW3DxGhTXzfBqH5xwu4f37DgYe9H9Km4RQxzVkwTxKCGJDr1ovg-06fj9wtC3B-2ay3AHQbIQp-QfANfZr2ZgZkhUn4-A5zuWMQ4Gb4uZdT6Qu-XNnlY6fMVps03H96bX9KAv7Z263jZsMNVct81bsYBY2cmLkLNpB-V5p5UeMxiFK6BOetTBLcEtq5V1wid4-mKdzLoriqeRFPP0jnzENDn071TbIb6-eFLa-uvAKgEjPe3B",
  },
];

export function TeamGrid() {
  return (
    <section className="px-4 py-20 bg-slate-50 dark:bg-slate-900/40 w-full">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-black text-primary mb-4">
            Meet the Team
          </h3>
          <div className="h-1.5 w-16 bg-primary mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
          {team.map((member, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center space-y-4 group"
            >
              <div className="size-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl group-hover:scale-105 group-hover:border-primary transition-all duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover"
                  alt={member.name}
                  src={member.image}
                />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                  {member.name}
                </h4>
                <p className="text-primary text-xs font-black uppercase tracking-widest mt-1 mb-3">
                  {member.role}
                </p>
                <p className="text-sm text-slate-500 max-w-[200px] mx-auto">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
