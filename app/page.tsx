import HomePageClient from "@/components/home/HomePageClient";
import WhatsAppFab from "@/components/layout/whatsapp-fab";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Shahzaib Electronics - Premium Car Accessories & Android Panels in Lahore",
  description:
    "Shahzaib Electronics is the leading direct importer and wholesale distributor of premium car accessories, Android panels, and audio systems in Lahore, Pakistan.",
};

export default function HomePage() {
  return (
    <>
      <HomePageClient />
      <WhatsAppFab />
    </>
  );
}
