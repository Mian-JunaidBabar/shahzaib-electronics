import HomePageClient from "@/components/home/HomePageClient";
import { WeeklyBestSellers } from "@/components/home/WeeklyBestSellers";
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
      {/* WeeklyBestSellers is an async Server Component — it's rendered
          here (in this Server Component) and handed down to the client
          tree as a prop, rather than imported inside HomePageClient. */}
      <HomePageClient weeklyBestSellers={<WeeklyBestSellers />} />
      <WhatsAppFab />
    </>
  );
}
