"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";

// Comprehensive city database with coordinates
const CITIES_DATABASE = [
  // Asia
  { city: "Tokyo", country: "Japan", code: "JP", lat: 35.6762, lng: 139.6503, flag: "🇯🇵", region: "Asia" },
  { city: "Seoul", country: "South Korea", code: "KR", lat: 37.5665, lng: 126.9780, flag: "🇰🇷", region: "Asia" },
  { city: "Beijing", country: "China", code: "CN", lat: 39.9042, lng: 116.4074, flag: "🇨🇳", region: "Asia" },
  { city: "Shanghai", country: "China", code: "CN", lat: 31.2304, lng: 121.4737, flag: "🇨🇳", region: "Asia" },
  { city: "Hong Kong", country: "Hong Kong", code: "HK", lat: 22.3193, lng: 114.1694, flag: "🇭🇰", region: "Asia" },
  { city: "Singapore", country: "Singapore", code: "SG", lat: 1.3521, lng: 103.8198, flag: "🇸🇬", region: "Asia" },
  { city: "Bangkok", country: "Thailand", code: "TH", lat: 13.7563, lng: 100.5018, flag: "🇹🇭", region: "Asia" },
  { city: "Dubai", country: "UAE", code: "AE", lat: 25.2048, lng: 55.2708, flag: "🇦🇪", region: "Asia" },
  { city: "Mumbai", country: "India", code: "IN", lat: 19.0760, lng: 72.8777, flag: "🇮🇳", region: "Asia" },
  { city: "Delhi", country: "India", code: "IN", lat: 28.7041, lng: 77.1025, flag: "🇮🇳", region: "Asia" },
  { city: "Taipei", country: "Taiwan", code: "TW", lat: 25.0330, lng: 121.5654, flag: "🇹🇼", region: "Asia" },
  { city: "Osaka", country: "Japan", code: "JP", lat: 34.6937, lng: 135.5023, flag: "🇯🇵", region: "Asia" },
  { city: "Kyoto", country: "Japan", code: "JP", lat: 35.0116, lng: 135.7681, flag: "🇯🇵", region: "Asia" },

  // Europe
  { city: "London", country: "UK", code: "GB", lat: 51.5074, lng: -0.1278, flag: "🇬🇧", region: "Europe" },
  { city: "Paris", country: "France", code: "FR", lat: 48.8566, lng: 2.3522, flag: "🇫🇷", region: "Europe" },
  { city: "Rome", country: "Italy", code: "IT", lat: 41.9028, lng: 12.4964, flag: "🇮🇹", region: "Europe" },
  { city: "Barcelona", country: "Spain", code: "ES", lat: 41.3851, lng: 2.1734, flag: "🇪🇸", region: "Europe" },
  { city: "Madrid", country: "Spain", code: "ES", lat: 40.4168, lng: -3.7038, flag: "🇪🇸", region: "Europe" },
  { city: "Amsterdam", country: "Netherlands", code: "NL", lat: 52.3676, lng: 4.9041, flag: "🇳🇱", region: "Europe" },
  { city: "Berlin", country: "Germany", code: "DE", lat: 52.5200, lng: 13.4050, flag: "🇩🇪", region: "Europe" },
  { city: "Munich", country: "Germany", code: "DE", lat: 48.1351, lng: 11.5820, flag: "🇩🇪", region: "Europe" },
  { city: "Vienna", country: "Austria", code: "AT", lat: 48.2082, lng: 16.3738, flag: "🇦🇹", region: "Europe" },
  { city: "Prague", country: "Czech Republic", code: "CZ", lat: 50.0755, lng: 14.4378, flag: "🇨🇿", region: "Europe" },
  { city: "Istanbul", country: "Turkey", code: "TR", lat: 41.0082, lng: 28.9784, flag: "🇹🇷", region: "Europe" },
  { city: "Athens", country: "Greece", code: "GR", lat: 37.9838, lng: 23.7275, flag: "🇬🇷", region: "Europe" },
  { city: "Lisbon", country: "Portugal", code: "PT", lat: 38.7223, lng: -9.1393, flag: "🇵🇹", region: "Europe" },
  { city: "Copenhagen", country: "Denmark", code: "DK", lat: 55.6761, lng: 12.5683, flag: "🇩🇰", region: "Europe" },
  { city: "Stockholm", country: "Sweden", code: "SE", lat: 59.3293, lng: 18.0686, flag: "🇸🇪", region: "Europe" },
  { city: "Venice", country: "Italy", code: "IT", lat: 45.4408, lng: 12.3155, flag: "🇮🇹", region: "Europe" },
  { city: "Florence", country: "Italy", code: "IT", lat: 43.7696, lng: 11.2558, flag: "🇮🇹", region: "Europe" },
  { city: "Milan", country: "Italy", code: "IT", lat: 45.4642, lng: 9.1900, flag: "🇮🇹", region: "Europe" },
  { city: "Zurich", country: "Switzerland", code: "CH", lat: 47.3769, lng: 8.5417, flag: "🇨🇭", region: "Europe" },

  // North America
  { city: "New York", country: "USA", code: "US", lat: 40.7128, lng: -74.0060, flag: "🇺🇸", region: "North America" },
  { city: "Los Angeles", country: "USA", code: "US", lat: 34.0522, lng: -118.2437, flag: "🇺🇸", region: "North America" },
  { city: "San Francisco", country: "USA", code: "US", lat: 37.7749, lng: -122.4194, flag: "🇺🇸", region: "North America" },
  { city: "Chicago", country: "USA", code: "US", lat: 41.8781, lng: -87.6298, flag: "🇺🇸", region: "North America" },
  { city: "Las Vegas", country: "USA", code: "US", lat: 36.1699, lng: -115.1398, flag: "🇺🇸", region: "North America" },
  { city: "Miami", country: "USA", code: "US", lat: 25.7617, lng: -80.1918, flag: "🇺🇸", region: "North America" },
  { city: "Boston", country: "USA", code: "US", lat: 42.3601, lng: -71.0589, flag: "🇺🇸", region: "North America" },
  { city: "Seattle", country: "USA", code: "US", lat: 47.6062, lng: -122.3321, flag: "🇺🇸", region: "North America" },
  { city: "Toronto", country: "Canada", code: "CA", lat: 43.6532, lng: -79.3832, flag: "🇨🇦", region: "North America" },
  { city: "Vancouver", country: "Canada", code: "CA", lat: 49.2827, lng: -123.1207, flag: "🇨🇦", region: "North America" },
  { city: "Mexico City", country: "Mexico", code: "MX", lat: 19.4326, lng: -99.1332, flag: "🇲🇽", region: "North America" },
  { city: "Cancun", country: "Mexico", code: "MX", lat: 21.1619, lng: -86.8515, flag: "🇲🇽", region: "North America" },

  // Oceania
  { city: "Sydney", country: "Australia", code: "AU", lat: -33.8688, lng: 151.2093, flag: "🇦🇺", region: "Oceania" },
  { city: "Melbourne", country: "Australia", code: "AU", lat: -37.8136, lng: 144.9631, flag: "🇦🇺", region: "Oceania" },
  { city: "Auckland", country: "New Zealand", code: "NZ", lat: -36.8485, lng: 174.7633, flag: "🇳🇿", region: "Oceania" },

  // South America
  { city: "Rio de Janeiro", country: "Brazil", code: "BR", lat: -22.9068, lng: -43.1729, flag: "🇧🇷", region: "South America" },
  { city: "Buenos Aires", country: "Argentina", code: "AR", lat: -34.6037, lng: -58.3816, flag: "🇦🇷", region: "South America" },
  { city: "Lima", country: "Peru", code: "PE", lat: -12.0464, lng: -77.0428, flag: "🇵🇪", region: "South America" },

  // Africa
  { city: "Cairo", country: "Egypt", code: "EG", lat: 30.0444, lng: 31.2357, flag: "🇪🇬", region: "Africa" },
  { city: "Cape Town", country: "South Africa", code: "ZA", lat: -33.9249, lng: 18.4241, flag: "🇿🇦", region: "Africa" },
  { city: "Marrakech", country: "Morocco", code: "MA", lat: 31.6295, lng: -7.9811, flag: "🇲🇦", region: "Africa" },
];

export default function AddDestinationFormSmart() {
  const router = useRouter();
  const locale = useLocale();
  const t = getTranslations(locale);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState<typeof CITIES_DATABASE[0] | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Filter cities based on search query
  const filteredCities = searchQuery.trim()
    ? CITIES_DATABASE.filter((city) => {
        const query = searchQuery.toLowerCase();
        return (
          city.city.toLowerCase().includes(query) ||
          city.country.toLowerCase().includes(query) ||
          city.region.toLowerCase().includes(query)
        );
      }).slice(0, 8) // Limit to 8 results
    : [];

  // Handle city selection from autocomplete
  const handleCitySelect = (city: typeof CITIES_DATABASE[0]) => {
    setSelectedCity(city);
    setFormData({
      ...formData,
      city: city.city,
      country: city.country,
      countryCode: city.code,
      latitude: city.lat,
      longitude: city.lng,
    });
    setSearchQuery(`${city.city}, ${city.country}`);
    setShowSuggestions(false);
  };

  // Handle manual search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    setSelectedCity(null);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that a city has been selected
    if (!selectedCity && !formData.city) {
      setError("Please select a destination from the suggestions");
      return;
    }

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
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Smart City Search */}
      <div className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 {t.destination}</h3>

        <div className="relative" ref={searchInputRef}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search for a city... (e.g., Tokyo, Paris, New York)"
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-gray-300 rounded-2xl text-lg font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            required
          />

          {/* Autocomplete Suggestions */}
          {showSuggestions && filteredCities.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto">
              {filteredCities.map((city, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className="w-full p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all flex items-center gap-4 border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-3xl">{city.flag}</div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-gray-900">{city.city}</div>
                    <div className="text-sm text-gray-600">{city.country} • {city.region}</div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    {city.lat.toFixed(2)}, {city.lng.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected City Indicator */}
          {selectedCity && (
            <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl flex items-center gap-3">
              <div className="text-3xl">{selectedCity.flag}</div>
              <div className="flex-1">
                <div className="font-bold text-gray-900">✓ {selectedCity.city}, {selectedCity.country}</div>
                <div className="text-xs text-gray-600">
                  {selectedCity.lat.toFixed(4)}°N, {selectedCity.lng.toFixed(4)}°E
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCity(null);
                  setSearchQuery("");
                  setFormData({
                    ...formData,
                    city: "",
                    country: "",
                    countryCode: "",
                    latitude: 0,
                    longitude: 0,
                  });
                }}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Popular Picks */}
        {!selectedCity && !searchQuery && (
          <div className="mt-6">
            <div className="text-sm font-bold text-gray-600 mb-3">✨ Popular Destinations</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {CITIES_DATABASE.slice(0, 12).map((city) => (
                <button
                  key={`${city.code}-${city.city}`}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-lg transition-all active:scale-95 flex flex-col items-center"
                >
                  <div className="text-2xl mb-1">{city.flag}</div>
                  <div className="text-xs font-bold text-gray-900 text-center leading-tight">
                    {city.city}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visit Details - Only show if city selected */}
      {selectedCity && (
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
      )}

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
          disabled={isSubmitting || !selectedCity}
          className="flex-2 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-purple-600 text-white min-w-[60%]"
        >
          {isSubmitting ? `💾 ${t.saving}` : `✓ ${t.addDestination}`}
        </button>
      </div>
    </form>
  );
}
