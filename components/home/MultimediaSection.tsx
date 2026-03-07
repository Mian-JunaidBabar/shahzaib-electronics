import Link from "next/link";

export function MultimediaSection() {
  const features = [
    {
      icon: "settings_input_component",
      title: "Android LCDs",
      desc: "Premium touch interfaces with wireless CarPlay.",
    },
    {
      icon: "speaker",
      title: "Subwoofers",
      desc: "Deep bass solutions for every vehicle type.",
    },
    {
      icon: "graphic_eq",
      title: "DSP Processors",
      desc: "Crystal clear audio tuning for enthusiasts.",
    },
    {
      icon: "speed",
      title: "Speed Sensors",
      desc: "Advanced monitoring for safety and performance.",
    },
  ];

  return (
    <section className="bg-primary/5 dark:bg-slate-900/50 py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              {features.slice(0, 2).map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="material-symbols-outlined text-primary text-4xl mb-4">
                    {feature.icon}
                  </span>
                  <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              ))}
            </div>
            <div className="pt-12 space-y-6">
              {features.slice(2, 4).map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="material-symbols-outlined text-primary text-4xl mb-4">
                    {feature.icon}
                  </span>
                  <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-black text-slate-900 leading-tight">
              Next-Gen Multimedia <br />
              Experience
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Revolutionize your cabin with our smart entertainment systems.
              Featuring high-definition Android displays, immersive sound
              stages, and seamless smartphone integration.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 font-semibold">
                <span className="material-symbols-outlined text-primary">
                  check_circle
                </span>{" "}
                4K Ultra-HD Resolution
              </li>
              <li className="flex items-center gap-3 font-semibold">
                <span className="material-symbols-outlined text-primary">
                  check_circle
                </span>{" "}
                Lossless Audio Support
              </li>
              <li className="flex items-center gap-3 font-semibold">
                <span className="material-symbols-outlined text-primary">
                  check_circle
                </span>{" "}
                Real-time OBD Integration
              </li>
            </ul>
            <Link
              href="/products"
              className="mt-4 px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-primary/50 transition-shadow inline-block"
            >
              Explore Multimedia
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
