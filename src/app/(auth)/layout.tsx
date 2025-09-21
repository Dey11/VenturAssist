import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Authentication - Venturassist",
  description: "Your AI VC Analyst",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="mx-auto max-w-7xl">{children}</div>;
}
