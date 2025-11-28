"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";
import { 
  Droplets, 
  Smile, 
  Frown, 
  Meh, 
  Zap, 
  Moon, 
  Activity, 
  Thermometer, 
  Save, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface Props {
  todayLog: any;
  locale: Locale;
}

const SYMPTOMS = [
  { id: "cramps", icon: "⚡️" },
  { id: "headache", icon: "🤕" },
  { id: "bloating", icon: "🐡" },
  { id: "breastTenderness", icon: "🍈" },
  { id: "acne", icon: "🧖‍♀️" },
  { id: "backPain", icon: "🦴" },
  { id: "nausea", icon: "🤢" },
  { id: "fatigue", icon: "😴" },
];

const MOODS = [
  { id: "happy", icon: "😊", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "sad", icon: "😢", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "anxious", icon: "😰", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "irritable", icon: "😠", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { id: "energetic", icon: "🤩", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { id: "tired", icon: "🥱", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "calm", icon: "😌", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { id: "stressed", icon: "😫", color: "bg-orange-100 text-orange-700 border-orange-200" },
];

const FLOW_LEVELS = [
  { id: "spotting", color: "bg-rose-50 text-rose-600" },
  { id: "light", color: "bg-rose-100 text-rose-700" },
  { id: "medium", color: "bg-rose-200 text-rose-800" },
  { id: "heavy", color: "bg-rose-300 text-rose-900" }
];

export default function DailyLogForm({ todayLog, locale }: Props) {
  const router = useRouter();
  const t = getTranslations(locale);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    flowIntensity: todayLog?.flowIntensity || "",
    symptoms: todayLog?.symptoms || [],
    mood: todayLog?.mood || [],
    energyLevel: todayLog?.energyLevel || null,
    sleepQuality: todayLog?.sleepQuality || null,
    notes: todayLog?.notes || "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/period/daily-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          ...formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to save log");

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving log:", error);
      alert("Failed to save daily log");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-zinc-100 overflow-hidden">
      <div className="p-6 border-b border-zinc-50 bg-zinc-50/50">
        <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          {t.todayLog}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Flow Intensity */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
            <Droplets className="w-4 h-4" />
            {t.flowIntensity}
          </label>
          <div className="grid grid-cols-4 gap-3">
            {FLOW_LEVELS.map((level) => {
              const isSelected = formData.flowIntensity === level.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, flowIntensity: isSelected ? "" : level.id }))}
                  className={`relative py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    isSelected
                      ? `border-rose-500 ${level.color} shadow-sm scale-105`
                      : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${isSelected ? "bg-rose-500" : "bg-zinc-300"}`} />
                  <span className="text-xs font-bold capitalize">{t[level.id as keyof typeof t]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
            <Thermometer className="w-4 h-4" />
            {t.symptoms}
          </label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((symptom) => {
              const isSelected = formData.symptoms.includes(symptom.id);
              return (
                <button
                  key={symptom.id}
                  type="button"
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`px-4 py-2 rounded-xl border transition-all text-sm font-medium flex items-center gap-2 ${
                    isSelected
                      ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                      : "border-zinc-100 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <span>{symptom.icon}</span>
                  <span>{t[symptom.id as keyof typeof t]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mood */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
            <Smile className="w-4 h-4" />
            {t.mood}
          </label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => {
              const isSelected = formData.mood.includes(mood.id);
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => toggleMood(mood.id)}
                  className={`px-4 py-2 rounded-xl border transition-all text-sm font-medium flex items-center gap-2 ${
                    isSelected
                      ? `${mood.color} shadow-sm ring-1 ring-inset ring-black/5`
                      : "border-zinc-100 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <span>{mood.icon}</span>
                  <span>{t[mood.id as keyof typeof t]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Energy & Sleep */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
              <Zap className="w-4 h-4" />
              {t.energyLevel}
            </label>
            <div className="flex justify-between gap-1 bg-zinc-50 p-1.5 rounded-xl border border-zinc-100">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, energyLevel: level }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    formData.energyLevel === level
                      ? "bg-yellow-400 text-yellow-900 shadow-sm"
                      : "text-zinc-400 hover:bg-zinc-100"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
              <Moon className="w-4 h-4" />
              {t.sleepQuality}
            </label>
            <div className="flex justify-between gap-1 bg-zinc-50 p-1.5 rounded-xl border border-zinc-100">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, sleepQuality: level }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    formData.sleepQuality === level
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "text-zinc-400 hover:bg-zinc-100"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">
            {t.notes}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all placeholder:text-zinc-400"
            placeholder="How are you feeling today?"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
            success 
              ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" 
              : "bg-zinc-900 hover:bg-zinc-800 shadow-zinc-200"
          } disabled:opacity-50 disabled:scale-100`}
        >
          {isLoading ? (
            "Saving..."
          ) : success ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {t.save}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
