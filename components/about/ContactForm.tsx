"use client";

import { useState } from "react";

export function ContactForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    message?: string;
    contact?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Please enter your name.";
    }
    if (!message.trim()) {
      newErrors.message = "Please enter a message.";
    }
    if (!email.trim() && !phone.trim()) {
      newErrors.contact =
        "Please provide either an email address or a phone number.";
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    // proceed with form submission logic (e.g. send to API)
    setSubmitted(true);
  };

  return (
    <section className="p-4 py-20 max-w-7xl mx-auto w-full">
      <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="p-8 md:p-12 space-y-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Get In Touch
            </h3>
            {submitted ? (
              <div className="text-center p-12">
                <span className="material-symbols-outlined text-6xl text-primary mb-4">
                  check_circle
                </span>
                <h4 className="text-2xl font-black text-white">Thank You!</h4>
                <p className="mt-2 text-white/90">
                  Your message has been sent successfully. We&apos;ll get back
                  to you shortly.
                </p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-white focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3 bg-slate-50 placeholder:text-slate-700 dark:placeholder:text-slate-400"
                      placeholder="name"
                      type="text"
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Email (optional)
                    </label>
                    <input
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-white focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3 bg-slate-50 placeholder:text-slate-700 dark:placeholder:text-slate-400"
                      placeholder="example@gmail.com"
                      type="email"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Phone (optional)
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-white focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3 bg-slate-50 placeholder:text-slate-700 dark:placeholder:text-slate-400"
                      placeholder="123456789"
                      type="tel"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3 bg-slate-50 placeholder:text-slate-700 dark:placeholder:text-slate-400 text-white"
                    placeholder="message"
                    rows={4}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 dark:hover:bg-black text-white dark:text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
                >
                  <span className="material-symbols-outlined">send</span>
                  Send Message
                </button>
                {errors.contact && (
                  <p className="mt-2 text-sm text-red-500 text-center">
                    {errors.contact}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Garage Details & Map */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-8 md:p-12 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full">
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Our Garage
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-full shadow-sm text-primary">
                    <span className="material-symbols-outlined text-xl">
                      location_on
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white mb-1">
                      Main Facility
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Shop no 3 Basher Centre,
                      <br />
                      Montgomery Road, Lahore
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-full shadow-sm text-primary">
                    <span className="material-symbols-outlined text-xl">
                      call
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white mb-1">
                      Phone & Support
                    </p>
                    <p className="text-sm text-slate-500">
                      <a href="tel:03260454233" className="hover:underline">
                        03260454233
                      </a>
                    </p>
                    <p className="text-sm text-slate-500">
                      <a
                        href="mailto:owner.shahzaib.autos@gmail.com"
                        className="hover:underline"
                      >
                        owner.shahzaib.autos@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-full shadow-sm text-primary">
                    <span className="material-symbols-outlined text-xl">
                      schedule
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white mb-1">
                      Business Hours
                    </p>
                    <p className="text-sm text-slate-500">
                      Mon - Sat: 9:00 AM - 6:00 PM
                    </p>
                    <p className="text-sm text-slate-500">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stylized Map Placeholder */}
            <div className="mt-10 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-200 relative group">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3399.4508994634107!2d74.32497027561348!3d31.566680874192755!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzHCsDM0JzAwLjEiTiA3NMKwMTknMzkuMiJF!5e0!3m2!1sen!2s!4v1772311405643!5m2!1sen!2s"
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Our location"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
