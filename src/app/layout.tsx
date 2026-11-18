import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import "./marketplace.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Marketplace", template: "%s · Marketplace" },
  description: "Buy and sell items in your community. A mini Facebook Marketplace built with Next.js and Supabase.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1877F2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-[#f0f2f5] antialiased`}>
        <Header />
        <main>{children}</main>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
