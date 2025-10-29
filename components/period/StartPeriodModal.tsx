"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";

interface Props {
  onClose: () => void;
  locale: Locale;
}

export default function StartPeriodModal({ onClose, locale }: Props) {
  const router = useRouter();
  const t = getTranslations(locale);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    flowIntensity: "medium",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/period/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to start period");

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error starting period:", error);
      alert("Failed to start period");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{t.startPeriod}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.startDate}
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startDate: e.target.value }))
              }
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Flow Intensity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t.flowIntensity}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["light", "medium", "heavy"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, flowIntensity: level }))
                  }
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.notes} ({t.optional})
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

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50"
            >
              {isLoading ? t.saving : t.startPeriod}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
