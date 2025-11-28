// Server component for instant display with dark mode support
export default function HealthLoading() {
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🌸</span>
              <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
            </div>
            <div className="h-5 w-64 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "📅", color: "pink" },
            { icon: "🔄", color: "purple" },
            { icon: "💧", color: "blue" },
            { icon: "✨", color: "amber" },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{item.icon}</span>
              </div>
              <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
              <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar - takes 2 columns */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
            
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div key={i} className="h-8 flex items-center justify-center text-xs font-medium text-zinc-400 dark:text-zinc-500">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Today's Log */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="h-6 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
                      <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-10 w-full bg-pink-100 dark:bg-pink-900/30 rounded-xl animate-pulse" />
            </div>

            {/* Insights */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                    <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
                    <div className="h-3 w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
