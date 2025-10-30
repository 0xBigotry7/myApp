"use client";

import { useState, useEffect } from "react";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export default function LanguageSwitcher({
  className = "",
  compact = false,
}: LanguageSwitcherProps = {}) {
  const [locale, setLocale] = useState<"en" | "zh">("en");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as "en" | "zh" | null;
    if (saved) {
      setLocale(saved);
    }
  }, []);

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "zh" : "en";
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale);
    // Also set cookie for server components
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    window.location.reload(); // Simple reload to update all text
  };

  const sizeClasses = compact
    ? "px-3 py-1.5 text-xs sm:text-sm"
    : "px-4 py-2 text-sm";

  return (
    <button
      onClick={toggleLocale}
      className={`inline-flex items-center justify-center bg-gradient-blue-pink text-white rounded-xl font-semibold hover:shadow-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${sizeClasses} ${className}`.trim()}
    >
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}

export function useLocale() {
  const [locale, setLocale] = useState<"en" | "zh">("en");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as "en" | "zh" | null;
    if (saved) {
      setLocale(saved);
    }
  }, []);

  return locale;
}
