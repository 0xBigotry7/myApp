"use client";

import { useState } from "react";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";

interface TripTabsProps {
  budgetTab: React.ReactNode;
  itineraryTab: React.ReactNode;
}

export default function TripTabs({ budgetTab, itineraryTab }: TripTabsProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const [activeTab, setActiveTab] = useState<"budget" | "itinerary">("budget");

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("budget")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "budget"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            💰 {t.budgetExpenses}
          </button>
          <button
            onClick={() => setActiveTab("itinerary")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "itinerary"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            📅 {t.itinerary}
          </button>
        </nav>
      </div>

      <div>
        {activeTab === "budget" && budgetTab}
        {activeTab === "itinerary" && itineraryTab}
      </div>
    </div>
  );
}
