"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";
import { format, differenceInDays, subDays, addDays } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { X, Moon, Calendar, CheckCircle2, Loader2, ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";

interface Props {
  currentCycle: any;
  locale: Locale;
  onClose: () => void;
}

export default function EndPeriodModal({ currentCycle, locale, onClose }: Props) {
  const router = useRouter();
  const t = getTranslations(locale);
  const dateLocale = locale === "zh" ? zhCN : enUS;
  const [isLoading, setIsLoading] = useState(false);
  
  const startDate = new Date(currentCycle.startDate);
  const today = new Date();
  const daysSinceStart = differenceInDays(today, startDate) + 1;
  
  // Default to a reasonable end date (either average period length or recent past)
  const defaultEndDate = daysSinceStart > 7 
    ? format(subDays(today, Math.min(daysSinceStart - 5, 3)), "yyyy-MM-dd")
    : format(today, "yyyy-MM-dd");
  
  const [endDate, setEndDate] = useState(defaultEndDate);
  
  const selectedEndDate = new Date(endDate);
  const periodLength = differenceInDays(selectedEndDate, startDate) + 1;
  
  // Check if this is a late entry (period ended more than expected)
  const isLateEntry = daysSinceStart > 10;

  // Quick select dates
  const quickDates = useMemo(() => {
    const dates = [];
    const maxDate = new Date();
    
    // Add recent dates for quick selection
    for (let i = 0; i < 7; i++) {
      const date = subDays(maxDate, i);
      if (date >= startDate) {
        dates.push(date);
      }
    }
    return dates;
  }, [startDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/period/cycles/${currentCycle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endDate: new Date(endDate).toISOString(),
          periodLength,
        }),
      });

      if (!response.ok) throw new Error("Failed to end period");

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error ending period:", error);
      alert(locale === "zh" ? "操作失败" : "Failed to end period");
    } finally {
      setIsLoading(false);
    }
  };
  
  const adjustDate = (days: number) => {
    const current = new Date(endDate);
    const newDate = addDays(current, days);
    
    // Ensure within valid range
    if (newDate >= startDate && newDate <= today) {
      setEndDate(format(newDate, "yyyy-MM-dd"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 border-b border-violet-100 dark:border-violet-900">
          <h3 className="text-lg sm:text-xl font-black text-zinc-800 dark:text-white flex items-center gap-2">
            <span className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center">
              {isLateEntry ? <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </span>
            {isLateEntry 
              ? (locale === "zh" ? "标记结束日期" : "Mark End Date")
              : (locale === "zh" ? "结束经期" : "End Period")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-white/60 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Late Entry Info */}
          {isLateEntry && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                <strong>⏰ </strong>
                {locale === "zh"
                  ? `看起来您忘记标记经期结束了（已经${daysSinceStart}天）。请选择经期实际结束的日期。`
                  : `Looks like you forgot to mark when your period ended (${daysSinceStart} days ago). Please select when it actually ended.`}
              </p>
            </div>
          )}
          
          {/* Period Summary */}
          <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-rose-100 dark:border-rose-900">
            <div className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 mb-2">
              {locale === "zh" ? "经期信息" : "Period Info"}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
                  {locale === "zh" ? "开始于" : "Started"}
                </div>
                <div className="font-bold text-zinc-800 dark:text-white text-sm sm:text-base">
                  {format(startDate, locale === "zh" ? "M月d日" : "MMM d", { locale: dateLocale })}
                </div>
              </div>
              <div className="text-xl sm:text-2xl text-zinc-300 dark:text-zinc-600">→</div>
              <div className="text-center">
                <div className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
                  {locale === "zh" ? "持续" : "Duration"}
                </div>
                <div className={`font-bold text-sm sm:text-base ${periodLength > 10 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-800 dark:text-white'}`}>
                  {periodLength} {locale === "zh" ? "天" : "days"}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Select Dates */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              {locale === "zh" ? "快速选择" : "Quick Select"}
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {quickDates.slice(0, 5).map((date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const isSelected = dateStr === endDate;
                const isToday = differenceInDays(today, date) === 0;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setEndDate(dateStr)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-violet-500 text-white shadow-md'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {isToday 
                      ? (locale === "zh" ? "今天" : "Today")
                      : format(date, locale === "zh" ? "M/d" : "M/d")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* End Date with Stepper */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              {locale === "zh" ? "结束日期" : "End Date"}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustDate(-1)}
                disabled={selectedEndDate <= startDate}
                className="p-2 sm:p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={format(startDate, "yyyy-MM-dd")}
                  max={format(today, "yyyy-MM-dd")}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl sm:rounded-2xl text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all cursor-pointer text-sm sm:text-base"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => adjustDate(1)}
                disabled={selectedEndDate >= today}
                className="p-2 sm:p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>
            <p className="mt-2 text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500">
              {locale === "zh"
                ? "选择经期的最后一天（流量几乎停止的那天）"
                : "Select the last day of bleeding (when flow nearly stopped)"}
            </p>
          </div>

          {/* Info */}
          <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-3 sm:p-4 border border-violet-100 dark:border-violet-900">
            <p className="text-xs sm:text-sm text-violet-700 dark:text-violet-400">
              <strong>💜 </strong>
              {locale === "zh"
                ? "记录经期结束可以帮助我们更准确地预测您的下一次经期和排卵期。"
                : "Recording when your period ends helps us predict your next period and ovulation more accurately."}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 sm:py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-sm sm:text-base"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading || periodLength < 1}
              className="flex-[2] py-3 sm:py-3.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-violet-200 dark:shadow-violet-900/30 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 text-sm sm:text-base"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              {isLoading
                ? locale === "zh" ? "保存中..." : "Saving..."
                : locale === "zh" ? "确认" : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


