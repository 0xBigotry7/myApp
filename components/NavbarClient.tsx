"use client";

import Link from "next/link";
import { handleSignOut } from "@/app/actions";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLocale } from "./LanguageSwitcher";
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

  return (
    <nav className="bg-gradient-blue-pink border-b border-white/20 sticky top-0 z-50 backdrop-blur-lg shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
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
                <Link
                  href="/"
                  className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all font-medium text-sm backdrop-blur-sm"
                >
                  ✈️ Trips
                </Link>
                <Link
                  href="/finance"
                  className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all font-medium text-sm backdrop-blur-sm"
                >
                  💰 Finance
                </Link>
                <Link
                  href="/health"
                  className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all font-medium text-sm backdrop-blur-sm"
                >
                  🌸 {t.health}
                </Link>
                <Link
                  href="/transactions"
                  className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all font-medium text-sm backdrop-blur-sm"
                >
                  📊 Transactions
                </Link>
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white drop-shadow">
                  {user.name}
                </span>
              </div>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all text-sm font-medium backdrop-blur-sm"
                >
                  {t.signOut}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
