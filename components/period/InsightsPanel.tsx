"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";
import { format } from "date-fns";

interface Props {
  insights: any[];
  locale: Locale;
}

export default function InsightsPanel({ insights, locale }: Props) {
  const router = useRouter();
  const t = getTranslations(locale);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/period/insights", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to generate insights");

      router.refresh();
    } catch (error) {
      console.error("Error generating insights:", error);
      alert("Failed to generate insights");
    } finally {
      setIsGenerating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      case "urgent":
        return "bg-red-50 border-red-200 text-red-900";
      default:
        return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "warning":
        return "⚠️";
      case "urgent":
        return "🚨";
      default:
        return "💡";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">{t.aiInsights}</h3>
        <button
          onClick={handleGenerateInsights}
          disabled={isGenerating}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50"
        >
          {isGenerating ? t.generating : "✨ " + t.aiInsights}
        </button>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-gray-600 text-sm">
              {t.clickAnalyzeSpending || "Generate AI insights to understand your cycle patterns"}
            </p>
          </div>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border-2 ${getSeverityColor(
                insight.severity || "info"
              )}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">
                  {getSeverityIcon(insight.severity || "info")}
                </span>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                  <p className="text-sm mb-2">{insight.content}</p>
                  <p className="text-xs opacity-75">
                    {format(new Date(insight.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-900">
            <strong>💜 {t.note || "Note"}:</strong> {locale === "zh"
              ? "AI 洞察基于您的周期历史和症状模式生成。这些建议仅供参考，不能替代专业医疗建议。"
              : "AI insights are generated based on your cycle history and symptom patterns. These suggestions are for informational purposes and do not replace professional medical advice."}
          </p>
        </div>
      </div>
    </div>
  );
}
