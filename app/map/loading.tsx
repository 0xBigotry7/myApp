// Server component for instant display with dark mode support
export default function MapLoading() {
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
          <div>
            <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-80 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-zinc-900 dark:bg-white rounded-2xl animate-pulse opacity-20" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                  <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
                <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8 bg-white dark:bg-zinc-900 p-2 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
            <div className="h-10 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-10 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-10 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Map area */}
        <div className="h-[70vh] rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden bg-zinc-900">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                <span className="text-4xl opacity-50">🌍</span>
              </div>
              <div className="h-5 w-32 bg-zinc-700 rounded mx-auto animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
