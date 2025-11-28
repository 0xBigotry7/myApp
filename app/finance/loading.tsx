"use client";

import NavbarClient from "@/components/NavbarClient";

// Finance page skeleton matching page layout
export default function FinanceLoading() {
  return (
    <>
      <NavbarClient user={{ name: "Loading..." }} />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              💰 Finance Dashboard
            </h1>
            <p className="text-gray-600">
              Shared household financial overview and budget tracking
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Total Balance */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-emerald-100 text-sm font-medium">Total Balance</span>
                <span className="text-2xl">💵</span>
              </div>
              <div className="h-10 w-36 bg-white/20 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-28 bg-white/20 rounded animate-pulse" />
            </div>

            {/* This Month Income */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm font-medium">Income</span>
                <span className="text-2xl">📈</span>
              </div>
              <div className="h-8 w-28 bg-emerald-100 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            </div>

            {/* This Month Expenses */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm font-medium">Expenses</span>
                <span className="text-2xl">📉</span>
              </div>
              <div className="h-8 w-28 bg-rose-100 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            </div>

            {/* Trip Expenses */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm font-medium">Trip Expenses</span>
                <span className="text-2xl">✈️</span>
              </div>
              <div className="h-8 w-24 bg-purple-100 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Accounts & Categories */}
            <div className="lg:col-span-2 space-y-8">
              {/* Accounts */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Accounts</h2>
                  <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                        <div className="flex-1">
                          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-7 w-28 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Categories */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Top Categories</h2>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-2 w-full bg-gray-100 rounded-full animate-pulse" />
                      </div>
                      <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Recent Transactions */}
            <div className="space-y-8">
              {/* Quick Add */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Add</h2>
                <div className="space-y-4">
                  <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-12 w-full bg-emerald-100 rounded-xl animate-pulse" />
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1" />
                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                      </div>
                      <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
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

