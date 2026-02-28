import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/ui/Navigation";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PayrollArena",
  description: "Programmable payroll and USDC escrow",
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
          <Navigation />
          <main className="max-w-5xl mx-auto px-6 py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
