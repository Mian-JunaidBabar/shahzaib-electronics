"use client";

import { useState } from "react";

export function NewsletterCta() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 mb-24">
      <div className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-16 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-5xl font-black text-white">
            Get Exclusive Access
          </h2>
          <p className="text-slate-400 text-lg">
            Join our newsletter to receive weekly updates on new arrivals,
            exclusive discounts, and car modification tips.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
            aria-label="Newsletter signup"
            onSubmit={handleSubmit}
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:ring-primary focus:border-primary px-6 py-4"
              placeholder="Your email address"
              type="email"
              required
            />
            <button
              className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-xl transition-all disabled:opacity-60"
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Subscribe"}
            </button>
          </form>
          {status === "success" && (
            <div className="mt-4 max-w-md mx-auto rounded-lg bg-green-600 text-white px-4 py-3">
              Thanks for signing up — check your inbox for a welcome email!
            </div>
          )}
          {status === "error" && (
            <div className="mt-4 max-w-md mx-auto rounded-lg bg-red-600 text-white px-4 py-3">
              Something went wrong. Please try again later.
            </div>
          )}
          <p className="text-xs text-slate-500">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
