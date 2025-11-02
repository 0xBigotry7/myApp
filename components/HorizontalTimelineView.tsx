"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { format, differenceInDays, startOfYear, endOfYear, addYears } from "date-fns";

interface TimelineEvent {
  id: string;
  date: string | Date;
  title: string;
  type: string;
  content?: string;
  photos: string[];
  location?: string;
  mood?: string;
  user: { id: string; name: string };
}

interface HorizontalTimelineViewProps {
  events: TimelineEvent[];
  onEventClick: (event: TimelineEvent) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  travel: "#10b981",
  work: "#3b82f6",
  family: "#f59e0b",
  social: "#ec4899",
  health: "#8b5cf6",
  education: "#06b6d4",
  achievement: "#f97316",
  milestone: "#ef4444",
  memory: "#6366f1",
  default: "#9333ea",
};

export default function HorizontalTimelineView({ events, onEventClick }: HorizontalTimelineViewProps) {
  const [zoom, setZoom] = useState(1); // 1 = year view, 2 = month view, 3 = week view
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate timeline bounds
  const { minDate, maxDate, timelineEvents } = useMemo(() => {
    if (events.length === 0) {
      const now = new Date();
      return {
        minDate: startOfYear(addYears(now, -1)),
        maxDate: endOfYear(now),
        timelineEvents: [],
      };
    }

    const dates = events.map((e) => new Date(e.date));
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add padding
    const minDate = startOfYear(addYears(min, -1));
    const maxDate = endOfYear(addYears(max, 1));

    // Map events to positions
    const totalDays = differenceInDays(maxDate, minDate);
    const timelineEvents = events.map((event) => {
      const eventDate = new Date(event.date);
      const daysFromStart = differenceInDays(eventDate, minDate);
      const position = (daysFromStart / totalDays) * 100;

      return {
        ...event,
        position,
        date: eventDate,
      };
    });

    return { minDate, maxDate, timelineEvents };
  }, [events]);

  // Generate year markers
  const yearMarkers = useMemo(() => {
    const markers = [];
    const startYear = minDate.getFullYear();
    const endYear = maxDate.getFullYear();
    const totalDays = differenceInDays(maxDate, minDate);

    for (let year = startYear; year <= endYear; year++) {
      const yearStart = new Date(year, 0, 1);
      const daysFromStart = differenceInDays(yearStart, minDate);
      const position = (daysFromStart / totalDays) * 100;

      markers.push({ year, position });
    }

    return markers;
  }, [minDate, maxDate]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      e.preventDefault();
      const delta = -e.deltaY / 100;
      setZoom((prev) => Math.max(0.5, Math.min(5, prev + delta)));
    } else {
      // Scroll
      const container = containerRef.current;
      if (container) {
        container.scrollLeft += e.deltaY;
      }
    }
  };

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    onEventClick(event);
  };

  const getEventColor = (type: string): string => {
    return CATEGORY_COLORS[type] || CATEGORY_COLORS.default;
  };

  const zoomIn = () => setZoom((prev) => Math.min(5, prev + 0.5));
  const zoomOut = () => setZoom((prev) => Math.max(0.5, prev - 0.5));
  const resetZoom = () => setZoom(1);

  const scrollToToday = () => {
    const container = containerRef.current;
    if (!container) return;

    const today = new Date();
    const totalDays = differenceInDays(maxDate, minDate);
    const daysFromStart = differenceInDays(today, minDate);
    const position = (daysFromStart / totalDays) * 100;

    const scrollTarget = (position / 100) * container.scrollWidth - container.clientWidth / 2;
    container.scrollTo({ left: scrollTarget, behavior: "smooth" });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-6 overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Interactive Timeline</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">
            Scroll horizontally • Ctrl+Scroll to zoom • Click events for details
          </p>
          <p className="text-xs text-gray-600 mt-1 sm:hidden">
            Swipe to scroll • Pinch to zoom
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={zoomOut}
              className="px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-white rounded-md transition-colors text-sm font-medium"
              title="Zoom Out"
            >
              −
            </button>
            <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700">
              {zoom.toFixed(1)}x
            </span>
            <button
              onClick={zoomIn}
              className="px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-white rounded-md transition-colors text-sm font-medium"
              title="Zoom In"
            >
              +
            </button>
          </div>

          <button
            onClick={resetZoom}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition-colors hidden sm:block"
          >
            Reset
          </button>

          <button
            onClick={scrollToToday}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
          >
            📍 Today
          </button>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-hidden"
        style={{ height: window.innerWidth < 640 ? "300px" : "400px" }}
        onWheel={handleWheel}
      >
        <div
          ref={timelineRef}
          className="relative h-full"
          style={{
            width: `${100 * zoom}%`,
            minWidth: "100%",
          }}
        >
          {/* Main Timeline Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-200 via-indigo-300 to-purple-200 rounded-full transform -translate-y-1/2" />

          {/* Year Markers */}
          {yearMarkers.map(({ year, position }) => (
            <div
              key={year}
              className="absolute top-1/2 transform -translate-x-1/2"
              style={{ left: `${position}%` }}
            >
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-gray-300 transform -translate-x-1/2 -translate-y-full" />

                {/* Year label */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mt-10 whitespace-nowrap">
                  <span className="text-lg font-bold text-gray-700">{year}</span>
                </div>

                {/* Bottom marker */}
                <div className="absolute bottom-0 left-1/2 w-0.5 h-8 bg-gray-300 transform -translate-x-1/2 translate-y-full" />
              </div>
            </div>
          ))}

          {/* Event Markers */}
          {timelineEvents.map((event: any) => {
            const isHovered = hoveredEvent === event.id;
            const isSelected = selectedEvent?.id === event.id;
            const color = getEventColor(event.type);

            return (
              <div
                key={event.id}
                className="absolute top-1/2 transform -translate-x-1/2 cursor-pointer transition-all duration-300"
                style={{
                  left: `${event.position}%`,
                  zIndex: isHovered || isSelected ? 50 : 10,
                }}
                onMouseEnter={() => setHoveredEvent(event.id)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => handleEventClick(event)}
              >
                {/* Event Dot */}
                <div
                  className={`
                    rounded-full transition-all duration-300 shadow-lg
                    ${isHovered || isSelected ? "scale-150" : "scale-100"}
                  `}
                  style={{
                    width: isHovered || isSelected ? "24px" : "16px",
                    height: isHovered || isSelected ? "24px" : "16px",
                    backgroundColor: color,
                    transform: "translateY(-50%)",
                    boxShadow: isHovered || isSelected
                      ? `0 0 20px ${color}80`
                      : `0 2px 4px rgba(0,0,0,0.2)`,
                  }}
                >
                  {/* Pulse animation for selected */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ backgroundColor: color, opacity: 0.4 }}
                    />
                  )}
                </div>

                {/* Hover Tooltip */}
                {isHovered && (
                  <div
                    className="absolute bottom-full mb-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl whitespace-nowrap z-50 animate-fade-in"
                    style={{ minWidth: "200px" }}
                  >
                    <div className="font-bold text-sm mb-1">{event.title}</div>
                    <div className="text-xs text-gray-300">
                      {format(event.date, "MMM d, yyyy")}
                    </div>
                    {event.location && (
                      <div className="text-xs text-gray-400 mt-1">
                        📍 {event.location}
                      </div>
                    )}
                    {/* Arrow */}
                    <div
                      className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                      style={{
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: "6px solid #111827",
                      }}
                    />
                  </div>
                )}

                {/* Event Label (shown at higher zoom) */}
                {zoom > 2 && (
                  <div
                    className="absolute top-full mt-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 whitespace-nowrap"
                  >
                    {event.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center">
          {Object.entries(CATEGORY_COLORS)
            .filter(([key]) => key !== "default")
            .map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-600 capitalize">{category}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {events.length} events • {yearMarkers.length} years •
        {minDate && maxDate && ` ${format(minDate, "yyyy")} - ${format(maxDate, "yyyy")}`}
      </div>
    </div>
  );
}
