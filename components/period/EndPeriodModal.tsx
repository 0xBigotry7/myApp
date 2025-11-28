"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";
import { format, differenceInDays } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { X, Moon, Calendar, CheckCircle2, Loader2 } from "lucide-react";

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
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const startDate = new Date(currentCycle.startDate);
  const selectedEndDate = new Date(endDate);
  const periodLength = differenceInDays(selectedEndDate, startDate) + 1;

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
          <h3 className="text-xl font-black text-zinc-800 flex items-center gap-2">
            <span className="bg-violet-100 text-violet-600 w-8 h-8 rounded-lg flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </span>
            {locale === "zh" ? "结束经期" : "End Period"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-white/60 rounded-full transition-colors text-zinc-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Period Summary */}
          <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
            <div className="text-sm font-bold text-rose-600 mb-2">
              {locale === "zh" ? "当前经期" : "Current Period"}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-zinc-600 text-sm">
                  {locale === "zh" ? "开始于" : "Started"}
                </div>
                <div className="font-bold text-zinc-800">
                  {format(startDate, locale === "zh" ? "M月d日" : "MMM d", { locale: dateLocale })}
                </div>
              </div>
              <div className="text-2xl">→</div>
              <div className="text-center">
                <div className="text-zinc-600 text-sm">
                  {locale === "zh" ? "持续" : "Duration"}
                </div>
                <div className="font-bold text-zinc-800">
                  {periodLength} {locale === "zh" ? "天" : "days"}
                </div>
              </div>
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              {locale === "zh" ? "最后一天" : "Last Day"}
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={format(startDate, "yyyy-MM-dd")}
                max={new Date().toISOString().split("T")[0]}
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-900 font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all cursor-pointer"
                required
              />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              {locale === "zh"
                ? "选择经期的最后一天（流量几乎停止的那天）"
                : "Select the last day of bleeding (when flow nearly stopped)"}
            </p>
          </div>

          {/* Info */}
          <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
            <p className="text-sm text-violet-700">
              <strong>💜 </strong>
              {locale === "zh"
                ? "记录经期结束可以帮助我们更准确地预测您的下一次经期和排卵期。"
                : "Recording when your period ends helps us predict your next period and ovulation more accurately."}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading || periodLength < 1}
              className="flex-[2] py-3.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-violet-200 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              {isLoading
                ? locale === "zh" ? "保存中..." : "Saving..."
                : locale === "zh" ? "确认结束" : "Confirm End"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

