"use client";

import { useState } from "react";
import Link from "next/link";
import { handleSignOut } from "@/app/actions";
import LanguageSwitcher, { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";

interface NavbarClientProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export default function NavbarClient({ user }: NavbarClientProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/timeline", label: `🌟 Timeline` },
    { href: "/", label: `✈️ ${t.myTrips}` },
    { href: "/map", label: `🗺️ Travel Map` },
    { href: "/expenses", label: `💸 Expenses` },
    { href: "/finance", label: `💰 ${t.finance}` },
    { href: "/converter", label: `💱 ${t.converter || "Converter"}` },
    { href: "/health", label: `🌸 ${t.health}` },
    { href: "/transactions", label: `📊 ${t.transactions}` },
  ];

  const userInitial =
    user?.name?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    t.you.charAt(0).toUpperCase();

  const userDisplayName = user?.name ?? user?.email ?? t.you;

  return (
    <nav className="bg-gradient-blue-pink border-b border-white/20 sticky top-0 z-50 backdrop-blur-lg shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between gap-3 py-3 sm:py-4">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:bg-white/30 transition-all">
                <span className="text-white font-bold text-lg">✈️</span>
              </div>
              <span className="text-xl font-bold text-white drop-shadow-md">
                TravelAI
              </span>
            </Link>
            {user && (
              <div className="hidden md:flex items-center gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all font-medium text-sm backdrop-blur-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                <div className="w-8 h-8 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {userInitial}
                </div>
                <span className="text-sm font-medium text-white drop-shadow">
                  {userDisplayName}
                </span>
              </div>
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>
              <form action={handleSignOut} className="hidden md:block">
                <button
                  type="submit"
                  className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all text-sm font-medium backdrop-blur-sm"
                >
                  {t.signOut}
                </button>
              </form>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-white/90 transition-all hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-nav-menu"
              >
                <span className="sr-only">Toggle navigation</span>
                <span className="text-xl font-semibold">{isMenuOpen ? "✕" : "☰"}</span>
              </button>
            </div>
          )}
        </div>
        {user && isMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="md:hidden fixed inset-0 top-[64px] z-50 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          >
            <div
              className="absolute top-2 left-4 right-4 rounded-3xl border border-white/60 bg-white shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-blue-pink text-lg font-semibold text-white shadow-lg">
                      {userInitial}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-gray-900">
                        {userDisplayName}
                      </span>
                      {user?.email && (
                        <span className="text-xs text-gray-500">{user.email}</span>
                      )}
                    </div>
                  </div>
                  <LanguageSwitcher compact />
                </div>
                <div className="grid gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:shadow-md hover:from-blue-100 hover:to-purple-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{link.label}</span>
                      <span className="text-lg">›</span>
                    </Link>
                  ))}
                </div>
                <form action={handleSignOut} className="mt-4">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-gradient-blue-pink py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t.signOut}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
