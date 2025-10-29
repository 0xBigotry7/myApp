"use client";

import { useState } from "react";
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
} from "date-fns";

interface Props {
  cycles: any[];
  locale: Locale;
}

export default function CalendarView({ cycles, locale }: Props) {
  const t = getTranslations(locale);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayStatus = (day: Date) => {
    for (const cycle of cycles) {
      const startDate = new Date(cycle.startDate);
      const endDate = cycle.endDate ? new Date(cycle.endDate) : null;

      // Check if day is during period
      if (endDate) {
        if (isWithinInterval(day, { start: startDate, end: endDate })) {
          return { type: "period", color: "bg-red-500", text: "text-white" };
        }
      } else if (isSameDay(day, startDate)) {
        return { type: "period", color: "bg-red-500", text: "text-white" };
      }

      // Check if day is in fertile window
      if (cycle.fertileWindowStart && cycle.fertileWindowEnd) {
        const fertileStart = new Date(cycle.fertileWindowStart);
        const fertileEnd = new Date(cycle.fertileWindowEnd);
        if (isWithinInterval(day, { start: fertileStart, end: fertileEnd })) {
          return {
            type: "fertile",
            color: "bg-green-100",
            text: "text-green-900",
          };
        }
      }

      // Check if day is ovulation
      if (cycle.ovulationDate && isSameDay(day, new Date(cycle.ovulationDate))) {
        return {
          type: "ovulation",
          color: "bg-green-500",
          text: "text-white",
        };
      }

      // Check if day has a log
      const log = cycle.dailyLogs?.find((l: any) =>
        isSameDay(new Date(l.date), day)
      );
      if (log) {
        if (log.symptoms?.length > 0 || log.mood?.length > 0) {
          return {
            type: "logged",
            color: "bg-blue-100",
            text: "text-blue-900",
          };
        }
      }
    }

    return null;
  };

  const renderDay = (day: Date) => {
    const status = getDayStatus(day);
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isTodayDate = isToday(day);

    return (
      <div
        key={day.toString()}
        className={`
          aspect-square p-2 text-center text-sm
          ${!isCurrentMonth ? "text-gray-400" : "text-gray-900"}
          ${isTodayDate ? "font-bold ring-2 ring-purple-500 rounded-lg" : ""}
          ${status ? `${status.color} ${status.text} rounded-lg` : ""}
        `}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <span>{format(day, "d")}</span>
          {status && (
            <span className="text-xs mt-0.5">
              {status.type === "period" && "🩸"}
              {status.type === "fertile" && "🌱"}
              {status.type === "ovulation" && "🥚"}
              {status.type === "logged" && "✓"}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">{t.calendarView}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <span className="font-semibold text-gray-900 min-w-[120px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">{days.map(renderDay)}</div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-600">{t.onYourPeriod}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-600">{t.ovulation}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-500 rounded"></div>
          <span className="text-gray-600">{t.fertileWindow}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
          <span className="text-gray-600">{t.logSymptoms}</span>
        </div>
      </div>
    </div>
  );
}
