"use client";

import { generateWhatsAppUrl, getWhatsAppNumber } from "@/lib/whatsapp";
import { RiWhatsappFill } from "react-icons/ri";

export default function WhatsAppFab() {
  const whatsappNumber = getWhatsAppNumber();

  if (!whatsappNumber) {
    return null;
  }

  const whatsappUrl = generateWhatsAppUrl(
    "Hi! I'm interested in your products.",
  );

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-60 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      data-testid="whatsapp-fab"
    >
      <RiWhatsappFill className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
