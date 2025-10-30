"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";
import WorldMap from "./WorldMap";

interface Destination {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  visitDate: Date | null;
  isFuture: boolean;
  notes: string | null;
  rating: number | null;
  highlights: string[];
  photos: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface TravelMapClientProps {
  initialDestinations: Destination[];
  currentUserId: string;
  users: User[];
}

export default function TravelMapClient({
  initialDestinations,
  currentUserId,
  users,
}: TravelMapClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = getTranslations(locale);
  // Default to map view to show beautiful animated world map
  const [view, setView] = useState<"map" | "list">("map");
  const [filter, setFilter] = useState<"all" | "visited" | "future">("all");

  const filteredDestinations = initialDestinations.filter((dest) => {
    if (filter === "visited") return !dest.isFuture && dest.visitDate;
    if (filter === "future") return dest.isFuture;
    return true;
  });

  // Group destinations by country
  const destinationsByCountry = filteredDestinations.reduce((acc, dest) => {
    if (!acc[dest.country]) {
      acc[dest.country] = [];
    }
    acc[dest.country].push(dest);
    return acc;
  }, {} as Record<string, Destination[]>);

  const countries = Object.keys(destinationsByCountry);
  const totalVisited = initialDestinations.filter((d) => !d.isFuture && d.visitDate).length;
  const totalFuture = initialDestinations.filter((d) => d.isFuture).length;
  const totalCountries = new Set(initialDestinations.map((d) => d.countryCode)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">🗺️ {t.ourTravelMap}</h1>
              <p className="text-gray-600">Exploring the world, one destination at a time</p>
            </div>
            <Link
              href="/map/add"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="text-xl">✈️</span>
              <span>{t.addDestination}</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <div className="text-4xl mb-2">🌍</div>
              <div className="text-3xl font-black text-gray-900">{totalCountries}</div>
              <div className="text-sm text-gray-600 font-semibold">{t.countries}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <div className="text-4xl mb-2">📍</div>
              <div className="text-3xl font-black text-gray-900">{totalVisited}</div>
              <div className="text-sm text-gray-600 font-semibold">{t.placesVisited}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <div className="text-4xl mb-2">✈️</div>
              <div className="text-3xl font-black text-gray-900">{totalFuture}</div>
              <div className="text-sm text-gray-600 font-semibold">{t.futureTrips}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-3xl font-black text-gray-900">
                {initialDestinations.filter((d) => d.rating).length}
              </div>
              <div className="text-sm text-gray-600 font-semibold">{t.ratedPlaces}</div>
            </div>
          </div>

          {/* View Toggle and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setView("map")}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  view === "map"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border-2 border-gray-200"
                }`}
              >
                🗺️ {t.mapView}
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  view === "list"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border-2 border-gray-200"
                }`}
              >
                📋 {t.listView}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  filter === "all"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border-2 border-gray-200"
                }`}
              >
                {t.allDestinations}
              </button>
              <button
                onClick={() => setFilter("visited")}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  filter === "visited"
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border-2 border-gray-200"
                }`}
              >
                ✓ {t.visited}
              </button>
              <button
                onClick={() => setFilter("future")}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  filter === "future"
                    ? "bg-orange-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border-2 border-gray-200"
                }`}
              >
                ⏰ {t.future}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {view === "map" ? (
          <WorldMap destinations={filteredDestinations} />
        ) : (
          <div className="space-y-4">
            {countries.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-gray-200">
                <div className="text-7xl mb-4">✈️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.noDestinationsYet}</h3>
                <p className="text-gray-600 mb-6">
                  {t.startAddingDestinations}
                </p>
                <Link
                  href="/map/add"
                  className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl transition-all"
                >
                  {t.addFirstDestination}
                </Link>
              </div>
            ) : (
              countries.map((country) => (
                <div key={country} className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <span className="text-3xl">{destinationsByCountry[country][0].countryCode === "US" ? "🇺🇸" : destinationsByCountry[country][0].countryCode === "JP" ? "🇯🇵" : destinationsByCountry[country][0].countryCode === "FR" ? "🇫🇷" : "🌍"}</span>
                    <span>{country}</span>
                    <span className="ml-auto text-sm font-semibold text-gray-500">
                      {destinationsByCountry[country].length} {destinationsByCountry[country].length === 1 ? "place" : "places"}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {destinationsByCountry[country].map((dest) => (
                      <div
                        key={dest.id}
                        className={`p-5 rounded-2xl border-2 transition-all hover:shadow-lg cursor-pointer ${
                          dest.isFuture
                            ? "bg-orange-50 border-orange-200 hover:border-orange-400"
                            : "bg-green-50 border-green-200 hover:border-green-400"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">{dest.city}</h4>
                            <p className="text-xs text-gray-600">
                              {dest.visitDate
                                ? new Date(dest.visitDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Planned"}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            dest.isFuture
                              ? "bg-orange-200 text-orange-800"
                              : "bg-green-200 text-green-800"
                          }`}>
                            {dest.isFuture ? t.future : t.visited}
                          </div>
                        </div>

                        {dest.rating && (
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-lg">
                                {i < dest.rating! ? "⭐" : "☆"}
                              </span>
                            ))}
                          </div>
                        )}

                        {dest.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {dest.highlights.slice(0, 3).map((highlight, i) => (
                              <span
                                key={i}
                                className="text-xs bg-white/70 px-2 py-1 rounded-lg font-medium text-gray-700"
                              >
                                {highlight}
                              </span>
                            ))}
                            {dest.highlights.length > 3 && (
                              <span className="text-xs bg-white/70 px-2 py-1 rounded-lg font-medium text-gray-500">
                                +{dest.highlights.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {dest.notes && (
                          <p className="text-sm text-gray-700 line-clamp-2">{dest.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
