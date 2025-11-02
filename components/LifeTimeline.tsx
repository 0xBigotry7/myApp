"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { getUserBadge } from "@/lib/household";
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

interface LifeTimelineProps {
  currentUserId: string;
  householdUsers: Array<{ id: string; name: string; email: string }>;
}

export default function LifeTimeline({ currentUserId, householdUsers }: LifeTimelineProps) {
  const [items, setItems] = useState<TimelineItemType[]>([]);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [showPrivate, setShowPrivate] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sourceFilter) params.append("source", sourceFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (!showPrivate) params.append("showPrivate", "false");

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

  const filteredItems = useMemo(() => {
    if (selectedUser === "all") return items;
    return items.filter((item) => item.user.id === selectedUser);
  }, [items, selectedUser]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, Record<string, TimelineItemType[]>> = {};
    filteredItems.forEach((item) => {
      const date = new Date(item.date);
      const yearKey = format(date, "yyyy");
      const monthKey = format(date, "yyyy-MM");
      if (!groups[yearKey]) groups[yearKey] = {};
      if (!groups[yearKey][monthKey]) groups[yearKey][monthKey] = [];
      groups[yearKey][monthKey].push(item);
    });
    return groups;
  }, [filteredItems]);

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
      {stats && <TimelineStats stats={stats} />}

      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
        >
          <span className="text-xl">✨</span>
          <span>Add Life Event</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
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
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by:</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: null, label: "🌟 All" },
              { key: "travel", label: "✈️ Travel" },
              { key: "finance", label: "💰 Finance" },
              { key: "health", label: "🌸 Health" },
              { key: "life", label: "✨ Life Events" }
            ].map(({ key, label }) => (
              <button key={key || "all"} onClick={() => setSourceFilter(key)} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${sourceFilter === key ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {householdUsers.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Show memories from:</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedUser("all")} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedUser === "all" ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                👥 Everyone
              </button>
              {householdUsers.map((user) => {
                const badge = getUserBadge(user.id, householdUsers);
                return (
                  <button key={user.id} onClick={() => setSelectedUser(user.id)} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${selectedUser === user.id ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: badge.color }}>{badge.initial}</div>
                    {badge.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range:</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none">
              <option value="all">All Time</option>
              <option value="year">This Year</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy:</label>
            <select value={showPrivate ? "all" : "shared"} onChange={(e) => setShowPrivate(e.target.value === "all")} className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none">
              <option value="all">Show All</option>
              <option value="shared">Shared Only</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your memories...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl border-2 border-dashed border-purple-200">
          <div className="text-6xl mb-4">🌟</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No memories found</h3>
          <p className="text-gray-600 mb-4">{selectedUser !== "all" ? "Try selecting a different user or changing your filters" : "Start capturing your life moments!"}</p>
          <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
            Add Your First Memory
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA)).map(([year, months]) => (
            <div key={year}>
              <div className="sticky top-0 z-20 bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-4 rounded-2xl shadow-lg mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-bold">{year}</h2>
                  <span className="text-sm md:text-base font-medium bg-white/20 px-4 py-2 rounded-full">
                    {Object.values(months).flat().length} memories
                  </span>
                </div>
              </div>
              <div className="space-y-6">
                {Object.entries(months).sort(([monthA], [monthB]) => monthB.localeCompare(monthA)).map(([monthKey, monthItems]) => (
                  <div key={monthKey}>
                    <div className="sticky top-16 z-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 sm:px-6 py-3 rounded-xl shadow-md mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">{format(new Date(monthKey + "-01"), "MMMM yyyy")}</h3>
                        <span className="text-xs md:text-sm font-medium bg-white/20 px-3 py-1 rounded-full">{monthItems.length}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {monthItems.map((item) => (
                        <TimelineItem key={item.id} item={item} onDeleted={handleEventDeleted} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddLifeEventModal onClose={() => setShowAddModal(false)} onCreated={handleEventCreated} />}
    </div>
  );
}
