// Server component for instant display with dark mode support
export default function PackingLoading() {
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

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
              <div>
                <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-32 bg-zinc-900 dark:bg-white rounded-lg animate-pulse opacity-20" />
          </div>

          {/* Search bar */}
          <div className="mb-6">
            <div className="h-12 w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />
          </div>

          {/* Luggage grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                      <div>
                        <div className="h-5 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
                        <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-6 w-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                
                {/* Items */}
                <div className="p-4">
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex items-center gap-3 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="h-5 w-5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
