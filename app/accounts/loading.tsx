"use client";

import NavbarClient from "@/components/NavbarClient";

// Accounts page skeleton matching page layout
export default function AccountsLoading() {
  return (
    <>
      <NavbarClient user={{ name: "Loading..." }} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Accounts
            </h1>
            <p className="text-gray-600 mt-1">Manage your financial accounts</p>
          </div>

          {/* Total Balance Card */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white mb-8">
            <p className="text-sm opacity-90 mb-2">Total Balance</p>
            <div className="h-12 w-48 bg-white/20 rounded-lg animate-pulse mb-4" />
            <div className="h-4 w-36 bg-white/20 rounded animate-pulse" />
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                {/* Account Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                </div>

                {/* Account Name */}
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />

                {/* Balance */}
                <div className="mb-4">
                  <div className="h-9 w-28 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

