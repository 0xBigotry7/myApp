"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";
import { Map, List, Plus, Star, Clock, CheckCircle2, Globe, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import the GlobeCanvas with no SSR
const GlobeCanvas = dynamic(() => import("@/components/canvas/Globe"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-zinc-500 dark:text-zinc-400">
      Loading 3D Earth...
    </div>
  )
});

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

  const countries = Object.keys(destinationsByCountry).sort();
  const totalVisited = initialDestinations.filter((d) => !d.isFuture && d.visitDate).length;
  const totalFuture = initialDestinations.filter((d) => d.isFuture).length;
  const totalCountries = new Set(initialDestinations.map((d) => d.countryCode)).size;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
              Travel Map
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">Exploring the world, one destination at a time.</p>
          </div>
          <Link
            href="/map/add"
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg shadow-zinc-200 dark:shadow-zinc-900/20 active:scale-95 hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            {t.addDestination}
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t.countries}</span>
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">{totalCountries}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t.placesVisited}</span>
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">{totalVisited}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t.futureTrips}</span>
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">{totalFuture}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl text-yellow-600 dark:text-yellow-400">
                <Star className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t.ratedPlaces}</span>
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {initialDestinations.filter((d) => d.rating).length}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8 bg-white dark:bg-zinc-900 p-2 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm sticky top-20 z-30">
          {/* View Toggle */}
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${view === "map"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
            >
              <Map className="w-4 h-4" />
              {t.mapView}
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${view === "list"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
            >
              <List className="w-4 h-4" />
              {t.listView}
            </button>
          </div>

          {/* Filters */}
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filter === "all"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
            >
              {t.allDestinations}
            </button>
            <button
              onClick={() => setFilter("visited")}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filter === "visited"
                  ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
            >
              {t.visited}
            </button>
            <button
              onClick={() => setFilter("future")}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filter === "future"
                  ? "bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
            >
              {t.future}
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {view === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="relative h-[85vh] w-full rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden bg-black"
            >
              {/* 3D Globe Container */}
              <GlobeCanvas destinations={filteredDestinations} />

              {/* Legend / Info Overlay */}
              <div className="absolute bottom-6 left-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white text-sm max-w-xs pointer-events-none">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-white/90">
                    Drag to rotate. Zoom to explore. Red markers indicate visited locations.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[500px]"
            >
              <div className="p-6 sm:p-8">
                {countries.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Globe className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">{t.noDestinationsYet}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
                      {t.startAddingDestinations}
                    </p>
                    <Link
                      href="/map/add"
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
                    >
                      {t.addFirstDestination}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {countries.map((country) => (
                      <div key={country}>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
                          <span className="text-3xl shadow-sm rounded-lg overflow-hidden">{destinationsByCountry[country][0].countryCode === "US" ? "🇺🇸" : destinationsByCountry[country][0].countryCode === "JP" ? "🇯🇵" : destinationsByCountry[country][0].countryCode === "FR" ? "🇫🇷" : "🌍"}</span>
                          <span>{country}</span>
                          <span className="ml-auto text-sm font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-full">
                            {destinationsByCountry[country].length}
                          </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {destinationsByCountry[country].map((dest) => (
                            <div
                              key={dest.id}
                              className={`group relative p-6 rounded-[24px] border transition-all hover:shadow-lg cursor-pointer overflow-hidden ${dest.isFuture
                                  ? "bg-orange-50/30 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30 hover:border-orange-200 dark:hover:border-orange-800"
                                  : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                                }`}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h4 className="font-bold text-xl text-zinc-900 dark:text-white mb-1">{dest.city}</h4>
                                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                    {dest.visitDate
                                      ? new Date(dest.visitDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                      })
                                      : "Planned"}
                                  </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${dest.isFuture
                                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                  }`}>
                                  {dest.isFuture ? t.future : t.visited}
                                </div>
                              </div>

                              {dest.rating && (
                                <div className="flex items-center gap-1 mb-4">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < dest.rating!
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-zinc-200 dark:text-zinc-700 fill-zinc-200 dark:fill-zinc-700"
                                        }`}
                                    />
                                  ))}
                                </div>
                              )}

                              {dest.highlights.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {dest.highlights.slice(0, 3).map((highlight, i) => (
                                    <span
                                      key={i}
                                      className="text-xs bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2.5 py-1 rounded-lg font-medium text-zinc-600 dark:text-zinc-300 shadow-sm"
                                    >
                                      {highlight}
                                    </span>
                                  ))}
                                  {dest.highlights.length > 3 && (
                                    <span className="text-xs bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg font-medium text-zinc-400 dark:text-zinc-500">
                                      +{dest.highlights.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              {dest.notes && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">{dest.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
