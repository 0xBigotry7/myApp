"use client";

import { getTranslations, type Locale } from "@/lib/i18n";
import { format, differenceInDays } from "date-fns";
import { Activity, Calendar, Droplets, Leaf, Moon, Zap } from "lucide-react";

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
        colorClass: "from-zinc-100 to-zinc-200",
        textColor: "text-zinc-600",
        icon: <Activity className="w-8 h-8 text-zinc-400" />,
        progress: 0,
      };
    }

    const today = new Date();
    const startDate = new Date(currentCycle.startDate);
    const dayOfCycle = differenceInDays(today, startDate) + 1;
    const progress = Math.min((dayOfCycle / avgCycleLength) * 100, 100);

    // Check if on period
    if (currentCycle.endDate) {
      const endDate = new Date(currentCycle.endDate);
      if (today <= endDate) {
        return {
          status: t.onYourPeriod,
          message: `${t.dayOfCycle} ${dayOfCycle}`,
          colorClass: "from-rose-100 to-rose-200",
          textColor: "text-rose-700",
          icon: <Droplets className="w-8 h-8 text-rose-500" />,
          dayOfCycle,
          progress,
          isPeriod: true,
        };
      }
    } else if (dayOfCycle <= avgPeriodLength) {
      return {
        status: t.onYourPeriod,
        message: `${t.dayOfCycle} ${dayOfCycle}`,
        colorClass: "from-rose-100 to-rose-200",
        textColor: "text-rose-700",
        icon: <Droplets className="w-8 h-8 text-rose-500" />,
        dayOfCycle,
        progress,
        isPeriod: true,
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
          colorClass: "from-emerald-100 to-emerald-200",
          textColor: "text-emerald-700",
          icon: <Leaf className="w-8 h-8 text-emerald-500" />,
          dayOfCycle,
          progress,
          isFertile: true,
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
          colorClass: "from-amber-100 to-amber-200",
          textColor: "text-amber-700",
          icon: <Zap className="w-8 h-8 text-amber-500" />,
          dayOfCycle,
          progress,
          isPMS: true,
        };
      }
    }

    return {
      status: t.currentCycle,
      message: `${t.dayOfCycle} ${dayOfCycle}`,
      colorClass: "from-blue-50 to-indigo-50",
      textColor: "text-indigo-700",
      icon: <Moon className="w-8 h-8 text-indigo-500" />,
      dayOfCycle,
      progress,
    };
  };

  const status = getCycleStatus();

  return (
    <div className={`relative overflow-hidden rounded-[32px] p-8 shadow-lg transition-all border border-white/50 bg-gradient-to-br ${status.colorClass}`}>
      {/* Decorative blobs */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/30 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        {/* Status Section */}
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm flex items-center justify-center">
            {status.icon}
          </div>
          <div>
            <div className={`text-sm font-bold uppercase tracking-wider mb-1 opacity-60 ${status.textColor}`}>
              Current Status
            </div>
            <h2 className={`text-3xl font-black ${status.textColor} tracking-tight`}>
              {status.status}
            </h2>
            <p className={`text-lg font-medium opacity-80 ${status.textColor}`}>
              {status.message}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onStartPeriod}
          className="group relative px-8 py-4 bg-white/80 backdrop-blur-md text-zinc-900 rounded-2xl font-bold shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <span className="flex items-center gap-2">
            {currentCycle ? (
              <>
                <Droplets className="w-5 h-5 text-rose-500" />
                <span>{t.logPeriod}</span>
              </>
            ) : (
              <>
                <Activity className="w-5 h-5 text-emerald-500" />
                <span>{t.startPeriod}</span>
              </>
            )}
          </span>
        </button>
      </div>

      {/* Progress Bar for Cycle */}
      {currentCycle && (
        <div className="mt-8 mb-8">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 opacity-50">
            <span>Day 1</span>
            <span>Day {avgCycleLength} (Est.)</span>
          </div>
          <div className="h-4 bg-white/40 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                status.isPeriod ? "bg-rose-500" : 
                status.isFertile ? "bg-emerald-500" : 
                status.isPMS ? "bg-amber-500" : 
                "bg-indigo-500"
              }`}
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
          <p className="text-xs font-bold uppercase opacity-50 mb-1">{t.averageCycle}</p>
          <p className="text-2xl font-black text-zinc-800">
            {avgCycleLength} <span className="text-sm font-medium opacity-60">{t.days}</span>
          </p>
        </div>
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
          <p className="text-xs font-bold uppercase opacity-50 mb-1">{t.periodLength}</p>
          <p className="text-2xl font-black text-zinc-800">
            {avgPeriodLength} <span className="text-sm font-medium opacity-60">{t.days}</span>
          </p>
        </div>
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
          <p className="text-xs font-bold uppercase opacity-50 mb-1">Cycle Day</p>
          <p className="text-2xl font-black text-zinc-800">
            {currentCycle ? status.dayOfCycle || "-" : "-"}
          </p>
        </div>
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
          <p className="text-xs font-bold uppercase opacity-50 mb-1">{t.nextPeriod}</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 opacity-50" />
            <p className="text-lg font-bold text-zinc-800 truncate">
              {currentCycle?.predictedStartDate
                ? format(new Date(currentCycle.predictedStartDate), "MMM d")
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
