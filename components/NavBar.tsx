"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/dialer", label: "Manual Dialer", icon: "📞" },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/call-history", label: "Call History", icon: "🗒️" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-5 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm shadow-sm shadow-blue-200">
            📞
          </span>
          <span className="text-sm font-semibold tracking-tight text-gray-900">
            Omni Dialer
          </span>
        </div>

        <nav className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Link
        href="/settings"
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-slate-100 hover:text-gray-800"
      >
        ⚙️ Settings
      </Link>
    </header>
  );
}
