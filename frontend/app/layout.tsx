import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/ui/Sidebar";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LogiTreasury",
  description: "European logistics treasury and settlement platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-neutral-950 text-neutral-100 min-h-screen font-sans">
        <Providers>
          <Toaster theme="dark" position="top-right" />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-56">
              <div className="max-w-6xl mx-auto px-6 py-6">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
