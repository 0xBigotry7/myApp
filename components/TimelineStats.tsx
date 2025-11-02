"use client";

interface TimelineStatsProps {
  stats: {
    totalMemories: number;
    breakdown: {
      travel: number;
      finance: number;
      health: number;
      lifeEvents: number;
    };
    countriesVisited: number;
    photosUploaded: number;
    totalSpent: number;
  };
}

export default function TimelineStats({ stats }: TimelineStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-5 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs md:text-sm font-medium text-purple-900">Total Memories</p>
          <span className="text-2xl">🌟</span>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-purple-600">
          {stats.totalMemories.toLocaleString()}
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs md:text-sm font-medium text-blue-900">Countries</p>
          <span className="text-2xl">🗺️</span>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-blue-600">
          {stats.countriesVisited}
        </p>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 p-5 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs md:text-sm font-medium text-pink-900">Photos</p>
          <span className="text-2xl">📸</span>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-pink-600">
          {stats.photosUploaded.toLocaleString()}
        </p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-5 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs md:text-sm font-medium text-green-900">Total Spent</p>
          <span className="text-2xl">💰</span>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-green-600">
          ${(stats.totalSpent || 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
