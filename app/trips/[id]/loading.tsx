// Simple loading skeleton for trip detail page
export default function TripDetailLoading() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Hero Header Skeleton */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-zinc-800 dark:bg-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
        
        {/* Top Navigation Skeleton */}
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between">
          <div className="h-10 w-24 bg-white/10 rounded-full animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-20 bg-white/10 rounded-full animate-pulse" />
            <div className="h-10 w-16 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Trip Info Skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <div className="h-6 w-28 bg-white/10 rounded-full animate-pulse" />
            </div>
            <div className="h-14 w-80 bg-white/20 rounded-xl animate-pulse mb-4" />
            <div className="flex flex-wrap items-center gap-6">
              <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
              <div className="h-5 w-36 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          {/* Tabs Skeleton */}
          <div className="border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
            <div className="flex gap-4">
              <div className="h-10 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
              <div className="h-10 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 rounded-[24px] border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse mb-4" />
                  <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mb-2" />
                  <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Timeline Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
