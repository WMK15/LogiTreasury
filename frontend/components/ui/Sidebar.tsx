"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "@/components/ui/ConnectWallet";

const navItems = [
  { href: "/", label: "Overview", icon: "◉" },
  { href: "/escrow", label: "Freight Escrow", icon: "◈" },
  { href: "/treasury", label: "Treasury", icon: "◇" },
  { href: "/fiat", label: "Fiat (CPN)", icon: "€" },
  { href: "/settlement", label: "Settlement", icon: "⬡" },
  { href: "/payroll", label: "Payroll", icon: "▤" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 border-r border-neutral-800 bg-neutral-950 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-neutral-800">
        <span className="text-sm font-medium">LogiTreasury</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
                }`}
              >
                <span className="text-xs opacity-60">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Wallet */}
      <div className="p-4 border-t border-neutral-800">
        <ConnectWallet />
      </div>
    </aside>
  );
}
