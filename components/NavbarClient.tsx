"use client";

import { useState, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import { handleSignOut } from "@/app/actions";
import LanguageSwitcher, { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";
import ThemeToggle, { ThemeToggleCompact } from "./ThemeToggle";

interface NavbarClientProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

function NavbarClient({ user }: NavbarClientProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Memoize nav links to prevent recreation on each render
  const navLinks = useMemo(() => [
    { href: "/trips", label: t.myTrips },
    { href: "/packing", label: "Packing" },
    { href: "/map", label: "Map" },
    { href: "/expenses", label: "Expenses" },
    { href: "/poker", label: "Poker" },
    { href: "/converter", label: t.converter || "Converter" },
    { href: "/health", label: t.health },
  ], [t.myTrips, t.converter, t.health]);

  const userInitial = useMemo(() => 
    user?.name?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    t.you.charAt(0).toUpperCase()
  , [user?.name, user?.email, t.you]);

  const userDisplayName = useMemo(() => 
    user?.name ?? user?.email ?? t.you
  , [user?.name, user?.email, t.you]);

  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
              TravelAI
            </Link>
            
            {user && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 rounded-md text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
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
                <ThemeToggle />
                <LanguageSwitcher />
                
                <div className="flex items-center gap-2 pl-4 border-l border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium text-xs">
                    {userInitial}
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {userDisplayName}
                  </span>
                </div>

                <form action={handleSignOut}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    {t.signOut}
                  </button>
                </form>
              </div>

              <button
                type="button"
                onClick={toggleMenu}
                className="md:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
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
            className="md:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 transition-colors duration-300"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium">
                  {userInitial}
                </div>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white">{userDisplayName}</div>
                  {user?.email && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</div>
                  )}
                </div>
              </div>

              <div className="grid gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThemeToggleCompact />
                  <LanguageSwitcher />
                </div>
                <form action={handleSignOut}>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
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

// Memoize to prevent unnecessary re-renders
export default memo(NavbarClient);
