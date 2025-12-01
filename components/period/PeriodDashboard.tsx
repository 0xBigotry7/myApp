"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";
import { format } from "date-fns";
import CyclePhaseRing from "./CyclePhaseRing";
import EnhancedCalendarView from "./EnhancedCalendarView";
import DailyLogModal from "./DailyLogModal";
import CycleHistory from "./CycleHistory";
import CycleStatistics from "./CycleStatistics";
import InsightsPanel from "./InsightsPanel";
import StartPeriodModal from "./StartPeriodModal";
import EndPeriodModal from "./EndPeriodModal";
import { Calendar, BarChart3, Clock, Sparkles, Moon, CalendarCheck } from "lucide-react";

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

type Tab = "calendar" | "history" | "statistics" | "insights";

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
  const [showEndPeriod, setShowEndPeriod] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

  // Daily log modal state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const handleDayClick = useCallback((date: Date, log?: any) => {
    setSelectedDate(date);
    setSelectedLog(log || null);
  }, []);

  const handleDateChange = useCallback((newDate: Date) => {
    // Find the log for the new date
    const dateKey = format(newDate, "yyyy-MM-dd");
    let foundLog = null;
    for (const cycle of cycles) {
      const log = cycle.dailyLogs?.find(
        (l: any) => format(new Date(l.date), "yyyy-MM-dd") === dateKey
      );
      if (log) {
        foundLog = log;
        break;
      }
    }
    setSelectedDate(newDate);
    setSelectedLog(foundLog);
  }, [cycles]);

  const tabs = [
    { id: "calendar" as Tab, label: locale === "zh" ? "日历" : "Calendar", icon: <Calendar className="w-4 h-4" /> },
    { id: "history" as Tab, label: locale === "zh" ? "历史" : "History", icon: <Clock className="w-4 h-4" /> },
    { id: "statistics" as Tab, label: locale === "zh" ? "统计" : "Stats", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "insights" as Tab, label: locale === "zh" ? "洞察" : "Insights", icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Cycle Phase Ring - Hero Section */}
      <CyclePhaseRing
        currentCycle={currentCycle}
        avgCycleLength={avgCycleLength}
        avgPeriodLength={avgPeriodLength}
        locale={locale}
        onStartPeriod={() => setShowStartPeriod(true)}
        onEndPeriod={() => setShowEndPeriod(true)}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 sm:gap-2 p-1 sm:p-1.5 bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-4 sm:[&>svg]:h-4">{tab.icon}</span>
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "calendar" && (
          <EnhancedCalendarView
            cycles={cycles}
            locale={locale}
            onDayClick={handleDayClick}
            avgCycleLength={avgCycleLength}
            avgPeriodLength={avgPeriodLength}
          />
        )}

        {activeTab === "history" && (
          <CycleHistory
            cycles={cycles}
            locale={locale}
            avgCycleLength={avgCycleLength}
            avgPeriodLength={avgPeriodLength}
          />
        )}

        {activeTab === "statistics" && (
          <CycleStatistics cycles={cycles} locale={locale} />
        )}

        {activeTab === "insights" && (
          <InsightsPanel insights={insights} locale={locale} />
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {locale === "zh" ? "快速操作" : "Quick Actions"}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDayClick(new Date(), todayLog)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-xl text-xs sm:text-sm font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              {locale === "zh" ? "记录今天" : "Log Today"}
            </button>
            
            {/* Show End Period in Quick Actions when cycle needs end date */}
            {currentCycle && !currentCycle.endDate && (
              <button
                onClick={() => setShowEndPeriod(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-xs sm:text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                {locale === "zh" ? "标记结束" : "Mark End"}
              </button>
            )}
            
            {!currentCycle && (
              <button
                onClick={() => setShowStartPeriod(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-xl text-xs sm:text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
              >
                <Moon className="w-3.5 h-3.5" />
                {locale === "zh" ? "开始经期" : "Start Period"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showStartPeriod && (
        <StartPeriodModal
          onClose={() => setShowStartPeriod(false)}
          locale={locale}
        />
      )}

      {showEndPeriod && currentCycle && (
        <EndPeriodModal
          currentCycle={currentCycle}
          locale={locale}
          onClose={() => setShowEndPeriod(false)}
        />
      )}

      {selectedDate && (
        <DailyLogModal
          date={selectedDate}
          existingLog={selectedLog}
          locale={locale}
          onClose={() => {
            setSelectedDate(null);
            setSelectedLog(null);
          }}
          onDateChange={handleDateChange}
        />
      )}
    </div>
  );
}
