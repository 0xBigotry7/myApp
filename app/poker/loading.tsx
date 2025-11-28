"use client";

import NavbarClient from "@/components/NavbarClient";

// Poker page skeleton matching PokerLobby layout
export default function PokerLoading() {
  return (
    <>
      <NavbarClient user={{ name: "Loading..." }} />
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header - matches page header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                Texas Hold'em
              </h1>
              <p className="text-zinc-400 text-lg">High stakes, heads-up poker.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: New Game Form - matches the form structure */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-emerald-500">♦</span>
                  New Game
                </h2>
                <div className="space-y-5">
                  {/* Starting Chips */}
                  <div>
                    <div className="h-3 w-24 bg-zinc-700 rounded animate-pulse mb-2" />
                    <div className="h-12 w-full bg-zinc-950 rounded-xl border border-zinc-800 animate-pulse" />
                  </div>
                  
                  {/* Blinds */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="h-3 w-20 bg-zinc-700 rounded animate-pulse mb-2" />
                      <div className="h-12 w-full bg-zinc-950 rounded-xl border border-zinc-800 animate-pulse" />
                    </div>
                    <div>
                      <div className="h-3 w-16 bg-zinc-700 rounded animate-pulse mb-2" />
                      <div className="h-12 w-full bg-zinc-950 rounded-xl border border-zinc-800 animate-pulse" />
                    </div>
                  </div>

                  {/* Create button */}
                  <div className="h-14 w-full bg-emerald-600/30 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>

            {/* Right: Games List - matches Active Tables */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-amber-500">♠</span>
                    Active Tables
                  </h2>
                </div>
                
                {/* Game list items */}
                <div className="divide-y divide-zinc-800">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 animate-pulse" />
                          <div>
                            {/* Player name */}
                            <div className="h-5 w-32 bg-zinc-700 rounded animate-pulse mb-2" />
                            {/* Status and blinds */}
                            <div className="flex items-center gap-3">
                              <div className="h-5 w-20 bg-emerald-950/30 border border-emerald-900/50 rounded-full animate-pulse" />
                              <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Chip count */}
                        <div className="text-right">
                          <div className="h-8 w-24 bg-zinc-700 rounded animate-pulse mb-1" />
                          <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
