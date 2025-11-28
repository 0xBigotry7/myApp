"use client";

import { useState, useMemo } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isWithinInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addDays,
  isBefore,
  isAfter,
} from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Droplets, Heart, Sparkles, Check } from "lucide-react";

interface Props {
  cycles: any[];
  locale: Locale;
  onDayClick: (date: Date, log?: any) => void;
  avgCycleLength: number;
  avgPeriodLength: number;
}

type DayStatus = {
  type: "period" | "fertile" | "ovulation" | "predicted-period" | "logged" | null;
  intensity?: string;
  hasLog?: boolean;
  isPrediction?: boolean;
};

export default function EnhancedCalendarView({
  cycles,
  locale,
  onDayClick,
  avgCycleLength,
  avgPeriodLength,
}: Props) {
  const t = getTranslations(locale);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const dateLocale = locale === "zh" ? zhCN : enUS;

  // Get calendar days including padding for full weeks
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Calculate predictions for future months
  const predictions = useMemo(() => {
    if (cycles.length === 0) return { periodDays: [], fertileDays: [], ovulationDays: [] };

    const currentCycle = cycles.find((c) => !c.isComplete);
    if (!currentCycle) return { periodDays: [], fertileDays: [], ovulationDays: [] };

    const periodDays: Date[] = [];
    const fertileDays: Date[] = [];
    const ovulationDays: Date[] = [];

    // Predict next 3 cycles
    let lastStartDate = new Date(currentCycle.startDate);
    for (let i = 0; i < 3; i++) {
      const nextStart = addDays(lastStartDate, avgCycleLength);
      const nextEnd = addDays(nextStart, avgPeriodLength - 1);

      // Add predicted period days
      for (let d = nextStart; d <= nextEnd; d = addDays(d, 1)) {
        if (isAfter(d, new Date())) {
          periodDays.push(new Date(d));
        }
      }

      // Add predicted ovulation and fertile window
      const ovulation = addDays(nextStart, -14);
      if (isAfter(ovulation, new Date())) {
        ovulationDays.push(ovulation);
        for (let f = addDays(ovulation, -5); f <= ovulation; f = addDays(f, 1)) {
          fertileDays.push(new Date(f));
        }
      }

      lastStartDate = nextStart;
    }

    return { periodDays, fertileDays, ovulationDays };
  }, [cycles, avgCycleLength, avgPeriodLength]);

  // Get all daily logs as a map for quick lookup
  const logsByDate = useMemo(() => {
    const logs = new Map<string, any>();
    cycles.forEach((cycle) => {
      cycle.dailyLogs?.forEach((log: any) => {
        logs.set(format(new Date(log.date), "yyyy-MM-dd"), log);
      });
    });
    return logs;
  }, [cycles]);

  const getDayStatus = (day: Date): DayStatus => {
    const dateKey = format(day, "yyyy-MM-dd");
    const log = logsByDate.get(dateKey);
    const today = new Date();

    // Check actual cycles first
    for (const cycle of cycles) {
      const startDate = new Date(cycle.startDate);
      const endDate = cycle.endDate ? new Date(cycle.endDate) : null;

      // Check if day is during period
      if (endDate) {
        if (isWithinInterval(day, { start: startDate, end: endDate })) {
          return { type: "period", intensity: log?.flowIntensity, hasLog: !!log };
        }
      } else if (isSameDay(day, startDate)) {
        return { type: "period", intensity: cycle.flowIntensity, hasLog: !!log };
      }

      // Check if day is ovulation
      if (cycle.ovulationDate && isSameDay(day, new Date(cycle.ovulationDate))) {
        return { type: "ovulation", hasLog: !!log };
      }

      // Check if day is in fertile window
      if (cycle.fertileWindowStart && cycle.fertileWindowEnd) {
        const fertileStart = new Date(cycle.fertileWindowStart);
        const fertileEnd = new Date(cycle.fertileWindowEnd);
        if (isWithinInterval(day, { start: fertileStart, end: fertileEnd })) {
          return { type: "fertile", hasLog: !!log };
        }
      }
    }

    // Check predictions for future dates
    if (isAfter(day, today)) {
      if (predictions.periodDays.some((d) => isSameDay(d, day))) {
        return { type: "predicted-period", isPrediction: true };
      }
      if (predictions.ovulationDays.some((d) => isSameDay(d, day))) {
        return { type: "ovulation", isPrediction: true };
      }
      if (predictions.fertileDays.some((d) => isSameDay(d, day))) {
        return { type: "fertile", isPrediction: true };
      }
    }

    // Check if day has a log with symptoms/mood
    if (log && (log.symptoms?.length > 0 || log.mood?.length > 0 || log.flowIntensity)) {
      return { type: "logged", hasLog: true };
    }

    return { type: null, hasLog: !!log };
  };

  const getIntensityDots = (intensity?: string) => {
    switch (intensity) {
      case "heavy":
        return 4;
      case "medium":
        return 3;
      case "light":
        return 2;
      case "spotting":
        return 1;
      default:
        return 2;
    }
  };

  const renderDay = (day: Date) => {
    const status = getDayStatus(day);
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isTodayDate = isToday(day);
    const isPast = isBefore(day, new Date()) && !isTodayDate;
    const isFuture = isAfter(day, new Date());

    let bgClass = "";
    let textClass = isCurrentMonth ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-300 dark:text-zinc-600";
    let borderClass = "";
    let showIndicator = false;
    let indicatorColor = "";

    if (status.type === "period" || status.type === "predicted-period") {
      bgClass = status.isPrediction ? "bg-rose-100/50 dark:bg-rose-950/50" : "bg-rose-500";
      textClass = status.isPrediction ? "text-rose-600 dark:text-rose-400" : "text-white";
      showIndicator = true;
      indicatorColor = "rose";
    } else if (status.type === "ovulation") {
      bgClass = status.isPrediction ? "bg-emerald-100/50 dark:bg-emerald-950/50" : "bg-emerald-500";
      textClass = status.isPrediction ? "text-emerald-600 dark:text-emerald-400" : "text-white";
      showIndicator = true;
      indicatorColor = "emerald";
    } else if (status.type === "fertile") {
      bgClass = status.isPrediction ? "bg-green-50 dark:bg-green-950/30" : "bg-green-100 dark:bg-green-950/50";
      textClass = "text-green-800 dark:text-green-400";
      borderClass = status.isPrediction ? "border-dashed border-green-300 dark:border-green-800" : "border-green-300 dark:border-green-800";
    } else if (status.type === "logged") {
      bgClass = "bg-violet-100 dark:bg-violet-950/50";
      textClass = "text-violet-800 dark:text-violet-400";
    }

    if (isTodayDate) {
      borderClass = "ring-2 ring-offset-2 dark:ring-offset-zinc-900 ring-rose-500";
    }

    return (
      <button
        key={day.toString()}
        onClick={() => onDayClick(day, logsByDate.get(format(day, "yyyy-MM-dd")))}
        className={`
          relative aspect-square p-1 rounded-xl text-sm font-medium
          transition-all duration-200 hover:scale-110 hover:shadow-md
          ${bgClass}
          ${textClass}
          ${borderClass}
          ${!isCurrentMonth ? "opacity-40" : ""}
          ${isFuture && status.isPrediction ? "border border-dashed" : ""}
        `}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <span className={`${isTodayDate ? "font-bold" : ""}`}>{format(day, "d")}</span>

          {/* Flow intensity dots */}
          {status.type === "period" && !status.isPrediction && (
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: getIntensityDots(status.intensity) }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-current opacity-80"
                />
              ))}
            </div>
          )}

          {/* Prediction indicator */}
          {status.isPrediction && (
            <div className="absolute top-0.5 right-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
            </div>
          )}

          {/* Logged indicator */}
          {status.hasLog && !status.type?.includes("period") && (
            <div className="absolute bottom-0.5 right-0.5">
              <Check className="w-2.5 h-2.5 text-violet-500" />
            </div>
          )}
        </div>
      </button>
    );
  };

  const weekDays = locale === "zh"
    ? ["日", "一", "二", "三", "四", "五", "六"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[28px] shadow-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-b border-rose-100 dark:border-rose-900/30">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center gap-2">
            📅 {t.calendarView}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-white/60 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <span className="font-bold text-zinc-800 dark:text-white min-w-[140px] text-center">
              {format(currentMonth, locale === "zh" ? "yyyy年M月" : "MMMM yyyy", { locale: dateLocale })}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-white/60 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(renderDay)}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-rose-500 rounded-md"></div>
              <span className="text-zinc-600 dark:text-zinc-400">{t.onYourPeriod}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-rose-100 dark:bg-rose-950/50 rounded-md border border-dashed border-rose-300 dark:border-rose-800"></div>
              <span className="text-zinc-600 dark:text-zinc-400">{locale === "zh" ? "预测经期" : "Predicted Period"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded-md"></div>
              <span className="text-zinc-600 dark:text-zinc-400">{t.ovulation}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 dark:bg-green-950/50 rounded-md border border-green-300 dark:border-green-800"></div>
              <span className="text-zinc-600 dark:text-zinc-400">{t.fertileWindow}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-violet-100 dark:bg-violet-950/50 rounded-md"></div>
              <span className="text-zinc-600 dark:text-zinc-400">{locale === "zh" ? "已记录" : "Logged"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

