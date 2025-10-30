"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";

type ActiveTab = "budget" | "itinerary";

interface TripTabsProps {
  budgetTab: React.ReactNode;
  itineraryTab: React.ReactNode;
}

export default function TripTabs({
  budgetTab,
  itineraryTab,
}: TripTabsProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const [activeTab, setActiveTab] = useState<ActiveTab>("budget");

  const tabs: Array<{ id: ActiveTab; label: string; icon: string }> = useMemo(
    () => [
      { id: "budget", label: t.budgetExpenses, icon: "💰" },
      { id: "itinerary", label: t.itinerary, icon: "📅" },
    ],
    [t.budgetExpenses, t.itinerary],
  );

  const visibleTabs = useMemo(() => tabs, [tabs]);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab) && visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [activeTab, visibleTabs]);

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex flex-wrap gap-4 sm:gap-8">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              <span className="text-lg" aria-hidden>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === "budget" && budgetTab}
        {activeTab === "itinerary" && itineraryTab}
      </div>
    </div>
  );
}
