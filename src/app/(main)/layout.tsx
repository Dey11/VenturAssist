import type { Metadata } from "next";
import "../globals.css";
import Sidebar from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Venturassist",
  description: "Your AI VC Analyst",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Sidebar />
      <div className="mx-auto max-w-7xl p-2 pl-[5svw]">{children}</div>
    </div>
  );
}
