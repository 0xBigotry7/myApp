"use client";

import NavbarClient from "@/components/NavbarClient";

// Map page skeleton matching TravelMapClient layout
export default function MapLoading() {
  return (
    <>
      <NavbarClient user={{ name: "Loading..." }} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-8">
          {/* Header - matches TravelMapClient header */}
          <div className="mb-2 sm:mb-4 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-4">
              <div>
                <div className="h-8 sm:h-10 w-48 bg-zinc-200 rounded-lg animate-pulse mb-1" />
                <div className="h-4 w-64 bg-zinc-100 rounded animate-pulse" />
              </div>
              <div className="h-10 sm:h-12 w-40 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-2xl animate-pulse" />
            </div>

            {/* Stats Cards - matches the 4 stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-2 sm:mb-4 md:mb-6">
              <div className="bg-white rounded-xl p-3 md:p-6 border-2 border-gray-200 shadow-sm">
                <div className="text-2xl md:text-4xl mb-1 md:mb-2">🌍</div>
                <div className="h-8 w-12 bg-zinc-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse" />
              </div>
              <div className="bg-white rounded-xl p-3 md:p-6 border-2 border-gray-200 shadow-sm">
                <div className="text-2xl md:text-4xl mb-1 md:mb-2">📍</div>
                <div className="h-8 w-12 bg-zinc-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
              </div>
              <div className="bg-white rounded-xl p-3 md:p-6 border-2 border-gray-200 shadow-sm">
                <div className="text-2xl md:text-4xl mb-1 md:mb-2">✈️</div>
                <div className="h-8 w-12 bg-zinc-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse" />
              </div>
              <div className="bg-white rounded-xl p-3 md:p-6 border-2 border-gray-200 shadow-sm">
                <div className="text-2xl md:text-4xl mb-1 md:mb-2">⭐</div>
                <div className="h-8 w-12 bg-zinc-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-16 bg-zinc-100 rounded animate-pulse" />
              </div>
            </div>

            {/* View toggle and filter - matches the controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
              <div className="flex gap-2">
                <div className="h-10 w-20 bg-zinc-200 rounded-xl animate-pulse" />
                <div className="h-10 w-20 bg-zinc-100 rounded-xl animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-zinc-100 rounded-full animate-pulse" />
                <div className="h-8 w-20 bg-zinc-100 rounded-full animate-pulse" />
                <div className="h-8 w-16 bg-zinc-100 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Map area - matches WorldMap component */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
            <div className="h-[400px] sm:h-[500px] md:h-[600px] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-pulse flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/50 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <span className="text-4xl">🗺️</span>
                </div>
                <div className="h-5 w-32 bg-white/50 rounded mx-auto animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
