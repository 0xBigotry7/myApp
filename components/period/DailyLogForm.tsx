"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";

interface Props {
  todayLog: any;
  locale: Locale;
}

const SYMPTOMS = [
  "cramps",
  "headache",
  "bloating",
  "breastTenderness",
  "acne",
  "backPain",
  "nausea",
  "fatigue",
];

const MOODS = [
  "happy",
  "sad",
  "anxious",
  "irritable",
  "energetic",
  "tired",
  "calm",
  "stressed",
];

const FLOW_LEVELS = ["spotting", "light", "medium", "heavy"];

export default function DailyLogForm({ todayLog, locale }: Props) {
  const router = useRouter();
  const t = getTranslations(locale);
  const [isLoading, setIsLoading] = useState(false);

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

      router.refresh();
    } catch (error) {
      console.error("Error saving log:", error);
      alert("Failed to save daily log");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">{t.todayLog}</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Flow Intensity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t.flowIntensity}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FLOW_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, flowIntensity: level }))
                }
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.flowIntensity === level
                    ? "border-pink-500 bg-pink-50 text-pink-700 font-semibold"
                    : "border-gray-200 hover:border-pink-300"
                }`}
              >
                {t[level as keyof typeof t]}
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t.symptoms}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SYMPTOMS.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                  formData.symptoms.includes(symptom)
                    ? "border-purple-500 bg-purple-50 text-purple-700 font-semibold"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                {t[symptom as keyof typeof t]}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t.mood}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => toggleMood(mood)}
                className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                  formData.mood.includes(mood)
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                {t[mood as keyof typeof t]}
              </button>
            ))}
          </div>
        </div>

        {/* Energy & Sleep */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t.energyLevel} (1-5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, energyLevel: level }))
                  }
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    formData.energyLevel === level
                      ? "border-yellow-500 bg-yellow-50 text-yellow-700 font-bold"
                      : "border-gray-200 hover:border-yellow-300"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t.sleepQuality} (1-5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, sleepQuality: level }))
                  }
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    formData.sleepQuality === level
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-bold"
                      : "border-gray-200 hover:border-indigo-300"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.notes}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder={`${t.notes}...`}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50"
        >
          {isLoading ? t.saving : t.save}
        </button>
      </form>
    </div>
  );
}
