import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Our Work Portfolio",
  description:
    "Explore completed installation, detailing, wrap, and protection projects by Shahzaib Electronics in Lahore.",
};

export default function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
