"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";
import CycleOverview from "./CycleOverview";
import CalendarView from "./CalendarView";
import DailyLogForm from "./DailyLogForm";
import InsightsPanel from "./InsightsPanel";
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

export default function PeriodDashboard({
  cycles,
  todayLog,
  insights,
  currentCycle,
  avgCycleLength,
  avgPeriodLength,
  locale,
}: Props) {
  const router = useRouter();
  const t = getTranslations(locale);
  const [showStartPeriod, setShowStartPeriod] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Cycle Overview Card */}
      <CycleOverview
        currentCycle={currentCycle}
        avgCycleLength={avgCycleLength}
        avgPeriodLength={avgPeriodLength}
        onStartPeriod={() => setShowStartPeriod(true)}
        locale={locale}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Calendar and Daily Log */}
        <div className="lg:col-span-2 space-y-6">
          <CalendarView cycles={cycles} locale={locale} />
          <DailyLogForm todayLog={todayLog} locale={locale} />
        </div>

        {/* Right Column - Insights */}
        <div className="lg:col-span-1">
          <InsightsPanel insights={insights} locale={locale} />
        </div>
      </div>

      {/* Start Period Modal */}
      {showStartPeriod && (
        <StartPeriodModal
          onClose={() => setShowStartPeriod(false)}
          locale={locale}
        />
      )}
    </div>
  );
}
