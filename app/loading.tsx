// Ultra-lightweight loading component - server component for instant display

export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Navbar skeleton - matches real navbar exactly */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-700 rounded-md animate-pulse" />
              <div className="hidden md:flex items-center gap-4">
                <div className="h-4 w-14 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-14 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-14 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-14 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-14 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-14 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
              <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
              <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </nav>

      {/* Content skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
          <div className="space-y-3">
            <div className="h-10 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-5 w-80 max-w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
          </div>
          <div className="h-12 w-32 bg-zinc-900/10 dark:bg-zinc-100/10 rounded-full animate-pulse" />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="relative bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-lg"
            >
              {/* Image placeholder */}
              <div className="h-72 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              {/* Content placeholder inside card */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="h-8 w-3/4 bg-zinc-200/50 dark:bg-zinc-700/50 rounded-lg animate-pulse mb-3" />
                <div className="flex gap-3">
                  <div className="h-6 w-24 bg-zinc-200/30 dark:bg-zinc-700/30 rounded-full animate-pulse" />
                  <div className="h-6 w-16 bg-zinc-200/30 dark:bg-zinc-700/30 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
