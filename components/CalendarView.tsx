"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, getYear, getMonth } from "date-fns";

interface CalendarEvent {
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

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date, events: CalendarEvent[]) => void;
}

export default function CalendarView({ events, onEventClick, onDateClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const eventDate = new Date(event.date);
      const dateKey = format(eventDate, "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  // Calculate heat map intensity (0-1 scale)
  const maxEventsPerDay = useMemo(() => {
    let max = 0;
    eventsByDate.forEach((events) => {
      if (events.length > max) max = events.length;
    });
    return max;
  }, [eventsByDate]);

  // Get calendar days for current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return eventsByDate.get(dateKey) || [];
  };

  // Get heat map color based on event count
  const getHeatColor = (eventCount: number): string => {
    if (eventCount === 0) return "bg-gray-50";
    const intensity = eventCount / maxEventsPerDay;

    if (intensity >= 0.8) return "bg-purple-600";
    if (intensity >= 0.6) return "bg-purple-500";
    if (intensity >= 0.4) return "bg-purple-400";
    if (intensity >= 0.2) return "bg-purple-300";
    return "bg-purple-200";
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(date, dayEvents);
    }
  };

  // Navigation
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Get selected date events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Calendar Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {events.length} total events
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Previous month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Next month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Heat map legend */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
            <div className="w-4 h-4 bg-purple-200 rounded"></div>
            <div className="w-4 h-4 bg-purple-300 rounded"></div>
            <div className="w-4 h-4 bg-purple-400 rounded"></div>
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <div className="w-4 h-4 bg-purple-600 rounded"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const heatColor = getHeatColor(dayEvents.length);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  relative aspect-square rounded-lg transition-all
                  ${heatColor}
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${isSelected ? "ring-2 ring-purple-600 scale-105" : ""}
                  ${isToday ? "ring-2 ring-blue-500" : ""}
                  hover:scale-105 hover:shadow-md
                `}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                  <span
                    className={`
                      text-xs sm:text-sm font-medium
                      ${dayEvents.length > 0 ? "text-white" : "text-gray-700"}
                      ${!isCurrentMonth && dayEvents.length === 0 ? "text-gray-400" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-white/90 font-bold mt-0.5">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && selectedDateEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>
            <span className="text-sm text-gray-600">
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-3">
            {selectedDateEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="w-full text-left p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  {event.photos.length > 0 && (
                    <img
                      src={event.photos[0]}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {event.title}
                      </h4>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {format(event.date, "h:mm a")}
                      </span>
                    </div>
                    {event.content && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {event.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <span>📍</span>
                          {event.location}
                        </span>
                      )}
                      {event.mood && (
                        <span className="flex items-center gap-1">
                          <span>😊</span>
                          {event.mood}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for selected date */}
      {selectedDate && selectedDateEvents.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-2">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {format(selectedDate, "MMMM d, yyyy")}
          </h3>
          <p className="text-gray-600">No events on this date</p>
        </div>
      )}

      {/* Year overview stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Year Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
              {events.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
              {eventsByDate.size}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Active Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
              {maxEventsPerDay}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Busiest Day</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
              {events.filter((e) => e.photos.length > 0).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">With Photos</div>
          </div>
        </div>
      </div>
    </div>
  );
}
