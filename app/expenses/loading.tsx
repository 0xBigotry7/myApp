"use client";

import NavbarClient from "@/components/NavbarClient";
import { format } from "date-fns";
import { Calendar, TrendingUp, Plane, Wallet, Search, Filter, Plus } from "lucide-react";

// Expenses page skeleton matching ExpensesClient layout
export default function ExpensesLoading() {
  const now = new Date();

  return (
    <>
      <NavbarClient user={{ name: "Loading..." }} />
      <div className="min-h-screen bg-zinc-50 bg-dot-pattern">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header - matches ExpensesClient header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Expenses</h1>
                <p className="text-zinc-500 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(now, "MMMM yyyy")}
                </p>
              </div>
              <button
                disabled
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-zinc-300 text-zinc-500 rounded-xl font-medium cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                <span>Add Transaction</span>
              </button>
            </div>

            {/* Stats Grid - matches the 4 stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Spent */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-zinc-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-zinc-900" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">This Month</span>
                </div>
                <div className="h-8 w-28 bg-zinc-200 rounded animate-pulse mb-1" />
                <div className="text-xs text-zinc-500">Total Spent (USD Est.)</div>
              </div>

              {/* Daily Average */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Daily Avg</span>
                </div>
                <div className="h-8 w-24 bg-zinc-200 rounded animate-pulse mb-1" />
                <div className="text-xs text-zinc-500">Per Day</div>
              </div>

              {/* Trip Expenses */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Plane className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Trip</span>
                </div>
                <div className="h-8 w-24 bg-zinc-200 rounded animate-pulse mb-1" />
                <div className="text-xs text-zinc-500">Travel Expenses</div>
              </div>

              {/* Total Balance */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Balance</span>
                </div>
                <div className="h-8 w-32 bg-zinc-200 rounded animate-pulse mb-1" />
                <div className="text-xs text-zinc-500">Net Worth (USD Est.)</div>
              </div>
            </div>

            {/* Category Breakdown and Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-5 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-5 w-40 bg-zinc-200 rounded animate-pulse" />
                </div>
                <div className="h-64 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-zinc-100 animate-pulse" />
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-5 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-5 w-36 bg-zinc-200 rounded animate-pulse" />
                </div>
                <div className="h-64 flex items-end gap-4 px-4">
                  {[60, 80, 45, 90, 65, 40, 75, 55].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end">
                      <div 
                        className="bg-zinc-100 rounded-t animate-pulse"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filter Tabs */}
              <div className="flex gap-2">
                {["All", "Trip", "General"].map((tab, i) => (
                  <div 
                    key={tab}
                    className={`h-10 w-20 rounded-lg animate-pulse ${i === 0 ? 'bg-zinc-200' : 'bg-zinc-100'}`}
                  />
                ))}
              </div>

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <div className="h-10 w-full bg-white rounded-lg border border-zinc-200 animate-pulse" />
              </div>

              {/* Filter Button */}
              <div className="h-10 w-24 bg-zinc-100 rounded-lg animate-pulse flex items-center justify-center gap-2">
                <Filter className="w-4 h-4 text-zinc-400" />
              </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-6">
              {/* Date Group */}
              {[1, 2, 3].map((group) => (
                <div key={group}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-5 w-32 bg-zinc-200 rounded animate-pulse" />
                    <div className="flex-1 h-px bg-zinc-100" />
                    <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse" />
                  </div>

                  {/* Transactions */}
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          {/* Category Icon */}
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 animate-pulse" />
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="h-5 w-32 bg-zinc-200 rounded animate-pulse mb-1" />
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />
                              <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse" />
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right">
                            <div className="h-5 w-20 bg-zinc-200 rounded animate-pulse mb-1" />
                            <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
