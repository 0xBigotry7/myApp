"use client";

import { useMemo } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Droplets,
  Heart,
  Activity,
  Thermometer,
  Moon,
  Sparkles,
} from "lucide-react";

interface Props {
  cycles: any[];
  locale: Locale;
}

export default function CycleStatistics({ cycles, locale }: Props) {
  const t = getTranslations(locale);

  const stats = useMemo(() => {
    if (cycles.length === 0) {
      return null;
    }

    const completedCycles = cycles.filter((c) => c.isComplete);

    // Calculate averages
    const cycleLengths = completedCycles
      .map((c) => c.cycleLength)
      .filter((l): l is number => l !== null);
    const periodLengths = completedCycles
      .map((c) => c.periodLength)
      .filter((l): l is number => l !== null);

    const avgCycleLength = cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : 28;
    const avgPeriodLength = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : 5;

    // Calculate variations
    const shortestCycle = cycleLengths.length > 0 ? Math.min(...cycleLengths) : null;
    const longestCycle = cycleLengths.length > 0 ? Math.max(...cycleLengths) : null;
    const cycleVariation = shortestCycle && longestCycle ? longestCycle - shortestCycle : null;

    // Aggregate all daily logs for symptom and mood analysis
    const allLogs = cycles.flatMap((c) => c.dailyLogs || []);

    // Count symptoms
    const symptomCounts: Record<string, number> = {};
    allLogs.forEach((log) => {
      log.symptoms?.forEach((s: string) => {
        symptomCounts[s] = (symptomCounts[s] || 0) + 1;
      });
    });
    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Count moods
    const moodCounts: Record<string, number> = {};
    allLogs.forEach((log) => {
      log.mood?.forEach((m: string) => {
        moodCounts[m] = (moodCounts[m] || 0) + 1;
      });
    });
    const topMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Calculate average energy and sleep
    const energyLevels = allLogs
      .map((l) => l.energyLevel)
      .filter((e): e is number => e !== null);
    const avgEnergy = energyLevels.length > 0
      ? (energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length).toFixed(1)
      : null;

    const sleepLevels = allLogs
      .map((l) => l.sleepQuality)
      .filter((s): s is number => s !== null);
    const avgSleep = sleepLevels.length > 0
      ? (sleepLevels.reduce((a, b) => a + b, 0) / sleepLevels.length).toFixed(1)
      : null;

    // Flow intensity distribution
    const flowCounts: Record<string, number> = { spotting: 0, light: 0, medium: 0, heavy: 0 };
    allLogs.forEach((log) => {
      if (log.flowIntensity && flowCounts.hasOwnProperty(log.flowIntensity)) {
        flowCounts[log.flowIntensity]++;
      }
    });
    const totalFlowDays = Object.values(flowCounts).reduce((a, b) => a + b, 0);

    return {
      totalCycles: cycles.length,
      completedCycles: completedCycles.length,
      avgCycleLength,
      avgPeriodLength,
      shortestCycle,
      longestCycle,
      cycleVariation,
      topSymptoms,
      topMoods,
      avgEnergy,
      avgSleep,
      flowCounts,
      totalFlowDays,
      totalLogs: allLogs.length,
    };
  }, [cycles]);

  if (!stats) {
    return (
      <div className="bg-white rounded-[28px] shadow-lg border border-zinc-100 p-8 text-center">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-xl font-bold text-zinc-800 mb-2">
          {locale === "zh" ? "暂无统计数据" : "No Statistics Yet"}
        </h3>
        <p className="text-zinc-500">
          {locale === "zh"
            ? "记录更多周期后，这里会显示统计分析"
            : "Statistics will appear here as you track more cycles"}
        </p>
      </div>
    );
  }

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
      <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
        <h3 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
          📈 {t.statistics}
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          {locale === "zh"
            ? `基于 ${stats.totalCycles} 个周期和 ${stats.totalLogs} 条记录`
            : `Based on ${stats.totalCycles} cycles and ${stats.totalLogs} daily logs`}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Cycle Length Stats */}
        <div>
          <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-500" />
            {locale === "zh" ? "周期分析" : "Cycle Analysis"}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4">
              <div className="text-3xl font-black text-violet-600">{stats.avgCycleLength}</div>
              <div className="text-xs font-bold text-violet-500 uppercase tracking-wider mt-1">
                {locale === "zh" ? "平均周期" : "Avg Cycle"}
              </div>
              <div className="text-xs text-violet-400">{locale === "zh" ? "天" : "days"}</div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4">
              <div className="text-3xl font-black text-rose-600">{stats.avgPeriodLength}</div>
              <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mt-1">
                {locale === "zh" ? "平均经期" : "Avg Period"}
              </div>
              <div className="text-xs text-rose-400">{locale === "zh" ? "天" : "days"}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4">
              <div className="text-3xl font-black text-blue-600">
                {stats.shortestCycle || "-"}
                {stats.shortestCycle && stats.longestCycle && (
                  <span className="text-lg font-bold text-blue-400">-{stats.longestCycle}</span>
                )}
              </div>
              <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mt-1">
                {locale === "zh" ? "周期范围" : "Range"}
              </div>
              <div className="text-xs text-blue-400">{locale === "zh" ? "天" : "days"}</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4">
              <div className="text-3xl font-black text-amber-600">
                {stats.cycleVariation !== null ? `±${Math.round(stats.cycleVariation / 2)}` : "-"}
              </div>
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mt-1">
                {locale === "zh" ? "变化幅度" : "Variation"}
              </div>
              <div className="text-xs text-amber-400">{locale === "zh" ? "天" : "days"}</div>
            </div>
          </div>
        </div>

        {/* Flow Distribution */}
        {stats.totalFlowDays > 0 && (
          <div>
            <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-rose-500" />
              {locale === "zh" ? "流量分布" : "Flow Distribution"}
            </h4>
            <div className="bg-zinc-50 rounded-2xl p-4">
              <div className="flex h-8 rounded-full overflow-hidden mb-3">
                {stats.flowCounts.spotting > 0 && (
                  <div
                    className="bg-rose-200 flex items-center justify-center text-xs font-bold text-rose-700"
                    style={{ width: `${(stats.flowCounts.spotting / stats.totalFlowDays) * 100}%` }}
                  >
                    {stats.flowCounts.spotting > 3 && `${Math.round((stats.flowCounts.spotting / stats.totalFlowDays) * 100)}%`}
                  </div>
                )}
                {stats.flowCounts.light > 0 && (
                  <div
                    className="bg-rose-300 flex items-center justify-center text-xs font-bold text-rose-800"
                    style={{ width: `${(stats.flowCounts.light / stats.totalFlowDays) * 100}%` }}
                  >
                    {stats.flowCounts.light > 3 && `${Math.round((stats.flowCounts.light / stats.totalFlowDays) * 100)}%`}
                  </div>
                )}
                {stats.flowCounts.medium > 0 && (
                  <div
                    className="bg-rose-400 flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: `${(stats.flowCounts.medium / stats.totalFlowDays) * 100}%` }}
                  >
                    {stats.flowCounts.medium > 3 && `${Math.round((stats.flowCounts.medium / stats.totalFlowDays) * 100)}%`}
                  </div>
                )}
                {stats.flowCounts.heavy > 0 && (
                  <div
                    className="bg-rose-500 flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: `${(stats.flowCounts.heavy / stats.totalFlowDays) * 100}%` }}
                  >
                    {stats.flowCounts.heavy > 3 && `${Math.round((stats.flowCounts.heavy / stats.totalFlowDays) * 100)}%`}
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-200" />
                  {t.spotting}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-300" />
                  {t.light}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  {t.medium}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  {t.heavy}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Energy & Sleep */}
        {(stats.avgEnergy || stats.avgSleep) && (
          <div className="grid grid-cols-2 gap-4">
            {stats.avgEnergy && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    {locale === "zh" ? "平均精力" : "Avg Energy"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-black text-amber-600">{stats.avgEnergy}</div>
                  <div className="text-zinc-400">/5</div>
                </div>
                <div className="flex mt-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 h-2 first:rounded-l-full last:rounded-r-full ${
                        level <= parseFloat(stats.avgEnergy!)
                          ? "bg-gradient-to-r from-amber-400 to-orange-400"
                          : "bg-amber-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {stats.avgSleep && (
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    {locale === "zh" ? "平均睡眠" : "Avg Sleep"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-black text-indigo-600">{stats.avgSleep}</div>
                  <div className="text-zinc-400">/5</div>
                </div>
                <div className="flex mt-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 h-2 first:rounded-l-full last:rounded-r-full ${
                        level <= parseFloat(stats.avgSleep!)
                          ? "bg-gradient-to-r from-indigo-400 to-violet-400"
                          : "bg-indigo-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Symptoms */}
        {stats.topSymptoms.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              {locale === "zh" ? "常见症状" : "Most Common Symptoms"}
            </h4>
            <div className="space-y-2">
              {stats.topSymptoms.map(([symptom, count], index) => {
                const maxCount = stats.topSymptoms[0][1];
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={symptom} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-lg">
                      {symptomEmojis[symptom] || "•"}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-zinc-700">
                          {t[symptom as keyof typeof t] || symptom}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {count} {locale === "zh" ? "次" : "times"}
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Moods */}
        {stats.topMoods.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              {locale === "zh" ? "常见心情" : "Most Common Moods"}
            </h4>
            <div className="flex flex-wrap gap-2">
              {stats.topMoods.map(([mood, count]) => (
                <div
                  key={mood}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-xl"
                >
                  <span className="text-xl">{moodEmojis[mood] || "•"}</span>
                  <span className="text-sm font-medium text-pink-700">
                    {t[mood as keyof typeof t] || mood}
                  </span>
                  <span className="text-xs text-pink-400 bg-pink-100 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cycle Regularity Indicator */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Activity className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-800">
                {stats.cycleVariation !== null && stats.cycleVariation <= 7
                  ? locale === "zh" ? "周期规律 ✓" : "Regular Cycles ✓"
                  : locale === "zh" ? "周期正在稳定" : "Cycles Stabilizing"}
              </h4>
              <p className="text-sm text-zinc-500">
                {stats.cycleVariation !== null && stats.cycleVariation <= 7
                  ? locale === "zh"
                    ? "您的周期变化在正常范围内"
                    : "Your cycle variation is within normal range"
                  : locale === "zh"
                    ? "继续追踪以获得更准确的预测"
                    : "Keep tracking for more accurate predictions"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



