"use client";

import NavbarClient from "@/components/NavbarClient";

// Packing page skeleton matching PackingDashboard layout
export default function PackingLoading() {
  return (
    <>
      <NavbarClient user={{ name: "Loading..." }} />
      <div className="min-h-screen bg-zinc-50 p-4 sm:p-6">
        {/* Header - matches PackingDashboard header */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-zinc-200 rounded-lg animate-pulse" />
              <div>
                <div className="h-8 w-40 bg-zinc-200 rounded-lg animate-pulse mb-2" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-32 bg-zinc-100 rounded animate-pulse" />
                  <div className="h-5 w-12 bg-emerald-100 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            <div className="h-10 w-32 bg-zinc-900 rounded-lg animate-pulse opacity-20" />
          </div>

          {/* Search bar - matches SearchItems component */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 bg-zinc-200 rounded animate-pulse" />
              <div className="h-12 w-full bg-white rounded-xl border border-zinc-200 animate-pulse" />
            </div>
          </div>

          {/* Luggage grid - matches LuggageCard layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Unorganized Items Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-zinc-200 rounded-lg animate-pulse" />
                    <div>
                      <div className="h-5 w-36 bg-zinc-200 rounded animate-pulse mb-1" />
                      <div className="h-3 w-48 bg-zinc-100 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-8 w-20 bg-zinc-100 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-center py-8">
                  <div className="h-10 w-10 bg-zinc-100 rounded-lg mx-auto mb-3 animate-pulse" />
                  <div className="h-4 w-32 bg-zinc-100 rounded mx-auto animate-pulse" />
                </div>
              </div>
            </div>

            {/* Luggage Cards */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                {/* Luggage Header */}
                <div className="p-4 border-b border-zinc-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-zinc-100 rounded-lg animate-pulse" />
                      <div>
                        <div className="h-5 w-28 bg-zinc-200 rounded animate-pulse mb-1" />
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse" />
                          <div className="h-3 w-8 bg-zinc-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-zinc-100 rounded animate-pulse" />
                      <div className="h-6 w-6 bg-zinc-100 rounded animate-pulse" />
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-3 w-10 bg-emerald-100 rounded animate-pulse" />
                  </div>
                </div>
                
                {/* Items list */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-6 w-14 bg-zinc-100 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg">
                        <div className="h-5 w-5 bg-zinc-200 rounded animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 w-full bg-zinc-100 rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-16 bg-zinc-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
