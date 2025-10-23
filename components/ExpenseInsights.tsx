"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";

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
      }
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "alert":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "alert":
        return "🚨";
      case "warning":
        return "⚠️";
      default:
        return "💡";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{t.aiExpenseInsights}</h2>
        <button
          onClick={loadInsights}
          disabled={isLoading}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 text-sm"
        >
          {isLoading ? t.analyzing : `✨ ${t.analyzeSpending}`}
        </button>
      </div>

      {insights.length === 0 && !isLoading ? (
        <p className="text-gray-600 text-center py-8">
          {t.clickAnalyzeSpending}
        </p>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getSeverityColor(insight.severity)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getSeverityIcon(insight.severity)}</span>
                <div className="flex-1">
                  <p className="font-semibold mb-1">{insight.message}</p>
                  {insight.recommendation && (
                    <p className="text-sm opacity-90">
                      💡 {insight.recommendation}
                    </p>
                  )}
                  {insight.category && (
                    <span className="inline-block mt-2 text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                      {insight.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold mb-3">{t.quickSummary}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">{t.dailyBudgetRemaining}</p>
              <p className="font-semibold text-lg">
                $
                {summary.daysRemaining > 0
                  ? (summary.remaining / summary.daysRemaining).toFixed(2)
                  : "0.00"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">{t.daysRemaining}</p>
              <p className="font-semibold text-lg">{summary.daysRemaining}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
