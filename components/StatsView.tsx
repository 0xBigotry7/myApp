"use client";

import { useMemo } from "react";
import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface StatsEvent {
  id: string;
  date: string | Date;
  title: string;
  type: string;
  content?: string;
  photos: string[];
  location?: string;
  mood?: string;
  user: { id: string; name: string; email?: string };
}

interface StatsViewProps {
  events: StatsEvent[];
}

const COLORS = {
  travel: "#3b82f6",
  milestone: "#8b5cf6",
  memory: "#ec4899",
  achievement: "#f59e0b",
  celebration: "#10b981",
  relationship: "#ef4444",
  work: "#6366f1",
  education: "#14b8a6",
  health: "#f97316",
  default: "#6b7280",
};

export default function StatsView({ events }: StatsViewProps) {
  // Events by type
  const eventsByType = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((event) => {
      const count = map.get(event.type) || 0;
      map.set(event.type, count + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  // Events by month (current year)
  const eventsByMonth = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 11, 31));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const count = events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= monthStart && eventDate <= monthEnd;
      }).length;

      return {
        month: format(month, "MMM"),
        events: count,
      };
    });
  }, [events]);

  // Events by mood
  const eventsByMood = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((event) => {
      if (event.mood) {
        const count = map.get(event.mood) || 0;
        map.set(event.mood, count + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  // Events by location (top 10)
  const eventsByLocation = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((event) => {
      if (event.location) {
        const count = map.get(event.location) || 0;
        map.set(event.location, count + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [events]);

  // Year-over-year trends
  const yearlyTrends = useMemo(() => {
    const yearMap = new Map<number, number>();
    events.forEach((event) => {
      const year = new Date(event.date).getFullYear();
      const count = yearMap.get(year) || 0;
      yearMap.set(year, count + 1);
    });
    return Array.from(yearMap.entries())
      .map(([year, count]) => ({ year: year.toString(), events: count }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [events]);

  // Key metrics
  const metrics = useMemo(() => {
    const totalEvents = events.length;
    const eventsWithPhotos = events.filter((e) => e.photos.length > 0).length;
    const totalPhotos = events.reduce((sum, e) => sum + e.photos.length, 0);
    const eventsWithLocations = events.filter((e) => e.location).length;
    const uniqueLocations = new Set(events.map((e) => e.location).filter(Boolean)).size;
    const eventsWithMood = events.filter((e) => e.mood).length;

    // Most active month
    const mostActiveMonth = eventsByMonth.reduce((prev, current) =>
      current.events > prev.events ? current : prev
    , { month: "", events: 0 });

    // Most common type
    const mostCommonType = eventsByType[0]?.name || "N/A";

    return {
      totalEvents,
      eventsWithPhotos,
      totalPhotos,
      eventsWithLocations,
      uniqueLocations,
      eventsWithMood,
      mostActiveMonth: mostActiveMonth.month || "N/A",
      mostCommonType,
    };
  }, [events, eventsByMonth, eventsByType]);

  const getTypeColor = (type: string): string => {
    return (COLORS as any)[type] || COLORS.default;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Stats & Insights
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Discover patterns and trends in your life timeline
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-sm border border-purple-200 p-4 sm:p-6">
          <div className="text-3xl sm:text-4xl font-bold text-purple-600">
            {metrics.totalEvents}
          </div>
          <div className="text-xs sm:text-sm text-gray-700 mt-2 font-medium">
            Total Events
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-sm border border-blue-200 p-4 sm:p-6">
          <div className="text-3xl sm:text-4xl font-bold text-blue-600">
            {metrics.totalPhotos}
          </div>
          <div className="text-xs sm:text-sm text-gray-700 mt-2 font-medium">
            Total Photos
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-4 sm:p-6">
          <div className="text-3xl sm:text-4xl font-bold text-green-600">
            {metrics.uniqueLocations}
          </div>
          <div className="text-xs sm:text-sm text-gray-700 mt-2 font-medium">
            Unique Locations
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-sm border border-orange-200 p-4 sm:p-6">
          <div className="text-2xl sm:text-3xl font-bold text-orange-600">
            {metrics.mostActiveMonth}
          </div>
          <div className="text-xs sm:text-sm text-gray-700 mt-2 font-medium">
            Most Active Month
          </div>
        </div>
      </div>

      {/* Events by Month (Line Chart) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Events This Year</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={eventsByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="events"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: "#8b5cf6", r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Events by Type (Pie Chart) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Events by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventsByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {eventsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getTypeColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {eventsByType.slice(0, 5).map((type) => (
              <div key={type.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getTypeColor(type.name) }}
                  ></div>
                  <span className="text-gray-700 capitalize">{type.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{type.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Year-over-Year Trends (Bar Chart) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Year-over-Year Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="events" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Events by Mood */}
      {eventsByMood.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Events by Mood</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {eventsByMood.map((mood) => (
              <div
                key={mood.name}
                className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-200 p-4 text-center"
              >
                <div className="text-2xl font-bold text-pink-600">{mood.value}</div>
                <div className="text-xs text-gray-700 mt-1 font-medium capitalize">
                  {mood.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Locations */}
      {eventsByLocation.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Locations</h3>
          <div className="space-y-3">
            {eventsByLocation.map((location, index) => {
              const maxValue = eventsByLocation[0].value;
              const percentage = (location.value / maxValue) * 100;

              return (
                <div key={location.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {location.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-purple-600">
                      {location.value} events
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-200 p-6">
          <div className="text-4xl mb-2">📸</div>
          <div className="text-2xl font-bold text-blue-600">
            {((metrics.eventsWithPhotos / metrics.totalEvents) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-700 mt-1">Events with Photos</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-6">
          <div className="text-4xl mb-2">📍</div>
          <div className="text-2xl font-bold text-green-600">
            {((metrics.eventsWithLocations / metrics.totalEvents) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-700 mt-1">Events with Location</div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-sm border border-pink-200 p-6">
          <div className="text-4xl mb-2">😊</div>
          <div className="text-2xl font-bold text-pink-600">
            {((metrics.eventsWithMood / metrics.totalEvents) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-700 mt-1">Events with Mood</div>
        </div>
      </div>
    </div>
  );
}
