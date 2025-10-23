"use client";

import { useState, useEffect } from "react";

export default function LanguageSwitcher() {
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

  return (
    <button
      onClick={toggleLocale}
      className="px-4 py-2 bg-gradient-blue-pink text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
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
