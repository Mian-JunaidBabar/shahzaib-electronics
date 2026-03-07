import Link from "next/link";

export function ContactCTA() {
  return (
    <section className="p-4 py-20 max-w-7xl mx-auto w-full">
      <div className="bg-linear-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-850 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Call‑to‑action Content */}
          <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full w-fit">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  location_on
                </span>
                <span className="text-sm font-bold text-primary">Visit Us</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                Get in Touch
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Have questions about our products or services? Our expert team
                is ready to help you with any inquiries or schedule an
                appointment.
              </p>
            </div>

            {/* Quick Info */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary shrink-0">
                  phone
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  03260454233
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary shrink-0">
                  schedule
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Mon-Sat: 9:00 AM - 6:00 PM
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary shrink-0">
                  mail
                </span>
                <a
                  href="mailto:owner.shahzaib.autos@gmail.com"
                  className="text-slate-700 dark:text-slate-300 font-medium hover:underline"
                >
                  owner.shahzaib.autos@gmail.com
                </a>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 dark:hover:bg-black text-white dark:text-slate-900 py-3.5 px-6 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
              >
                <span className="material-symbols-outlined text-[20px]">
                  mail
                </span>
                Contact Us
              </Link>
              <a
                href="https://wa.me/923260454233"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-6 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chat
                </span>
                WhatsApp
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="p-8 md:p-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800/50">
            <div className="w-full h-full min-h-100 rounded-2xl overflow-hidden shadow-lg">
              <iframe
                title="Location map"
                src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3399.4508994634107!2d74.32497027561342!3d31.566680874192755!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzHCsDM0JzAwLjEiTiA3NMKwMTknMzkuMiJF!5e0!3m2!1sen!2s!4v1772400235725!5m2!1sen!2s"
                width="100%"
                height="100%"
                className="border-none"
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
