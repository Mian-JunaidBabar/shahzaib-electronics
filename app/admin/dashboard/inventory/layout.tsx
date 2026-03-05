import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory | Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
