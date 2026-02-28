"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/employer", label: "Employer" },
  { href: "/employee", label: "Employee" },
  { href: "/treasury", label: "Treasury" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold">
              P
            </div>
            <span className="font-bold text-xl">PayrollArena</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-primary-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Wallet Connect */}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
