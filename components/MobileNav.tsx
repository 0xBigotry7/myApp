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
      path: "/map",
      icon: "🗺️",
      label: "Map",
    },
    {
      path: "/expenses",
      icon: "💸",
      label: "Expenses",
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
      label: "History",
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div
        className="px-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div className="mx-auto max-w-xl rounded-3xl border border-white/60 bg-white/90 px-2 py-2 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[0.75rem] font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                    active
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-indigo-500"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={`text-xl transition-transform ${active ? "scale-110" : ""}`}>
                    {item.icon}
                  </span>
                  <span className="mt-1 truncate text-[0.7rem]">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
