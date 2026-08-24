"use client";

import { useState } from "react";
import { createLeadAction } from "@/app/actions/leadActions";

export function ContactForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newsletterNote, setNewsletterNote] = useState<string | null>(null);
  // Use a flexible errors map so server-side validation arrays can be mapped
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Please enter your name.";
    }
    if (!message.trim()) {
      newErrors.message = "Please enter a message.";
    }

    // Require at least one contact method
    if (!email.trim() && !phone.trim()) {
      newErrors.contact =
        "Please provide either an email address or a phone number.";
    }
    if (subscribeNewsletter && !email.trim()) {
      newErrors.contact = "Please provide an email to join the newsletter.";
    }

    // Client-side phone sanity checks for immediate helpful feedback
    if (phone.trim()) {
      const digits = phone.replace(/\D/g, "");
      if (phone.includes("@") || /[a-zA-Z]/.test(phone)) {
        newErrors.phone =
          "It looks like you entered an email in the phone field — please put emails in the Email field.";
      } else if (digits.length < 6 || digits.length > 15) {
        newErrors.phone =
          "Phone number looks incorrect — include country code if applicable.";
      } else if (!/^[\d+\-\s()]+$/.test(phone)) {
        newErrors.phone = "Phone number contains invalid characters.";
      }
    }

    // Quick email format check
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setNewsletterNote(null);
    setIsSubmitting(true);

    try {
      const result = await createLeadAction({
        name: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        message: message.trim(),
        source: "CONTACT_FORM",
      });

      if (!result.success) {
        // server may return structured validation errors (array)
        if (result.error) {
          try {
            const parsed = JSON.parse(result.error);
            if (Array.isArray(parsed)) {
              const mapped: Record<string, string> = {};
              parsed.forEach((err: { path?: string[]; message?: string }) => {
                const key =
                  Array.isArray(err.path) && err.path[0]
                    ? err.path[0]
                    : undefined;
                if (key) mapped[key] = err.message || JSON.stringify(err);
              });
              if (Object.keys(mapped).length) {
                setErrors(mapped);
                return;
              }
            }
          } catch {
            // not JSON - fall through to generic handling
          }
        }

        setSubmitError(result.error || "Failed to send your message.");
        return;
      }

      if (subscribeNewsletter && email.trim()) {
        const response = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), source: "CONTACT_FORM" }),
        });

        if (!response.ok) {
          setNewsletterNote(
            "Your inquiry was sent, but newsletter signup could not be completed.",
          );
        }
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Contact form submission error:", error);
      setSubmitError("Unable to submit right now. Please try again shortly.");
    } finally {
      setIsSubmitting(false);
    }
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
                  Your inquiry has been sent to Shahzaib Electronics. We&apos;ll
                  get back to you shortly.
                </p>
                {newsletterNote && (
                  <p className="mt-4 text-sm text-amber-300">
                    {newsletterNote}
                  </p>
                )}
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
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.email}
                      </p>
                    )}
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
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.phone}
                      </p>
                    )}
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

                <label className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/60">
                  <input
                    type="checkbox"
                    checked={subscribeNewsletter}
                    onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Subscribe me to the newsletter for product updates and
                    offers.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 dark:hover:bg-black text-white dark:text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
                >
                  <span className="material-symbols-outlined">send</span>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
                {errors.contact && (
                  <p className="mt-2 text-sm text-red-500 text-center">
                    {errors.contact}
                  </p>
                )}
                {submitError && (
                  <p className="mt-2 text-sm text-red-500 text-center">
                    {submitError}
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
                  <a
                    href="https://maps.app.goo.gl/ZK39GAaXz7YtbBQd6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 group/loc hover:opacity-80 transition-opacity"
                  >
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-full shadow-sm text-primary">
                      <span className="material-symbols-outlined text-xl">
                        location_on
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white mb-1 group-hover/loc:underline">
                        Main Facility
                      </p>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Shop no 3 Basher Centre,
                        <br />
                        Montgomery Road, Lahore
                      </p>
                    </div>
                  </a>
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

                <div className="flex items-start gap-4">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-full shadow-sm text-primary">
                    <span className="material-symbols-outlined text-xl">
                      share
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white mb-1">
                      Follow Us
                    </p>
                    <p className="text-sm text-slate-500 space-x-3">
                      <a
                        href="https://www.facebook.com/shahzaibelectronics1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Facebook
                      </a>
                      <a
                        href="https://www.instagram.com/shahzaib.electronics/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Instagram
                      </a>
                      <a
                        href="https://www.tiktok.com/@shahzaibelectronics_1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        TikTok
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Embed */}
            <div className="mt-10 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-200 relative group">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d54379.719381609895!2d74.27301166157557!3d31.586383701382523!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39191b17b7db6185%3A0x6c0fc076f222d89c!2sShahzaib%20Electronics!5e0!3m2!1sen!2s!4v1787563069506!5m2!1sen!2s"
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Shahzaib Electronics - Shop No. 3 Basher Centre, Montgomery Road, Lahore"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
