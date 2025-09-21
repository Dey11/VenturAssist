import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import "../globals.css";
import Sidebar from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Venturassist",
  description: "Your AI VC Analyst",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <Sidebar />
      <div className="mx-auto max-w-7xl p-2 pl-[5svw]">{children}</div>
    </div>
  );
}
