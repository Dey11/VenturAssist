import type { Metadata } from "next";
import { DM_Sans, Geist, Geist_Mono, Platypi } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Venturassist",
  description: "Your AI VC Analyst",
};

const platypi = Platypi({
  variable: "--font-platypi",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${platypi.variable} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
