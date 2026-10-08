import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel de administración" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
