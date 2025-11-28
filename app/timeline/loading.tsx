"use client";

import NavbarClient from "@/components/NavbarClient";

// Timeline page skeleton matching LifeTimeline layout
export default function TimelineLoading() {
  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      <NavbarClient user={{ name: "Loading..." }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-3">
            Timeline
          </h1>
          <p className="text-lg text-zinc-500">
            Your journey through life - all your memories in one place.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="h-10 w-24 bg-zinc-200 rounded-full animate-pulse" />
          <div className="h-10 w-28 bg-zinc-100 rounded-full animate-pulse" />
          <div className="h-10 w-32 bg-zinc-100 rounded-full animate-pulse" />
          <div className="flex-1" />
          <div className="h-10 w-36 bg-zinc-900/20 rounded-full animate-pulse" />
        </div>

        {/* Timeline items */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-zinc-200" />
          
          {/* Year header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-zinc-900/10 flex items-center justify-center animate-pulse">
              <span className="text-2xl font-bold text-zinc-400">2024</span>
            </div>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          {/* Timeline events */}
          <div className="space-y-6 ml-16">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                {/* Event header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 animate-pulse flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <div className="h-6 w-48 bg-zinc-200 rounded animate-pulse mb-2" />
                      {/* Description */}
                      <div className="h-4 w-full bg-zinc-100 rounded animate-pulse mb-1" />
                      <div className="h-4 w-3/4 bg-zinc-100 rounded animate-pulse" />
                      
                      {/* Meta info */}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse" />
                      </div>
                    </div>

                    {/* Date badge */}
                    <div className="h-6 w-20 bg-zinc-100 rounded-full animate-pulse flex-shrink-0" />
                  </div>
                </div>

                {/* Photo placeholder (for some items) */}
                {i % 2 === 0 && (
                  <div className="h-48 bg-zinc-100 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

