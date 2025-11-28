"use client";

import NavbarClient from "@/components/NavbarClient";

// Health page skeleton matching HealthDashboardClient layout
export default function HealthLoading() {
  return (
    <>
      <NavbarClient user={{ name: "Loading..." }} />
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header - matches page header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 mb-2 tracking-tight">
                🌸 Period Tracker
              </h1>
              <p className="text-zinc-500 text-lg">Track your cycle and wellness</p>
            </div>
          </div>

          {/* Empty state or Dashboard skeleton */}
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-zinc-200">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🌸</span>
            </div>
            <div className="h-7 w-48 bg-zinc-200 rounded-lg mx-auto mb-3 animate-pulse" />
            <div className="h-5 w-72 bg-zinc-100 rounded mx-auto mb-8 animate-pulse" />
            <div className="h-12 w-40 bg-zinc-900/20 rounded-full mx-auto animate-pulse" />
          </div>

          {/* If there's data, show dashboard skeleton */}
          <div className="hidden">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-5">
                  <div className="h-8 w-8 bg-zinc-100 rounded-lg animate-pulse mb-3" />
                  <div className="h-7 w-16 bg-zinc-200 rounded animate-pulse mb-1" />
                  <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div className="h-6 w-32 bg-zinc-200 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-zinc-100 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-zinc-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-10 bg-zinc-50 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
