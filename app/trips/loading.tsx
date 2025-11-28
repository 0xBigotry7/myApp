"use client";

import { useEffect, useState } from "react";
import { initDB, getAll, STORES } from "@/lib/offline-db";
import NavbarClient from "@/components/NavbarClient";
import TripCard from "@/components/TripCard";
import Link from "next/link";

// This loading component shows cached trips data immediately
export default function TripsLoading() {
  const [cachedTrips, setCachedTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCachedData = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        await initDB();
        const trips = await getAll(STORES.TRIPS);
        if (trips.length > 0) {
          setCachedTrips(trips);
        }
      } catch (error) {
        console.error('Failed to load cached trips:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedData();
  }, []);

  // If we have cached trips, show them immediately
  if (cachedTrips.length > 0) {
    return (
      <>
        <NavbarClient user={{ name: "Loading..." }} />
        <main className="min-h-screen bg-zinc-50 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-12">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">
                    My Trips
                  </h1>
                  <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Updating...
                  </span>
                </div>
                <p className="text-zinc-500 text-lg max-w-2xl">
                  Manage your adventures, track expenses, and plan your next journey.
                </p>
              </div>
              <Link
                href="/trips/new"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:shadow-lg active:scale-95"
              >
                <span className="text-xl leading-none mb-0.5">+</span>
                Plan Trip
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cachedTrips.map((trip: any) => (
                <TripCard 
                  key={trip.id} 
                  trip={{
                    ...trip,
                    totalSpent: trip.totalSpent || 0,
                    remaining: trip.totalBudget - (trip.totalSpent || 0),
                    percentUsed: ((trip.totalSpent || 0) / trip.totalBudget) * 100,
                  }} 
                />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  // Fallback skeleton
  return (
    <div className="min-h-screen bg-zinc-50 bg-dot-pattern">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="h-6 w-24 bg-zinc-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="h-10 w-48 bg-zinc-200 rounded-lg animate-pulse mb-3" />
            <div className="h-5 w-72 bg-zinc-100 rounded animate-pulse" />
          </div>
          <div className="h-12 w-36 bg-zinc-900/20 rounded-full animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm">
              <div className="h-48 bg-zinc-100 animate-pulse" />
              <div className="p-6">
                <div className="h-6 w-3/4 bg-zinc-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-zinc-100 rounded animate-pulse mb-4" />
                <div className="h-2 w-full bg-zinc-100 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
