"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";

interface ActivityInputFormProps {
  tripId: string;
  startDate: Date;
  endDate: Date;
}

const ACTIVITY_CATEGORIES = [
  "🍽️ Dining",
  "🎭 Entertainment",
  "🏛️ Sightseeing",
  "🏃 Activities",
  "🛍️ Shopping",
  "🚗 Transportation",
  "🏨 Accommodation",
  "✈️ Flight",
  "📸 Photo Op",
  "🎨 Culture",
  "🌳 Nature",
  "💼 Business",
  "🎉 Event",
  "📚 Education",
  "🧘 Wellness",
  "🎮 Gaming",
  "☕ Cafe",
  "🍺 Nightlife",
  "🏖️ Beach",
  "⛷️ Adventure",
];

export default function ActivityInputForm({
  tripId,
  startDate,
  endDate,
}: ActivityInputFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = getTranslations(locale);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: format(new Date(startDate), "yyyy-MM-dd"),
    startTime: "",
    endTime: "",
    location: "",
    category: ACTIVITY_CATEGORIES[0],
    estimatedCost: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Fix timezone: use noon local time to avoid date shifts
      const activityDate = new Date(`${formData.date}T12:00:00`);

      const response = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId,
          title: formData.title,
          description: formData.description || undefined,
          date: activityDate.toISOString(),
          startTime: formData.startTime || undefined,
          endTime: formData.endTime || undefined,
          location: formData.location || undefined,
          category: formData.category,
          estimatedCost: formData.estimatedCost
            ? parseFloat(formData.estimatedCost)
            : undefined,
          notes: formData.notes || undefined,
          isAiGenerated: false,
        }),
      });

      if (response.ok) {
        router.push(`/trips/${tripId}`);
        router.refresh();
      } else {
        alert("Failed to add activity");
      }
    } catch (error) {
      console.error("Error adding activity:", error);
      alert("Error adding activity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title - Large, prominent */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          ✏️ {t.activityName}
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-5 py-4 text-xl font-semibold border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-300"
          placeholder="e.g., Visit Eiffel Tower"
        />
      </div>

      {/* Category - Large touch targets */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          🏷️ {t.category}
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1rem center",
            backgroundSize: "1.5rem",
          }}
        >
          {ACTIVITY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          📅 {t.date}
        </label>
        <input
          type="date"
          required
          value={formData.date}
          min={format(new Date(startDate), "yyyy-MM-dd")}
          max={format(new Date(endDate), "yyyy-MM-dd")}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            ⏰ {t.startTime} <span className="text-gray-400 font-normal">({t.optional})</span>
          </label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) =>
              setFormData({ ...formData, startTime: e.target.value })
            }
            className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            ⏰ {t.endTime} <span className="text-gray-400 font-normal">({t.optional})</span>
          </label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) =>
              setFormData({ ...formData, endTime: e.target.value })
            }
            className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          📍 {t.location} <span className="text-gray-400 font-normal">({t.optional})</span>
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400"
          placeholder="e.g., Champ de Mars, 5 Avenue Anatole"
        />
      </div>

      {/* Estimated Cost */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          💰 {t.estimatedCost} <span className="text-gray-400 font-normal">({t.optional})</span>
        </label>
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">
            $
          </span>
          <input
            type="number"
            step="0.01"
            value={formData.estimatedCost}
            onChange={(e) =>
              setFormData({ ...formData, estimatedCost: e.target.value })
            }
            className="w-full pl-12 pr-6 py-4 text-xl font-semibold border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-300"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          📝 {t.description} <span className="text-gray-400 font-normal">({t.optional})</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-none"
          placeholder="e.g., Iconic iron lattice tower with panoramic city views"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          📋 {t.notes} <span className="text-gray-400 font-normal">({t.optional})</span>
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-none"
          placeholder="e.g., Book tickets online in advance"
        />
      </div>

      {/* Submit Button - Large, prominent */}
      <div className="pt-4 space-y-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-sunset-pink text-white py-5 rounded-2xl font-bold text-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
        >
          {loading ? `💾 ${t.saving}` : `✓ ${t.saveActivity}`}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all"
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
