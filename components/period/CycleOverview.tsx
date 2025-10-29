"use client";

import { getTranslations, type Locale } from "@/lib/i18n";
import { format, differenceInDays } from "date-fns";

interface Props {
  currentCycle: any;
  avgCycleLength: number;
  avgPeriodLength: number;
  onStartPeriod: () => void;
  locale: Locale;
}

export default function CycleOverview({
  currentCycle,
  avgCycleLength,
  avgPeriodLength,
  onStartPeriod,
  locale,
}: Props) {
  const t = getTranslations(locale);

  const getCycleStatus = () => {
    if (!currentCycle) {
      return {
        status: t.noCyclesYet,
        message: t.logFirstPeriod,
        color: "gray",
        icon: "🌸",
      };
    }

    const today = new Date();
    const startDate = new Date(currentCycle.startDate);
    const dayOfCycle = differenceInDays(today, startDate) + 1;

    // Check if on period
    if (currentCycle.endDate) {
      const endDate = new Date(currentCycle.endDate);
      if (today <= endDate) {
        return {
          status: t.onYourPeriod,
          message: `${t.dayOfCycle} ${dayOfCycle}`,
          color: "red",
          icon: "🩸",
          dayOfCycle,
        };
      }
    } else if (dayOfCycle <= avgPeriodLength) {
      return {
        status: t.onYourPeriod,
        message: `${t.dayOfCycle} ${dayOfCycle}`,
        color: "red",
        icon: "🩸",
        dayOfCycle,
      };
    }

    // Check if in fertile window
    if (currentCycle.fertileWindowStart && currentCycle.fertileWindowEnd) {
      const fertileStart = new Date(currentCycle.fertileWindowStart);
      const fertileEnd = new Date(currentCycle.fertileWindowEnd);
      if (today >= fertileStart && today <= fertileEnd) {
        return {
          status: t.inFertileWindow,
          message: `${t.dayOfCycle} ${dayOfCycle}`,
          color: "green",
          icon: "🌱",
          dayOfCycle,
        };
      }
    }

    // Check days until next period
    if (currentCycle.predictedStartDate) {
      const nextPeriod = new Date(currentCycle.predictedStartDate);
      const daysUntil = differenceInDays(nextPeriod, today);

      if (daysUntil <= 7 && daysUntil >= 0) {
        return {
          status: t.periodExpected,
          message: `${daysUntil} ${t.daysUntilNextPeriod}`,
          color: "yellow",
          icon: "📅",
          dayOfCycle,
        };
      }
    }

    return {
      status: t.currentCycle,
      message: `${t.dayOfCycle} ${dayOfCycle}`,
      color: "blue",
      icon: "🌙",
      dayOfCycle,
    };
  };

  const status = getCycleStatus();

  const colorClasses = {
    red: "bg-red-100 text-red-800 border-red-200",
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Status */}
        <div className="flex items-center gap-4 flex-1">
          <div className="text-5xl">{status.icon}</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{status.status}</h2>
            <p className="text-gray-600 text-lg">{status.message}</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onStartPeriod}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium whitespace-nowrap"
        >
          {currentCycle ? t.logPeriod : t.startPeriod}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-600 mb-1">{t.averageCycle}</p>
          <p className="text-2xl font-bold text-gray-900">
            {avgCycleLength} <span className="text-sm text-gray-600">{t.days}</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">{t.periodLength}</p>
          <p className="text-2xl font-bold text-gray-900">
            {avgPeriodLength} <span className="text-sm text-gray-600">{t.days}</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">{t.cycleHistory}</p>
          <p className="text-2xl font-bold text-gray-900">
            {currentCycle ? status.dayOfCycle || "-" : "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">{t.nextPeriod}</p>
          <p className="text-sm font-semibold text-gray-900">
            {currentCycle?.predictedStartDate
              ? format(new Date(currentCycle.predictedStartDate), "MMM d")
              : "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
