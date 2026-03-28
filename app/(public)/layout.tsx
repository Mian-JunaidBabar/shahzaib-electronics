import WhatsAppFab from "@/components/layout/whatsapp-fab";
import { ThemeProvider } from "@/context/theme-context";
import { CartProvider } from "@/context/cart-context";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shahzaib Electronics - Premium Automotive Services",
  description:
    "Premium car accessories and professional installation services. From detailing to custom modifications, we do it all.",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider forcedTheme="light">
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <CartProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppFab />
          </div>
        </CartProvider>
      </div>
    </ThemeProvider>
  );
}
