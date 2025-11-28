// Server component for instant display with dark mode support
export default function ExpensesLoading() {
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-2" />
              <div className="h-5 w-40 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="h-12 w-40 bg-zinc-900 dark:bg-white rounded-xl animate-pulse opacity-20" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
                <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-4" />
              <div className="h-64 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <div className="h-5 w-36 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-4" />
              <div className="h-64 flex items-end gap-4 px-4">
                {[60, 80, 45, 90, 65, 40, 75, 55].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div 
                      className="bg-zinc-100 dark:bg-zinc-800 rounded-t animate-pulse"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
