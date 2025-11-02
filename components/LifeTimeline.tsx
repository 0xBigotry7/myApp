"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import TimelineItem from "./TimelineItem";
import TimelineStats from "./TimelineStats";
import AddLifeEventModal from "./AddLifeEventModal";

interface TimelineItemType {
  id: string;
  originalId: string;
  source: "trip_post" | "expense" | "transaction" | "health" | "life_event";
  type: string;
  date: string;
  title: string;
  content?: string | null;
  photos: string[];
  location?: string | null;
  metadata?: Record<string, any>;
  user: { id: string; name: string; email?: string };
  isEditable: boolean;
}

interface TimelineStats {
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
}

export default function LifeTimeline() {
  const [items, setItems] = useState<TimelineItemType[]>([]);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all"); // "all", "year", "month", "week"
  const [showPrivate, setShowPrivate] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch timeline data
  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sourceFilter) params.append("source", sourceFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (!showPrivate) params.append("showPrivate", "false");

      // Calculate date range
      if (dateRange !== "all") {
        const now = new Date();
        const dateFrom = new Date();
        if (dateRange === "year") {
          dateFrom.setFullYear(now.getFullYear(), 0, 1);
        } else if (dateRange === "month") {
          dateFrom.setDate(1);
        } else if (dateRange === "week") {
          dateFrom.setDate(now.getDate() - 7);
        }
        params.append("dateFrom", dateFrom.toISOString());
      }

      const response = await fetch(`/api/timeline?${params.toString()}`);
      const data = await response.json();
      setItems(data.items || []);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/timeline/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchTimeline();
    fetchStats();
  }, [sourceFilter, searchQuery, dateRange, showPrivate]);

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: Record<string, TimelineItemType[]> = {};
    items.forEach((item) => {
      const dateKey = format(new Date(item.date), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return groups;
  }, [items]);

  const handleEventCreated = () => {
    setShowAddModal(false);
    fetchTimeline();
    fetchStats();
  };

  const handleEventDeleted = () => {
    fetchTimeline();
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && <TimelineStats stats={stats} />}

      {/* Add Event Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
        >
          <span className="text-xl">✨</span>
          <span>Add Life Event</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search your memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-base"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Source Filters */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSourceFilter(null)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                sourceFilter === null
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🌟 All
            </button>
            <button
              onClick={() => setSourceFilter("travel")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                sourceFilter === "travel"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ✈️ Travel
            </button>
            <button
              onClick={() => setSourceFilter("finance")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                sourceFilter === "finance"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              💰 Finance
            </button>
            <button
              onClick={() => setSourceFilter("health")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                sourceFilter === "health"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🌸 Health
            </button>
            <button
              onClick={() => setSourceFilter("life")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                sourceFilter === "life"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ✨ Life Events
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="year">This Year</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy:</label>
            <select
              value={showPrivate ? "all" : "shared"}
              onChange={(e) => setShowPrivate(e.target.value === "all")}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="all">Show All</option>
              <option value="shared">Shared Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Items */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your memories...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl border-2 border-dashed border-purple-200">
          <div className="text-6xl mb-4">🌟</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No memories yet</h3>
          <p className="text-gray-600 mb-4">Start capturing your life moments!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Add Your First Memory
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([dateKey, dayItems]) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 sm:px-6 py-3 rounded-2xl shadow-lg mb-4">
                <h3 className="font-bold text-lg">
                  {format(new Date(dateKey), "EEEE, MMMM d, yyyy")}
                </h3>
              </div>

              {/* Items for this date */}
              <div className="space-y-4">
                {dayItems.map((item) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    onDeleted={handleEventDeleted}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Life Event Modal */}
      {showAddModal && (
        <AddLifeEventModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleEventCreated}
        />
      )}
    </div>
  );
}
