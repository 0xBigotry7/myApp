"use client";

import { useMemo } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";
import { differenceInDays, format, addDays } from "date-fns";
import { Droplets, Sparkles, Moon, Sun, Heart } from "lucide-react";

interface Props {
  currentCycle: any;
  avgCycleLength: number;
  avgPeriodLength: number;
  locale: Locale;
  onStartPeriod: () => void;
  onEndPeriod: () => void;
}

type Phase = "menstrual" | "follicular" | "ovulation" | "luteal" | "pms" | "unknown";

interface PhaseInfo {
  name: string;
  description: string;
  color: string;
  bgGradient: string;
  icon: React.ReactNode;
  tips: string[];
}

const PHASE_INFO: Record<Phase, PhaseInfo> = {
  menstrual: {
    name: "Menstrual Phase",
    description: "Your body is shedding the uterine lining",
    color: "#E11D48",
    bgGradient: "from-rose-50 via-rose-100 to-rose-50",
    icon: <Droplets className="w-6 h-6" />,
    tips: [
      "Rest when you need to",
      "Stay hydrated",
      "Iron-rich foods can help",
      "Gentle exercise like yoga",
    ],
  },
  follicular: {
    name: "Follicular Phase",
    description: "Your body prepares for ovulation",
    color: "#0EA5E9",
    bgGradient: "from-sky-50 via-blue-50 to-indigo-50",
    icon: <Sparkles className="w-6 h-6" />,
    tips: [
      "Energy levels rising",
      "Great time for new projects",
      "Try new workouts",
      "Creativity tends to peak",
    ],
  },
  ovulation: {
    name: "Ovulation",
    description: "Peak fertility window",
    color: "#10B981",
    bgGradient: "from-emerald-50 via-green-50 to-teal-50",
    icon: <Heart className="w-6 h-6" />,
    tips: [
      "Most fertile time",
      "Peak energy and confidence",
      "Great for social activities",
      "You may feel more attractive",
    ],
  },
  luteal: {
    name: "Luteal Phase",
    description: "Your body prepares for menstruation",
    color: "#8B5CF6",
    bgGradient: "from-violet-50 via-purple-50 to-fuchsia-50",
    icon: <Moon className="w-6 h-6" />,
    tips: [
      "Nesting instincts may increase",
      "Focus on self-care",
      "Magnesium can help with mood",
      "Avoid overcommitting",
    ],
  },
  pms: {
    name: "PMS Phase",
    description: "Pre-menstrual symptoms may appear",
    color: "#F59E0B",
    bgGradient: "from-amber-50 via-orange-50 to-yellow-50",
    icon: <Sun className="w-6 h-6" />,
    tips: [
      "Be gentle with yourself",
      "Reduce salt and caffeine",
      "Light exercise can help",
      "Get plenty of sleep",
    ],
  },
  unknown: {
    name: "Track Your Cycle",
    description: "Log your period to see predictions",
    color: "#6B7280",
    bgGradient: "from-zinc-50 via-gray-50 to-slate-50",
    icon: <Moon className="w-6 h-6" />,
    tips: [
      "Start logging your cycle",
      "Track symptoms daily",
      "Note your energy levels",
      "Record your mood changes",
    ],
  },
};

export default function CyclePhaseRing({
  currentCycle,
  avgCycleLength,
  avgPeriodLength,
  locale,
  onStartPeriod,
  onEndPeriod,
}: Props) {
  const t = getTranslations(locale);

  const cycleInfo = useMemo(() => {
    if (!currentCycle) {
      return {
        phase: "unknown" as Phase,
        dayOfCycle: 0,
        progress: 0,
        daysUntilNextPeriod: null,
        nextPeriodDate: null,
        ovulationDate: null,
        fertileStart: null,
        fertileEnd: null,
        isPeriodActive: false,
      };
    }

    const today = new Date();
    const startDate = new Date(currentCycle.startDate);
    const dayOfCycle = differenceInDays(today, startDate) + 1;
    const progress = Math.min((dayOfCycle / avgCycleLength) * 100, 100);

    // Determine if currently menstruating
    const isPeriodActive = currentCycle.endDate
      ? today <= new Date(currentCycle.endDate)
      : dayOfCycle <= avgPeriodLength;

    // Calculate dates
    const ovulationDay = Math.round(avgCycleLength - 14);
    const ovulationDate = addDays(startDate, ovulationDay - 1);
    const fertileStart = addDays(ovulationDate, -5);
    const fertileEnd = ovulationDate;
    const nextPeriodDate = currentCycle.predictedStartDate
      ? new Date(currentCycle.predictedStartDate)
      : addDays(startDate, avgCycleLength);
    const daysUntilNextPeriod = Math.max(0, differenceInDays(nextPeriodDate, today));

    // Determine current phase
    let phase: Phase;
    if (isPeriodActive) {
      phase = "menstrual";
    } else if (dayOfCycle >= ovulationDay - 5 && dayOfCycle <= ovulationDay) {
      phase = "ovulation";
    } else if (dayOfCycle < ovulationDay - 5) {
      phase = "follicular";
    } else if (daysUntilNextPeriod <= 5) {
      phase = "pms";
    } else {
      phase = "luteal";
    }

    return {
      phase,
      dayOfCycle,
      progress,
      daysUntilNextPeriod,
      nextPeriodDate,
      ovulationDate,
      fertileStart,
      fertileEnd,
      isPeriodActive,
    };
  }, [currentCycle, avgCycleLength, avgPeriodLength]);

  const phaseInfo = PHASE_INFO[cycleInfo.phase];

  // SVG Ring calculations
  const size = 280;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (cycleInfo.progress / 100) * circumference;

  // Phase segments for the ring
  const menstrualEnd = (avgPeriodLength / avgCycleLength) * 100;
  const ovulationStart = ((avgCycleLength - 14 - 5) / avgCycleLength) * 100;
  const ovulationEnd = ((avgCycleLength - 14) / avgCycleLength) * 100;
  const pmsStart = ((avgCycleLength - 5) / avgCycleLength) * 100;

  return (
    <div className={`relative overflow-hidden rounded-[32px] p-8 shadow-xl border border-white/60 dark:border-zinc-800 bg-gradient-to-br ${phaseInfo.bgGradient} dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900`}>
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/30 dark:bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/40 dark:bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-32 h-32 bg-rose-200/20 dark:bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Cycle Ring */}
          <div className="relative flex-shrink-0">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background track with phase colors */}
              <defs>
                <linearGradient id="phaseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E11D48" />
                  <stop offset={`${menstrualEnd}%`} stopColor="#E11D48" />
                  <stop offset={`${menstrualEnd}%`} stopColor="#0EA5E9" />
                  <stop offset={`${ovulationStart}%`} stopColor="#0EA5E9" />
                  <stop offset={`${ovulationStart}%`} stopColor="#10B981" />
                  <stop offset={`${ovulationEnd}%`} stopColor="#10B981" />
                  <stop offset={`${ovulationEnd}%`} stopColor="#8B5CF6" />
                  <stop offset={`${pmsStart}%`} stopColor="#8B5CF6" />
                  <stop offset={`${pmsStart}%`} stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>

              {/* Outer decorative ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius + 8}
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeOpacity="0.3"
              />

              {/* Background ring with phase indicators */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="white"
                strokeWidth={strokeWidth}
                strokeOpacity="0.5"
              />

              {/* Progress ring */}
              {currentCycle && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={phaseInfo.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
                />
              )}

              {/* Inner decorative ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius - 14}
                fill="none"
                stroke="white"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 shadow-lg"
                style={{ backgroundColor: `${phaseInfo.color}20`, color: phaseInfo.color }}
              >
                {phaseInfo.icon}
              </div>
              {currentCycle ? (
                <>
                  <div className="text-5xl font-black text-zinc-800 dark:text-white leading-none">
                    {cycleInfo.dayOfCycle}
                  </div>
                  <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
                    {locale === "zh" ? "周期第几天" : "Day of Cycle"}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">🌸</div>
                  <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {locale === "zh" ? "开始追踪" : "Start Tracking"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="flex-1 text-center lg:text-left">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4"
              style={{ backgroundColor: `${phaseInfo.color}15`, color: phaseInfo.color }}
            >
              {phaseInfo.icon}
              <span>{locale === "zh" ? getChinesePhase(cycleInfo.phase) : phaseInfo.name}</span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-black text-zinc-800 dark:text-white mb-2">
              {currentCycle ? (
                cycleInfo.isPeriodActive ? (
                  locale === "zh" ? "经期进行中" : "On Your Period"
                ) : cycleInfo.daysUntilNextPeriod !== null && cycleInfo.daysUntilNextPeriod <= 3 ? (
                  locale === "zh" ? "经期即将到来" : "Period Coming Soon"
                ) : (
                  locale === "zh" ? phaseInfo.description : phaseInfo.description
                )
              ) : (
                locale === "zh" ? "开始记录您的周期" : "Start Tracking Your Cycle"
              )}
            </h2>

            <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md">
              {currentCycle && cycleInfo.nextPeriodDate ? (
                <>
                  {locale === "zh" ? "下次经期预计" : "Next period expected"}{" "}
                  <span className="font-bold" style={{ color: phaseInfo.color }}>
                    {format(cycleInfo.nextPeriodDate, locale === "zh" ? "M月d日" : "MMM d")}
                  </span>
                  {cycleInfo.daysUntilNextPeriod !== null && (
                    <span className="text-zinc-500 dark:text-zinc-500">
                      {" "}({cycleInfo.daysUntilNextPeriod} {locale === "zh" ? "天后" : "days"})
                    </span>
                  )}
                </>
              ) : (
                locale === "zh"
                  ? "记录您的经期以获得个性化预测和健康洞察"
                  : "Log your period to get personalized predictions and health insights"
              )}
            </p>

            {/* Quick Stats */}
            {currentCycle && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/40 dark:border-zinc-700/40">
                  <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    {locale === "zh" ? "周期" : "Cycle"}
                  </div>
                  <div className="text-xl font-black text-zinc-800 dark:text-white">{avgCycleLength}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{locale === "zh" ? "天" : "days"}</div>
                </div>
                <div className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/40 dark:border-zinc-700/40">
                  <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    {locale === "zh" ? "经期" : "Period"}
                  </div>
                  <div className="text-xl font-black text-zinc-800 dark:text-white">{avgPeriodLength}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{locale === "zh" ? "天" : "days"}</div>
                </div>
                <div className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/40 dark:border-zinc-700/40">
                  <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    {locale === "zh" ? "排卵" : "Ovulation"}
                  </div>
                  <div className="text-lg font-bold text-zinc-800 dark:text-white">
                    {cycleInfo.ovulationDate
                      ? format(cycleInfo.ovulationDate, locale === "zh" ? "M/d" : "M/d")
                      : "-"}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {currentCycle && cycleInfo.isPeriodActive ? (
                <button
                  onClick={onEndPeriod}
                  className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-md text-zinc-800 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Moon className="w-5 h-5 text-violet-500" />
                  {locale === "zh" ? "结束经期" : "End Period"}
                </button>
              ) : (
                <button
                  onClick={onStartPeriod}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Droplets className="w-5 h-5" />
                  {currentCycle
                    ? locale === "zh" ? "新周期开始" : "Start New Cycle"
                    : locale === "zh" ? "记录第一次经期" : "Log First Period"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Phase Tips */}
        {currentCycle && (
          <div className="mt-8 pt-6 border-t border-white/40 dark:border-zinc-700/40">
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              💡 {locale === "zh" ? "本阶段小贴士" : "Tips for This Phase"}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {phaseInfo.tips.map((tip, i) => (
                <div
                  key={i}
                  className="bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm rounded-xl p-3 text-sm text-zinc-700 dark:text-zinc-300 border border-white/40 dark:border-zinc-700/40"
                >
                  {locale === "zh" ? translateTip(tip) : tip}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getChinesePhase(phase: Phase): string {
  const map: Record<Phase, string> = {
    menstrual: "经期阶段",
    follicular: "卵泡期",
    ovulation: "排卵期",
    luteal: "黄体期",
    pms: "经前期",
    unknown: "开始追踪",
  };
  return map[phase];
}

function translateTip(tip: string): string {
  const tips: Record<string, string> = {
    "Rest when you need to": "需要时多休息",
    "Stay hydrated": "保持水分摄入",
    "Iron-rich foods can help": "多吃富含铁的食物",
    "Gentle exercise like yoga": "做些轻柔的瑜伽运动",
    "Energy levels rising": "精力逐渐上升",
    "Great time for new projects": "开始新项目的好时机",
    "Try new workouts": "尝试新的运动",
    "Creativity tends to peak": "创造力往往达到顶峰",
    "Most fertile time": "最易受孕期",
    "Peak energy and confidence": "精力和自信达到顶峰",
    "Great for social activities": "适合社交活动",
    "You may feel more attractive": "你可能会感觉更有魅力",
    "Nesting instincts may increase": "归巢本能可能增强",
    "Focus on self-care": "关注自我护理",
    "Magnesium can help with mood": "镁可以帮助调节情绪",
    "Avoid overcommitting": "避免过度承诺",
    "Be gentle with yourself": "对自己温柔一点",
    "Reduce salt and caffeine": "减少盐和咖啡因摄入",
    "Light exercise can help": "轻度运动有帮助",
    "Get plenty of sleep": "保证充足睡眠",
    "Start logging your cycle": "开始记录您的周期",
    "Track symptoms daily": "每天追踪症状",
    "Note your energy levels": "记录您的精力水平",
    "Record your mood changes": "记录您的情绪变化",
  };
  return tips[tip] || tip;
}

