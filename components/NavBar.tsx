"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Omni Dialer", icon: "📞" },
  { href: "/dialer", label: "Manual Dialer", icon: "📞" },
  { href: "/auto-dialer", label: "Auto Dialer", icon: "🤖" },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/call-history", label: "Call History", icon: "🗒️" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 h-14 shrink-0">
      <nav className="flex items-center gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/settings"
        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        ⚙️ Settings
      </Link>
    </header>
  );
}
