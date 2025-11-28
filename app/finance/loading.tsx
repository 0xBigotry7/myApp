// Server component for instant display with dark mode support
export default function FinanceLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Navbar skeleton */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-md animate-pulse" />
              <div className="hidden md:flex items-center gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 w-14 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
              <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-96 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-24 bg-white/30 rounded animate-pulse" />
              <span className="text-2xl opacity-50">💎</span>
            </div>
            <div className="h-10 w-36 bg-white/30 rounded-lg animate-pulse mb-1" />
            <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
          </div>

          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border-l-4 border-zinc-300 dark:border-zinc-600">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-6 w-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Spending Breakdown */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
              <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-6" />
              
              <div className="space-y-4 mb-6">
                {[1, 2].map((i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                    <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>

              <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>

              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                      <div>
                        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
                        <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Accounts */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>

              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
                        <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse ml-auto mb-1" />
                      <div className="h-3 w-12 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
              <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 w-full bg-white dark:bg-zinc-800 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
