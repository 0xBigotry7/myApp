"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";

export default function MobileNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = getTranslations(locale);

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      path: "/",
      icon: "✈️",
      label: t.myTrips || "Trips",
    },
    {
      path: "/finance",
      icon: "💰",
      label: t.finance || "Finance",
    },
    {
      path: "/health",
      icon: "🌸",
      label: t.health || "Health",
    },
    {
      path: "/transactions",
      icon: "📊",
      label: t.transactions || "History",
    },
    {
      path: "/accounts",
      icon: "🏦",
      label: t.accounts || "Accounts",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 safe-area-inset-bottom z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all touch-manipulation ${
              isActive(item.path)
                ? "text-indigo-600"
                : "text-gray-600 hover:text-indigo-500"
            }`}
          >
            <span className={`text-2xl mb-0.5 transition-transform ${
              isActive(item.path) ? "scale-110" : ""
            }`}>
              {item.icon}
            </span>
            <span className={`text-xs font-medium ${
              isActive(item.path) ? "font-bold" : ""
            }`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
