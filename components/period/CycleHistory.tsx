"use client";

import { useState } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";
import { format, differenceInDays } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Droplets,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from "lucide-react";

interface Props {
  cycles: any[];
  locale: Locale;
  avgCycleLength: number;
  avgPeriodLength: number;
}

export default function CycleHistory({
  cycles,
  locale,
  avgCycleLength,
  avgPeriodLength,
}: Props) {
  const t = getTranslations(locale);
  const dateLocale = locale === "zh" ? zhCN : enUS;
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);

  if (cycles.length === 0) {
    return (
      <div className="bg-white rounded-[28px] shadow-lg border border-zinc-100 p-8 text-center">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-xl font-bold text-zinc-800 mb-2">
          {locale === "zh" ? "暂无周期记录" : "No Cycle History"}
        </h3>
        <p className="text-zinc-500">
          {locale === "zh"
            ? "开始记录您的周期后，这里会显示历史数据"
            : "Your cycle history will appear here once you start tracking"}
        </p>
      </div>
    );
  }

  const getFlowColor = (intensity: string | null) => {
    switch (intensity) {
      case "heavy": return "bg-rose-500";
      case "medium": return "bg-rose-400";
      case "light": return "bg-rose-300";
      case "spotting": return "bg-rose-200";
      default: return "bg-rose-300";
    }
  };

  const getCycleTrend = (cycleLength: number | null) => {
    if (!cycleLength) return { icon: <Minus className="w-4 h-4" />, color: "text-zinc-400", label: "-" };
    const diff = cycleLength - avgCycleLength;
    if (Math.abs(diff) <= 2) {
      return { icon: <Minus className="w-4 h-4" />, color: "text-zinc-500", label: locale === "zh" ? "正常" : "Normal" };
    }
    if (diff > 0) {
      return { icon: <TrendingUp className="w-4 h-4" />, color: "text-amber-500", label: `+${diff}` };
    }
    return { icon: <TrendingDown className="w-4 h-4" />, color: "text-blue-500", label: `${diff}` };
  };

  const getMostCommonSymptoms = (dailyLogs: any[]) => {
    const symptomCount: Record<string, number> = {};
    dailyLogs.forEach((log) => {
      log.symptoms?.forEach((s: string) => {
        symptomCount[s] = (symptomCount[s] || 0) + 1;
      });
    });
    return Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([symptom]) => symptom);
  };

  const getMostCommonMoods = (dailyLogs: any[]) => {
    const moodCount: Record<string, number> = {};
    dailyLogs.forEach((log) => {
      log.mood?.forEach((m: string) => {
        moodCount[m] = (moodCount[m] || 0) + 1;
      });
    });
    return Object.entries(moodCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mood]) => mood);
  };

  const symptomEmojis: Record<string, string> = {
    cramps: "⚡️",
    headache: "🤕",
    bloating: "🎈",
    breastTenderness: "🌸",
    acne: "✨",
    backPain: "🦴",
    nausea: "🤢",
    fatigue: "😴",
    cravings: "🍫",
    insomnia: "🌙",
    hotFlashes: "🔥",
    dizziness: "💫",
  };

  const moodEmojis: Record<string, string> = {
    happy: "😊",
    calm: "😌",
    energetic: "🤩",
    loving: "🥰",
    sad: "😢",
    anxious: "😰",
    irritable: "😤",
    stressed: "😫",
    tired: "🥱",
    moody: "😶‍🌫️",
    sensitive: "🥺",
    motivated: "💪",
  };

  return (
    <div className="bg-white rounded-[28px] shadow-lg border border-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
        <h3 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
          📊 {t.cycleHistory}
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          {locale === "zh"
            ? `共记录 ${cycles.length} 个周期`
            : `${cycles.length} cycles recorded`}
        </p>
      </div>

      {/* Cycles List */}
      <div className="divide-y divide-zinc-100">
        {cycles.map((cycle, index) => {
          const isExpanded = expandedCycleId === cycle.id;
          const startDate = new Date(cycle.startDate);
          const endDate = cycle.endDate ? new Date(cycle.endDate) : null;
          const trend = getCycleTrend(cycle.cycleLength);
          const commonSymptoms = getMostCommonSymptoms(cycle.dailyLogs || []);
          const commonMoods = getMostCommonMoods(cycle.dailyLogs || []);
          const isCurrentCycle = !cycle.isComplete;

          return (
            <div key={cycle.id} className="overflow-hidden">
              {/* Cycle Summary Row */}
              <button
                onClick={() => setExpandedCycleId(isExpanded ? null : cycle.id)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors text-left"
              >
                {/* Date Badge */}
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-rose-600">
                    {format(startDate, "d")}
                  </span>
                  <span className="text-[10px] font-bold text-rose-500 uppercase">
                    {format(startDate, "MMM", { locale: dateLocale })}
                  </span>
                </div>

                {/* Cycle Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-zinc-800">
                      {locale === "zh"
                        ? `${format(startDate, "yyyy年M月")}`
                        : format(startDate, "MMMM yyyy", { locale: dateLocale })}
                    </span>
                    {isCurrentCycle && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded-full">
                        {locale === "zh" ? "当前" : "Current"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    {cycle.periodLength && (
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-rose-400" />
                        {cycle.periodLength} {locale === "zh" ? "天" : "days"}
                      </span>
                    )}
                    {cycle.cycleLength && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-violet-400" />
                        {cycle.cycleLength} {locale === "zh" ? "天周期" : "day cycle"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Trend Indicator */}
                {cycle.cycleLength && (
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 ${trend.color}`}>
                    {trend.icon}
                    <span className="text-xs font-bold">{trend.label}</span>
                  </div>
                )}

                {/* Expand Icon */}
                <div className="flex-shrink-0 text-zinc-400">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 bg-zinc-50/50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Start Date */}
                    <div className="bg-white rounded-xl p-4 border border-zinc-100">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        {locale === "zh" ? "开始日期" : "Start Date"}
                      </div>
                      <div className="font-bold text-zinc-800">
                        {format(startDate, locale === "zh" ? "M月d日" : "MMM d")}
                      </div>
                    </div>

                    {/* End Date */}
                    <div className="bg-white rounded-xl p-4 border border-zinc-100">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        {locale === "zh" ? "结束日期" : "End Date"}
                      </div>
                      <div className="font-bold text-zinc-800">
                        {endDate
                          ? format(endDate, locale === "zh" ? "M月d日" : "MMM d")
                          : locale === "zh" ? "进行中" : "Ongoing"}
                      </div>
                    </div>

                    {/* Period Length */}
                    <div className="bg-white rounded-xl p-4 border border-zinc-100">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        {t.periodLength}
                      </div>
                      <div className="font-bold text-zinc-800">
                        {cycle.periodLength
                          ? `${cycle.periodLength} ${locale === "zh" ? "天" : "days"}`
                          : "-"}
                      </div>
                    </div>

                    {/* Cycle Length */}
                    <div className="bg-white rounded-xl p-4 border border-zinc-100">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        {t.cycleLength}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-800">
                          {cycle.cycleLength
                            ? `${cycle.cycleLength} ${locale === "zh" ? "天" : "days"}`
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Symptoms & Moods */}
                  {(commonSymptoms.length > 0 || commonMoods.length > 0) && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {commonSymptoms.length > 0 && (
                        <div className="bg-white rounded-xl p-4 border border-zinc-100">
                          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            {locale === "zh" ? "常见症状" : "Common Symptoms"}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {commonSymptoms.map((symptom) => (
                              <span
                                key={symptom}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm"
                              >
                                {symptomEmojis[symptom] || "•"}
                                <span>{t[symptom as keyof typeof t] || symptom}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {commonMoods.length > 0 && (
                        <div className="bg-white rounded-xl p-4 border border-zinc-100">
                          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            {locale === "zh" ? "常见心情" : "Common Moods"}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {commonMoods.map((mood) => (
                              <span
                                key={mood}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-sm"
                              >
                                {moodEmojis[mood] || "•"}
                                <span>{t[mood as keyof typeof t] || mood}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Flow Intensity */}
                  {cycle.flowIntensity && (
                    <div className="mt-4 bg-white rounded-xl p-4 border border-zinc-100">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        {t.flowIntensity}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${getFlowColor(cycle.flowIntensity)}`} />
                        <span className="font-medium text-zinc-700 capitalize">
                          {t[cycle.flowIntensity as keyof typeof t] || cycle.flowIntensity}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {cycle.notes && (
                    <div className="mt-4 bg-white rounded-xl p-4 border border-zinc-100">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        {t.notes}
                      </div>
                      <p className="text-zinc-600 text-sm">{cycle.notes}</p>
                    </div>
                  )}

                  {/* Logs Count */}
                  <div className="mt-4 text-sm text-zinc-500 text-center">
                    {cycle.dailyLogs?.length > 0
                      ? locale === "zh"
                        ? `${cycle.dailyLogs.length} 条每日记录`
                        : `${cycle.dailyLogs.length} daily logs`
                      : locale === "zh"
                        ? "暂无每日记录"
                        : "No daily logs"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



