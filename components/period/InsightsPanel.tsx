"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";
import { format } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import {
  Sparkles,
  Loader2,
  Brain,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  Heart,
  TrendingUp,
  Calendar,
  Check,
} from "lucide-react";

interface Props {
  insights: any[];
  locale: Locale;
}

export default function InsightsPanel({ insights, locale }: Props) {
  const router = useRouter();
  const t = getTranslations(locale);
  const dateLocale = locale === "zh" ? zhCN : enUS;
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
      alert(locale === "zh" ? "生成失败，请稍后重试" : "Failed to generate insights");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAsRead = async (insightId: string) => {
    try {
      await fetch("/api/period/insights", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId }),
      });
      router.refresh();
    } catch (error) {
      console.error("Error marking insight as read:", error);
    }
  };

  const getInsightStyle = (type: string, severity: string | null) => {
    if (severity === "urgent") {
      return {
        bg: "bg-gradient-to-br from-red-50 to-rose-50",
        border: "border-red-200",
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        iconBg: "bg-red-100",
      };
    }
    if (severity === "warning") {
      return {
        bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
        border: "border-amber-200",
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        iconBg: "bg-amber-100",
      };
    }

    switch (type) {
      case "cycle_prediction":
        return {
          bg: "bg-gradient-to-br from-violet-50 to-purple-50",
          border: "border-violet-200",
          icon: <Calendar className="w-5 h-5 text-violet-500" />,
          iconBg: "bg-violet-100",
        };
      case "ovulation_prediction":
        return {
          bg: "bg-gradient-to-br from-emerald-50 to-green-50",
          border: "border-emerald-200",
          icon: <Heart className="w-5 h-5 text-emerald-500" />,
          iconBg: "bg-emerald-100",
        };
      case "symptom_pattern":
        return {
          bg: "bg-gradient-to-br from-orange-50 to-amber-50",
          border: "border-orange-200",
          icon: <TrendingUp className="w-5 h-5 text-orange-500" />,
          iconBg: "bg-orange-100",
        };
      default:
        return {
          bg: "bg-gradient-to-br from-sky-50 to-blue-50",
          border: "border-sky-200",
          icon: <Lightbulb className="w-5 h-5 text-sky-500" />,
          iconBg: "bg-sky-100",
        };
    }
  };

  return (
    <div className="bg-white rounded-[28px] shadow-lg border border-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-fuchsia-50 to-pink-50 border-b border-fuchsia-100">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
            ✨ {t.aiInsights}
          </h3>
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white text-sm rounded-xl hover:shadow-lg transition-all duration-200 font-bold disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {locale === "zh" ? "分析中..." : "Analyzing..."}
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                {locale === "zh" ? "生成洞察" : "Generate"}
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          {locale === "zh"
            ? "基于您的周期数据的个性化健康建议"
            : "Personalized health insights based on your cycle data"}
        </p>
      </div>

      <div className="p-6">
        {/* Insights List */}
        {insights.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-fuchsia-400" />
            </div>
            <h4 className="text-lg font-bold text-zinc-800 mb-2">
              {locale === "zh" ? "获取 AI 健康洞察" : "Get AI Health Insights"}
            </h4>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-6">
              {locale === "zh"
                ? "点击上方按钮，AI 将分析您的周期数据并提供个性化建议"
                : "Click the button above to analyze your cycle data and get personalized suggestions"}
            </p>
            <button
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-bold disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {locale === "zh" ? "分析中..." : "Analyzing..."}
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  {locale === "zh" ? "开始分析" : "Start Analysis"}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => {
              const style = getInsightStyle(insight.type, insight.severity);
              return (
                <div
                  key={insight.id}
                  className={`${style.bg} rounded-2xl p-4 border ${style.border} transition-all hover:shadow-md ${
                    insight.isRead ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 ${style.iconBg} rounded-xl flex items-center justify-center`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-zinc-800">{insight.title}</h4>
                        {!insight.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(insight.id)}
                            className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg transition-colors"
                            title={locale === "zh" ? "标记为已读" : "Mark as read"}
                          >
                            <Check className="w-4 h-4 text-zinc-400" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
                        {insight.content}
                      </p>
                      <p className="text-xs text-zinc-400 mt-2">
                        {format(new Date(insight.createdAt), locale === "zh" ? "M月d日" : "MMM d", { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 pt-6 border-t border-zinc-100">
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
            <p className="text-sm text-violet-700">
              <strong>💜 </strong>
              {locale === "zh"
                ? "AI 洞察基于您的周期历史和症状模式生成。这些建议仅供参考，不能替代专业医疗建议。如有健康问题，请咨询医生。"
                : "AI insights are generated based on your cycle history and symptom patterns. These suggestions are for informational purposes only and do not replace professional medical advice. Please consult a doctor for health concerns."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
