"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { initDB, getById, getAll, STORES } from "@/lib/offline-db";
import NavbarClient from "@/components/NavbarClient";
import Link from "next/link";

// This loading component shows cached trip data immediately
export default function TripDetailLoading() {
  const params = useParams();
  const tripId = params?.id as string;
  const [cachedTrip, setCachedTrip] = useState<any>(null);
  const [cachedTransactions, setCachedTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCachedData = async () => {
      if (typeof window === 'undefined' || !tripId) return;
      
      try {
        await initDB();
        const [trip, allTransactions] = await Promise.all([
          getById(STORES.TRIPS, tripId),
          getAll(STORES.TRANSACTIONS),
        ]);
        
        if (trip) {
          setCachedTrip(trip);
          // Filter transactions for this trip
          const tripTransactions = allTransactions.filter(
            (t: any) => t.tripId === tripId
          );
          setCachedTransactions(tripTransactions);
        }
      } catch (error) {
        console.error('Failed to load cached trip:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedData();
  }, [tripId]);

  // If we have cached trip, show it immediately
  if (cachedTrip) {
    const totalSpent = cachedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const remaining = (cachedTrip.totalBudget || 0) - totalSpent;
    const percentUsed = cachedTrip.totalBudget ? (totalSpent / cachedTrip.totalBudget) * 100 : 0;

    return (
      <>
        <NavbarClient user={{ name: "Loading..." }} />
        <main className="min-h-screen bg-zinc-50 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Link href="/" className="text-zinc-500 hover:text-zinc-900 text-sm flex items-center gap-1">
                  ← Back to Trips
                </Link>
                <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Updating...
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">
                {cachedTrip.name || cachedTrip.destination}
              </h1>
              <p className="text-zinc-500 text-lg">{cachedTrip.destination}</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="text-sm text-zinc-500 mb-1">Total Budget</div>
                <div className="text-2xl font-bold text-zinc-900">
                  ${(cachedTrip.totalBudget || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="text-sm text-zinc-500 mb-1">Spent</div>
                <div className="text-2xl font-bold text-rose-600">
                  ${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="text-sm text-zinc-500 mb-1">Remaining</div>
                <div className={`text-2xl font-bold ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="text-sm text-zinc-500 mb-1">Budget Used</div>
                <div className="text-2xl font-bold text-zinc-900">
                  {percentUsed.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Tabs skeleton - actual content loading */}
            <div className="flex gap-2 mb-6">
              {['Overview', 'Expenses', 'Activities', 'Posts'].map((tab) => (
                <div key={tab} className="px-4 py-2 bg-zinc-100 rounded-lg text-sm text-zinc-500">
                  {tab}
                </div>
              ))}
            </div>

            {/* Recent Transactions from cache */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Recent Expenses</h3>
              {cachedTransactions.length > 0 ? (
                <div className="space-y-3">
                  {cachedTransactions.slice(0, 5).map((tx: any) => (
                    <div key={tx.id} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50">
                      <div className="h-10 w-10 bg-zinc-200 rounded-lg flex items-center justify-center text-lg">
                        {tx.category === 'Food & Dining' ? '🍽️' : 
                         tx.category === 'Transportation' ? '🚗' :
                         tx.category === 'Accommodation' ? '🛏️' :
                         tx.category === 'Activities' ? '🎫' : '📦'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-zinc-900">{tx.merchantName || tx.description || tx.category}</div>
                        <div className="text-sm text-zinc-500">{tx.category}</div>
                      </div>
                      <div className="font-bold text-zinc-900">
                        ${Math.abs(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-8">No expenses yet</p>
              )}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-5 w-20 bg-zinc-100 rounded animate-pulse mb-4" />
          <div className="h-10 w-64 bg-zinc-200 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-48 bg-zinc-100 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse mb-2" />
              <div className="h-7 w-24 bg-zinc-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-zinc-100 rounded-lg animate-pulse" />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50">
                <div className="h-12 w-12 bg-zinc-200 rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-40 bg-zinc-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-64 bg-zinc-100 rounded animate-pulse" />
                </div>
                <div className="h-6 w-20 bg-zinc-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
