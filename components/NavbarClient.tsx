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
    // { href: "/timeline", label: "Timeline" },
    { href: "/", label: t.myTrips },
    { href: "/packing", label: "Packing" },
    { href: "/map", label: "Map" },
    { href: "/expenses", label: "Expenses" },
    { href: "/poker", label: "Poker" },
    { href: "/converter", label: t.converter || "Converter" },
    { href: "/health", label: t.health },
  ];

  const userInitial =
    user?.name?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    t.you.charAt(0).toUpperCase();

  const userDisplayName = user?.name ?? user?.email ?? t.you;

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900">
              TravelAI
            </Link>
            
            {user && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 rounded-md text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4">
                <LanguageSwitcher />
                
                <div className="flex items-center gap-2 pl-4 border-l border-zinc-200">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 font-medium text-xs">
                    {userInitial}
                  </div>
                  <span className="text-sm font-medium text-zinc-700">
                    {userDisplayName}
                  </span>
                </div>

                <form action={handleSignOut}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    {t.signOut}
                  </button>
                </form>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-nav-menu"
              >
                <span className="sr-only">Toggle navigation</span>
                <span className="text-xl">{isMenuOpen ? "✕" : "☰"}</span>
              </button>
            </div>
          )}
        </div>

        {user && isMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="md:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-white border-t border-zinc-200"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 font-medium">
                  {userInitial}
                </div>
                <div>
                  <div className="font-medium text-zinc-900">{userDisplayName}</div>
                  {user?.email && (
                    <div className="text-xs text-zinc-500">{user.email}</div>
                  )}
                </div>
              </div>

              <div className="grid gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <LanguageSwitcher />
                <form action={handleSignOut}>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
