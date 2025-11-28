"use client";

import { useState } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";
import PeriodDashboard from "./PeriodDashboard";
import StartPeriodModal from "./StartPeriodModal";

type Cycle = {
  id: string;
  startDate: string;
  endDate: string | null;
  cycleLength: number | null;
  periodLength: number | null;
  flowIntensity: string | null;
  predictedStartDate: string | null;
  predictedEndDate: string | null;
  ovulationDate: string | null;
  fertileWindowStart: string | null;
  fertileWindowEnd: string | null;
  isComplete: boolean;
  dailyLogs: any[];
};

type DailyLog = {
  id: string;
  date: string;
  flowIntensity: string | null;
  symptoms: string[];
  mood: string[];
  energyLevel: number | null;
  sleepQuality: number | null;
  notes: string | null;
};

type Insight = {
  id: string;
  type: string;
  title: string;
  content: string;
  severity: string | null;
  isRead: boolean;
  createdAt: string;
};

interface Props {
  cycles: Cycle[];
  todayLog: DailyLog | null;
  insights: Insight[];
  currentCycle: Cycle | null;
  avgCycleLength: number;
  avgPeriodLength: number;
  locale: Locale;
}

export default function HealthDashboardClient({
  cycles,
  todayLog,
  insights,
  currentCycle,
  avgCycleLength,
  avgPeriodLength,
  locale,
}: Props) {
  const t = getTranslations(locale);
  const [showStartPeriod, setShowStartPeriod] = useState(false);

  if (cycles.length === 0) {
    return (
      <>
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🌸
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
            {t.noCyclesYet}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
            {t.startTrackingPeriod}
          </p>
          <button
            onClick={() => setShowStartPeriod(true)}
            className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200 font-medium shadow-sm"
          >
            <span className="text-xl leading-none">+</span>
            {t.logFirstPeriod}
          </button>
        </div>

        {showStartPeriod && (
          <StartPeriodModal
            onClose={() => setShowStartPeriod(false)}
            locale={locale}
          />
        )}
      </>
    );
  }

  return (
    <PeriodDashboard
      cycles={cycles}
      todayLog={todayLog}
      insights={insights}
      currentCycle={currentCycle}
      avgCycleLength={avgCycleLength}
      avgPeriodLength={avgPeriodLength}
      locale={locale}
    />
  );
}
