"use client";

import { useState } from "react";
import { useLocale } from "@/components/LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";
import { Sparkles, AlertCircle, AlertTriangle, Info, Lightbulb, CheckCircle2 } from "lucide-react";

interface ExpenseInsight {
  message: string;
  severity: "info" | "warning" | "alert";
  category?: string;
  recommendation?: string;
}

interface ExpenseInsightsProps {
  tripId: string;
}

export default function ExpenseInsights({ tripId }: ExpenseInsightsProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const [insights, setInsights] = useState<ExpenseInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/analyze-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
        setSummary(data.summary);
        setHasLoaded(true);
      }
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "alert":
        return {
          bg: "bg-red-50",
          border: "border-red-100",
          text: "text-red-900",
          icon: AlertCircle,
          iconColor: "text-red-600"
        };
      case "warning":
        return {
          bg: "bg-amber-50",
          border: "border-amber-100",
          text: "text-amber-900",
          icon: AlertTriangle,
          iconColor: "text-amber-600"
        };
      default:
        return {
          bg: "bg-indigo-50",
          border: "border-indigo-100",
          text: "text-indigo-900",
          icon: Lightbulb,
          iconColor: "text-indigo-600"
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
      <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-bold text-zinc-900">{t.aiExpenseInsights}</h2>
        </div>
        <button
          onClick={loadInsights}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all shadow-sm active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <span className="animate-spin block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              {t.analyzing}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {t.analyzeSpending}
            </>
          )}
        </button>
      </div>

      {!hasLoaded && !isLoading && (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-zinc-600 font-medium mb-1">Unlock spending insights</p>
          <p className="text-zinc-400 text-sm">
            {t.clickAnalyzeSpending}
          </p>
        </div>
      )}

      {hasLoaded && (
        <div className="p-6 space-y-6">
          {summary && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">{t.dailyBudgetRemaining}</p>
                <p className="font-bold text-2xl text-zinc-900">
                  $
                  {summary.daysRemaining > 0
                    ? (summary.remaining / summary.daysRemaining).toFixed(2)
                    : "0.00"}
                </p>
                <p className="text-xs text-zinc-400 mt-1">per day</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">{t.daysRemaining}</p>
                <p className="font-bold text-2xl text-zinc-900">{summary.daysRemaining}</p>
                <p className="text-xs text-zinc-400 mt-1">days left</p>
              </div>
            </div>
          )}

          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => {
                const styles = getSeverityStyles(insight.severity);
                const Icon = styles.icon;
                
                return (
                  <div
                    key={index}
                    className={`rounded-xl p-4 border ${styles.bg} ${styles.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full bg-white/50 ${styles.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${styles.text} mb-1`}>{insight.message}</p>
                        {insight.recommendation && (
                          <p className={`text-sm ${styles.text} opacity-90 flex items-start gap-1.5 mt-1`}>
                            <Info className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                            {insight.recommendation}
                          </p>
                        )}
                        {insight.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/60 text-zinc-700 mt-2 border border-black/5">
                            {insight.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-zinc-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Your spending looks good! No alerts found.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
