"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";

const POPULAR_DESTINATIONS = [
  { city: "Tokyo", country: "Japan", code: "JP", lat: 35.6762, lng: 139.6503, flag: "🇯🇵" },
  { city: "Paris", country: "France", code: "FR", lat: 48.8566, lng: 2.3522, flag: "🇫🇷" },
  { city: "New York", country: "USA", code: "US", lat: 40.7128, lng: -74.0060, flag: "🇺🇸" },
  { city: "London", country: "UK", code: "GB", lat: 51.5074, lng: -0.1278, flag: "🇬🇧" },
  { city: "Barcelona", country: "Spain", code: "ES", lat: 41.3851, lng: 2.1734, flag: "🇪🇸" },
  { city: "Rome", country: "Italy", code: "IT", lat: 41.9028, lng: 12.4964, flag: "🇮🇹" },
  { city: "Dubai", country: "UAE", code: "AE", lat: 25.2048, lng: 55.2708, flag: "🇦🇪" },
  { city: "Singapore", country: "Singapore", code: "SG", lat: 1.3521, lng: 103.8198, flag: "🇸🇬" },
  { city: "Seoul", country: "South Korea", code: "KR", lat: 37.5665, lng: 126.9780, flag: "🇰🇷" },
  { city: "Sydney", country: "Australia", code: "AU", lat: -33.8688, lng: 151.2093, flag: "🇦🇺" },
];

export default function AddDestinationForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = getTranslations(locale);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [useQuickSelect, setUseQuickSelect] = useState(true);

  const [formData, setFormData] = useState({
    city: "",
    country: "",
    countryCode: "",
    latitude: 0,
    longitude: 0,
    visitDate: "",
    isFuture: false,
    notes: "",
    rating: 0,
    highlights: "",
  });

  const handleQuickSelect = (dest: typeof POPULAR_DESTINATIONS[0]) => {
    setFormData({
      ...formData,
      city: dest.city,
      country: dest.country,
      countryCode: dest.code,
      latitude: dest.lat,
      longitude: dest.lng,
    });
    setUseQuickSelect(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          visitDate: formData.visitDate ? new Date(formData.visitDate) : null,
          highlights: formData.highlights
            ? formData.highlights.split(",").map((h) => h.trim()).filter(Boolean)
            : [],
          rating: formData.rating > 0 ? formData.rating : null,
        }),
      });

      if (response.ok) {
        router.push("/map");
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add destination");
      }
    } catch (err) {
      setError("Failed to add destination. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Select Popular Destinations */}
      {useQuickSelect && (
        <div className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🌟 {t.quickSelect}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            {POPULAR_DESTINATIONS.map((dest) => (
              <button
                key={dest.code}
                type="button"
                onClick={() => handleQuickSelect(dest)}
                className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-gray-200 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all active:scale-95 flex flex-col items-center"
              >
                <div className="text-3xl mb-1">{dest.flag}</div>
                <div className="text-sm font-bold text-gray-900 text-center leading-tight">
                  {dest.city}
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setUseQuickSelect(false)}
            className="w-full text-sm text-gray-600 hover:text-gray-900 font-semibold"
          >
            {t.customDestination} →
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Main Form */}
      {!useQuickSelect && (
        <div className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">🏙️ {t.city}</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                placeholder="Tokyo"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">🌍 {t.country}</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                placeholder="Japan"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              🏳️ {t.countryCode} <span className="text-gray-400 font-normal">(2 letters)</span>
            </label>
            <input
              type="text"
              required
              maxLength={2}
              value={formData.countryCode}
              onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 uppercase focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              placeholder="JP"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">📍 {t.latitude}</label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude || ""}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                placeholder="35.6762"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">📍 {t.longitude}</label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude || ""}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                placeholder="139.6503"
              />
            </div>
          </div>
        </div>
      )}

      {/* Visit Details */}
      <div className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-sm space-y-5">
        <h3 className="text-lg font-bold text-gray-900">{t.visitDetails}</h3>

        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border-2 border-orange-200">
          <input
            type="checkbox"
            id="future"
            checked={formData.isFuture}
            onChange={(e) => setFormData({ ...formData, isFuture: e.target.checked })}
            className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
          <label htmlFor="future" className="flex-1">
            <div className="font-bold text-sm text-gray-900">⏰ {t.futureTrip}</div>
            <div className="text-xs text-gray-600">{t.markAsFuture}</div>
          </label>
        </div>

        {!formData.isFuture && (
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">📅 {t.visitDate}</label>
            <input
              type="date"
              value={formData.visitDate}
              onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">⭐ {t.rating}</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star })}
                className="text-4xl transition-all hover:scale-110 active:scale-95"
              >
                {formData.rating >= star ? "⭐" : "☆"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            ✨ {t.highlights} <span className="text-gray-400 font-normal">(comma separated)</span>
          </label>
          <input
            type="text"
            value={formData.highlights}
            onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            placeholder="Eiffel Tower, Louvre Museum, Notre Dame"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">📝 {t.notes}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium text-gray-900 focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none"
            placeholder="Add your memories and thoughts..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-2 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-purple-600 text-white min-w-[60%]"
        >
          {isSubmitting ? `💾 ${t.saving}` : `✓ ${t.addDestination}`}
        </button>
      </div>
    </form>
  );
}
