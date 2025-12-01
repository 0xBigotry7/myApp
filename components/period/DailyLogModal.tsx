"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";
import { format, isToday, isBefore } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import {
  X,
  Droplets,
  Thermometer,
  Moon,
  Zap,
  Smile,
  Save,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Scale,
  Sparkles,
} from "lucide-react";

interface Props {
  date: Date;
  existingLog: any;
  locale: Locale;
  onClose: () => void;
  onDateChange: (date: Date) => void;
}

const SYMPTOMS = [
  { id: "cramps", icon: "⚡️", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "headache", icon: "🤕", color: "bg-red-100 text-red-700 border-red-200" },
  { id: "bloating", icon: "🎈", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "breastTenderness", icon: "🌸", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { id: "acne", icon: "✨", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "backPain", icon: "🦴", color: "bg-stone-100 text-stone-700 border-stone-200" },
  { id: "nausea", icon: "🤢", color: "bg-green-100 text-green-700 border-green-200" },
  { id: "fatigue", icon: "😴", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { id: "cravings", icon: "🍫", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "insomnia", icon: "🌙", color: "bg-violet-100 text-violet-700 border-violet-200" },
  { id: "hotFlashes", icon: "🔥", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { id: "dizziness", icon: "💫", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

const MOODS = [
  { id: "happy", icon: "😊", label: "Happy", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "calm", icon: "😌", label: "Calm", color: "bg-sky-100 text-sky-700 border-sky-200" },
  { id: "energetic", icon: "🤩", label: "Energetic", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { id: "loving", icon: "🥰", label: "Loving", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { id: "sad", icon: "😢", label: "Sad", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "anxious", icon: "😰", label: "Anxious", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "irritable", icon: "😤", label: "Irritable", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { id: "stressed", icon: "😫", label: "Stressed", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "tired", icon: "🥱", label: "Tired", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "moody", icon: "😶‍🌫️", label: "Moody", color: "bg-violet-100 text-violet-700 border-violet-200" },
  { id: "sensitive", icon: "🥺", label: "Sensitive", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "motivated", icon: "💪", label: "Motivated", color: "bg-teal-100 text-teal-700 border-teal-200" },
];

const FLOW_LEVELS = [
  { id: "spotting", label: "Spotting", dots: 1, color: "bg-rose-100 text-rose-600 border-rose-300" },
  { id: "light", label: "Light", dots: 2, color: "bg-rose-200 text-rose-700 border-rose-400" },
  { id: "medium", label: "Medium", dots: 3, color: "bg-rose-300 text-rose-800 border-rose-500" },
  { id: "heavy", label: "Heavy", dots: 4, color: "bg-rose-400 text-rose-900 border-rose-600" },
];

const CERVICAL_MUCUS = [
  { id: "dry", icon: "💨", label: "Dry" },
  { id: "sticky", icon: "🧶", label: "Sticky" },
  { id: "creamy", icon: "🥛", label: "Creamy" },
  { id: "watery", icon: "💧", label: "Watery" },
  { id: "eggWhite", icon: "🥚", label: "Egg White" },
];

export default function DailyLogModal({
  date,
  existingLog,
  locale,
  onClose,
  onDateChange,
}: Props) {
  const router = useRouter();
  const t = getTranslations(locale);
  const dateLocale = locale === "zh" ? zhCN : enUS;
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"flow" | "symptoms" | "mood" | "vitals">("flow");

  const [formData, setFormData] = useState({
    flowIntensity: existingLog?.flowIntensity || "",
    symptoms: existingLog?.symptoms || [],
    mood: existingLog?.mood || [],
    energyLevel: existingLog?.energyLevel || null,
    sleepQuality: existingLog?.sleepQuality || null,
    sexualActivity: existingLog?.sexualActivity || false,
    notes: existingLog?.notes || "",
    weight: existingLog?.weight || "",
    temperature: existingLog?.temperature || "",
    cervicalMucus: existingLog?.cervicalMucus || "",
  });

  // Update form when date/log changes
  useEffect(() => {
    setFormData({
      flowIntensity: existingLog?.flowIntensity || "",
      symptoms: existingLog?.symptoms || [],
      mood: existingLog?.mood || [],
      energyLevel: existingLog?.energyLevel || null,
      sleepQuality: existingLog?.sleepQuality || null,
      sexualActivity: existingLog?.sexualActivity || false,
      notes: existingLog?.notes || "",
      weight: existingLog?.weight || "",
      temperature: existingLog?.temperature || "",
      cervicalMucus: existingLog?.cervicalMucus || "",
    });
    setSuccess(false);
  }, [existingLog, date]);

  const toggleSymptom = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s: string) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const toggleMood = (mood: string) => {
    setFormData((prev) => ({
      ...prev,
      mood: prev.mood.includes(mood)
        ? prev.mood.filter((m: string) => m !== mood)
        : [...prev.mood, mood],
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/period/daily-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date.toISOString(),
          ...formData,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to save log");

      setSuccess(true);
      router.refresh();
    } catch (error) {
      console.error("Error saving log:", error);
      alert(locale === "zh" ? "保存失败" : "Failed to save daily log");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    if (!isBefore(new Date(), newDate) || isToday(newDate)) {
      onDateChange(newDate);
    }
  };

  const tabs = [
    { id: "flow", label: locale === "zh" ? "流量" : "Flow", icon: <Droplets className="w-4 h-4" /> },
    { id: "symptoms", label: locale === "zh" ? "症状" : "Symptoms", icon: <Thermometer className="w-4 h-4" /> },
    { id: "mood", label: locale === "zh" ? "心情" : "Mood", icon: <Smile className="w-4 h-4" /> },
    { id: "vitals", label: locale === "zh" ? "身体" : "Vitals", icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg max-h-[90vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 -ml-2 hover:bg-white/60 rounded-full transition-colors text-zinc-500"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDay("prev")}
                className="p-2 hover:bg-white/60 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-600" />
              </button>
              <div className="text-center min-w-[140px]">
                <div className="font-bold text-zinc-800">
                  {isToday(date)
                    ? locale === "zh" ? "今天" : "Today"
                    : format(date, locale === "zh" ? "M月d日" : "MMM d", { locale: dateLocale })}
                </div>
                <div className="text-xs text-zinc-500">
                  {format(date, locale === "zh" ? "EEEE" : "EEEE", { locale: dateLocale })}
                </div>
              </div>
              <button
                onClick={() => navigateDay("next")}
                disabled={isToday(date)}
                className="p-2 hover:bg-white/60 rounded-full transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                success
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-500 text-white hover:bg-rose-600"
              } disabled:opacity-50`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : success ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {success ? (locale === "zh" ? "已保存" : "Saved") : (locale === "zh" ? "保存" : "Save")}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 px-4 pt-4 pb-2 bg-white border-b border-zinc-100">
          <div className="flex gap-1 p-1 bg-zinc-100 rounded-2xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Flow Tab */}
          {activeTab === "flow" && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  <Droplets className="w-4 h-4 text-rose-500" />
                  {t.flowIntensity}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {FLOW_LEVELS.map((level) => {
                    const isSelected = formData.flowIntensity === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            flowIntensity: isSelected ? "" : level.id,
                          }))
                        }
                        className={`relative py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? `${level.color} shadow-md scale-105`
                            : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        <div className="flex gap-1">
                          {Array.from({ length: level.dots }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                isSelected ? "bg-current" : "bg-zinc-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold capitalize">
                          {t[level.id as keyof typeof t] || level.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cervical Mucus */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  {t.cervicalMucus}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CERVICAL_MUCUS.map((type) => {
                    const isSelected = formData.cervicalMucus === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            cervicalMucus: isSelected ? "" : type.id,
                          }))
                        }
                        className={`px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium flex items-center gap-2 ${
                          isSelected
                            ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                            : "border-zinc-100 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        <span>{type.icon}</span>
                        <span>{t[type.id as keyof typeof t] || type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sexual Activity */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  <Heart className="w-4 h-4 text-pink-500" />
                  {locale === "zh" ? "亲密活动" : "Intimacy"}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      sexualActivity: !prev.sexualActivity,
                    }))
                  }
                  className={`w-full py-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                    formData.sexualActivity
                      ? "border-pink-500 bg-pink-50 text-pink-700 shadow-sm"
                      : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${formData.sexualActivity ? "fill-current" : ""}`} />
                  {formData.sexualActivity
                    ? locale === "zh" ? "是" : "Yes"
                    : locale === "zh" ? "否" : "No"}
                </button>
              </div>
            </div>
          )}

          {/* Symptoms Tab */}
          {activeTab === "symptoms" && (
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                <Thermometer className="w-4 h-4 text-orange-500" />
                {t.symptoms}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SYMPTOMS.map((symptom) => {
                  const isSelected = formData.symptoms.includes(symptom.id);
                  return (
                    <button
                      key={symptom.id}
                      type="button"
                      onClick={() => toggleSymptom(symptom.id)}
                      className={`px-3 py-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center gap-2 ${
                        isSelected
                          ? `${symptom.color} shadow-sm`
                          : "border-zinc-100 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      <span className="text-lg">{symptom.icon}</span>
                      <span className="truncate">
                        {t[symptom.id as keyof typeof t] || symptom.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mood Tab */}
          {activeTab === "mood" && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  <Smile className="w-4 h-4 text-yellow-500" />
                  {t.mood}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {MOODS.map((mood) => {
                    const isSelected = formData.mood.includes(mood.id);
                    return (
                      <button
                        key={mood.id}
                        type="button"
                        onClick={() => toggleMood(mood.id)}
                        className={`px-3 py-3 rounded-xl border-2 transition-all text-sm font-medium flex flex-col items-center gap-1 ${
                          isSelected
                            ? `${mood.color} shadow-sm`
                            : "border-zinc-100 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        <span className="text-2xl">{mood.icon}</span>
                        <span className="text-xs truncate">
                          {t[mood.id as keyof typeof t] || mood.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Energy Level */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  <Zap className="w-4 h-4 text-amber-500" />
                  {t.energyLevel}
                </label>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, energyLevel: level }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                        formData.energyLevel === level
                          ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md"
                          : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                      }`}
                    >
                      {level === 1 ? "😩" : level === 2 ? "😔" : level === 3 ? "😐" : level === 4 ? "😊" : "🤩"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sleep Quality */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  {t.sleepQuality}
                </label>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, sleepQuality: level }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                        formData.sleepQuality === level
                          ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md"
                          : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                      }`}
                    >
                      {level === 1 ? "😫" : level === 2 ? "😴" : level === 3 ? "😐" : level === 4 ? "😊" : "😇"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Vitals Tab */}
          {activeTab === "vitals" && (
            <div className="space-y-6">
              {/* Temperature */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  {t.temperature} (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="35"
                  max="42"
                  value={formData.temperature}
                  onChange={(e) => setFormData((prev) => ({ ...prev, temperature: e.target.value }))}
                  placeholder={locale === "zh" ? "例如：36.5" : "e.g., 36.5"}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
                <p className="mt-2 text-xs text-zinc-400">
                  {locale === "zh"
                    ? "基础体温可以帮助追踪排卵"
                    : "Basal body temperature helps track ovulation"}
                </p>
              </div>

              {/* Weight */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  <Scale className="w-4 h-4 text-blue-500" />
                  {t.weight} (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={formData.weight}
                  onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                  placeholder={locale === "zh" ? "例如：55.5" : "e.g., 55.5"}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  {t.notes}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none transition-all placeholder:text-zinc-400"
                  placeholder={locale === "zh" ? "今天有什么想记录的？" : "Anything you'd like to note?"}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



