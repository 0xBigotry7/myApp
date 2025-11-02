"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";

interface GridEvent {
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

interface GridViewProps {
  events: GridEvent[];
  onEventClick?: (event: GridEvent) => void;
}

export default function GridView({ events, onEventClick }: GridViewProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "photos">("date");
  const [selectedEvent, setSelectedEvent] = useState<GridEvent | null>(null);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (selectedType !== "all") {
      filtered = filtered.filter((e) => e.type === selectedType);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return b.photos.length - a.photos.length;
      }
    });

    return sorted;
  }, [events, selectedType, sortBy]);

  // Get unique types
  const types = useMemo(() => {
    const typeSet = new Set(events.map((e) => e.type));
    return Array.from(typeSet).sort();
  }, [events]);

  // Get event type color
  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      travel: "from-blue-500 to-cyan-500",
      milestone: "from-purple-500 to-pink-500",
      memory: "from-pink-500 to-rose-500",
      achievement: "from-amber-500 to-orange-500",
      celebration: "from-green-500 to-emerald-500",
      relationship: "from-red-500 to-pink-500",
      work: "from-indigo-500 to-purple-500",
      education: "from-teal-500 to-cyan-500",
      health: "from-orange-500 to-red-500",
    };
    return colors[type] || "from-gray-500 to-gray-600";
  };

  const handleEventClick = (event: GridEvent) => {
    setSelectedEvent(event);
    if (onEventClick) {
      onEventClick(event);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Grid View</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredEvents.length} events
              {selectedType !== "all" && ` • ${selectedType}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "photos")}
              className="px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="photos">Sort by Photos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Masonry Grid */}
      {filteredEvents.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
          {filteredEvents.map((event) => {
            const hasPhotos = event.photos.length > 0;
            const isSelected = selectedEvent?.id === event.id;

            return (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className={`
                  break-inside-avoid mb-4 sm:mb-6 cursor-pointer group
                  bg-white rounded-2xl shadow-sm border-2 overflow-hidden
                  transition-all hover:shadow-lg hover:scale-[1.02]
                  ${isSelected ? "border-purple-500 shadow-lg scale-[1.02]" : "border-gray-200"}
                `}
              >
                {/* Photos */}
                {hasPhotos && (
                  <div className="relative">
                    {/* Primary photo */}
                    <img
                      src={event.photos[0]}
                      alt={event.title}
                      className="w-full h-auto object-cover"
                    />

                    {/* Photo count badge */}
                    {event.photos.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        📸 {event.photos.length}
                      </div>
                    )}

                    {/* Type badge */}
                    <div
                      className={`
                        absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white
                        bg-gradient-to-r ${getTypeColor(event.type)}
                      `}
                    >
                      {event.type}
                    </div>

                    {/* Gradient overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                )}

                {/* Content */}
                <div className={hasPhotos ? "p-4" : "p-6"}>
                  {/* Type badge (if no photos) */}
                  {!hasPhotos && (
                    <div className="mb-3">
                      <span
                        className={`
                          inline-block px-3 py-1 rounded-full text-xs font-semibold text-white
                          bg-gradient-to-r ${getTypeColor(event.type)}
                        `}
                      >
                        {event.type}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {event.title}
                  </h3>

                  {/* Date */}
                  <div className="text-sm text-gray-600 mb-2">
                    {format(new Date(event.date), "MMMM d, yyyy · h:mm a")}
                  </div>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <span>📍</span>
                      <span>{event.location}</span>
                    </div>
                  )}

                  {/* Mood */}
                  {event.mood && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <span>😊</span>
                      <span className="capitalize">{event.mood}</span>
                    </div>
                  )}

                  {/* Content Preview */}
                  {event.content && (
                    <p className="text-sm text-gray-700 line-clamp-3 mt-3">
                      {event.content}
                    </p>
                  )}

                  {/* Photo grid (if more than 1 photo) */}
                  {event.photos.length > 1 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {event.photos.slice(1, 4).map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt=""
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* User attribution */}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-semibold">
                      {event.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-600">{event.user.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🎴</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Events Found</h3>
          <p className="text-gray-600">
            {selectedType !== "all"
              ? `No ${selectedType} events to display`
              : "No events to display"}
          </p>
          {selectedType !== "all" && (
            <button
              onClick={() => setSelectedType("all")}
              className="mt-4 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-all"
            >
              Show All Events
            </button>
          )}
        </div>
      )}

      {/* Selected Event Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photos carousel */}
            {selectedEvent.photos.length > 0 && (
              <div className="relative">
                <img
                  src={selectedEvent.photos[0]}
                  alt={selectedEvent.title}
                  className="w-full h-auto max-h-96 object-cover rounded-t-2xl"
                />
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-black transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <span
                  className={`
                    inline-block px-3 py-1 rounded-full text-xs font-semibold text-white
                    bg-gradient-to-r ${getTypeColor(selectedEvent.type)}
                  `}
                >
                  {selectedEvent.type}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedEvent.title}
              </h2>

              <div className="text-sm text-gray-600 mb-4">
                {format(new Date(selectedEvent.date), "EEEE, MMMM d, yyyy · h:mm a")}
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-gray-700 mb-3">
                  <span>📍</span>
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.mood && (
                <div className="flex items-center gap-2 text-gray-700 mb-3">
                  <span>😊</span>
                  <span className="capitalize">{selectedEvent.mood}</span>
                </div>
              )}

              {selectedEvent.content && (
                <div className="prose prose-sm max-w-none mt-4">
                  <p className="text-gray-700">{selectedEvent.content}</p>
                </div>
              )}

              {/* All photos grid */}
              {selectedEvent.photos.length > 1 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    All Photos ({selectedEvent.photos.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedEvent.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt=""
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => window.open(photo, "_blank")}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-semibold">
                    {selectedEvent.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700">{selectedEvent.user.name}</span>
                </div>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
