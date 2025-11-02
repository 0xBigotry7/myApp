"use client";

import { useState, useMemo } from "react";
import { format, differenceInYears, startOfYear, endOfYear } from "date-fns";
import { markdownToHtml } from "@/lib/markdown";

interface StoryEvent {
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

interface StoryViewProps {
  events: StoryEvent[];
}

interface Chapter {
  id: string;
  title: string;
  year: number;
  period: string;
  events: StoryEvent[];
  coverPhoto?: string;
  description: string;
}

export default function StoryView({ events }: StoryViewProps) {
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"chapters" | "continuous">("chapters");

  // Organize events into chapters by year
  const chapters = useMemo(() => {
    // Group by year
    const yearMap = new Map<number, StoryEvent[]>();
    events.forEach((event) => {
      const year = new Date(event.date).getFullYear();
      if (!yearMap.has(year)) {
        yearMap.set(year, []);
      }
      yearMap.get(year)!.push(event);
    });

    // Convert to chapters
    const chapterList: Chapter[] = Array.from(yearMap.entries())
      .sort(([a], [b]) => b - a) // Most recent first
      .map(([year, yearEvents]) => {
        const sortedEvents = yearEvents.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Find a good cover photo
        const eventWithPhotos = sortedEvents.find((e) => e.photos.length > 0);
        const coverPhoto = eventWithPhotos?.photos[0];

        // Generate chapter description
        const eventCount = sortedEvents.length;
        const photoCount = sortedEvents.reduce((sum, e) => sum + e.photos.length, 0);
        const locations = new Set(sortedEvents.map((e) => e.location).filter(Boolean));

        let description = `${eventCount} ${eventCount === 1 ? "memory" : "memories"}`;
        if (photoCount > 0) {
          description += ` • ${photoCount} ${photoCount === 1 ? "photo" : "photos"}`;
        }
        if (locations.size > 0) {
          description += ` • ${locations.size} ${locations.size === 1 ? "location" : "locations"}`;
        }

        return {
          id: `chapter-${year}`,
          title: `Chapter ${year}`,
          year,
          period: format(new Date(year, 0, 1), "yyyy"),
          events: sortedEvents,
          coverPhoto,
          description,
        };
      });

    return chapterList;
  }, [events]);

  // Get the selected chapter
  const activeChapter = useMemo(() => {
    if (!selectedChapter) return chapters[0];
    return chapters.find((c) => c.id === selectedChapter) || chapters[0];
  }, [chapters, selectedChapter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              📖 Your Life Story
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {chapters.length} chapters • {events.length} memories
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("chapters")}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-all
                ${
                  viewMode === "chapters"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }
              `}
            >
              Chapters
            </button>
            <button
              onClick={() => setViewMode("continuous")}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-all
                ${
                  viewMode === "continuous"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }
              `}
            >
              Continuous
            </button>
          </div>
        </div>
      </div>

      {viewMode === "chapters" ? (
        <>
          {/* Chapter Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
              {chapters.map((chapter) => {
                const isActive = activeChapter?.id === chapter.id;
                return (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapter(chapter.id)}
                    className={`
                      flex-shrink-0 px-4 py-2 rounded-xl font-medium text-sm transition-all
                      ${
                        isActive
                          ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    {chapter.year}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chapter Display */}
          {activeChapter && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Chapter Header with Cover Photo */}
              <div
                className="relative h-64 sm:h-96 bg-gradient-to-br from-purple-500 to-indigo-600 overflow-hidden"
                style={
                  activeChapter.coverPhoto
                    ? {
                        backgroundImage: `url(${activeChapter.coverPhoto})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <h1 className="text-3xl sm:text-5xl font-black text-white mb-2">
                    {activeChapter.title}
                  </h1>
                  <p className="text-lg text-white/90">{activeChapter.description}</p>
                </div>
              </div>

              {/* Chapter Content */}
              <div className="p-6 sm:p-8">
                <div className="max-w-3xl mx-auto space-y-8">
                  {activeChapter.events.map((event, index) => (
                    <div
                      key={event.id}
                      className="relative pl-8 border-l-4 border-purple-200 pb-8 last:pb-0"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-purple-500 border-4 border-white shadow-sm"></div>

                      {/* Event Content */}
                      <div className="space-y-3">
                        {/* Date */}
                        <div className="text-sm font-semibold text-purple-600">
                          {format(new Date(event.date), "MMMM d, yyyy")}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900">
                          {event.title}
                        </h3>

                        {/* Location & Mood */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <span>📍</span>
                              {event.location}
                            </span>
                          )}
                          {event.mood && (
                            <span className="flex items-center gap-1">
                              <span>😊</span>
                              <span className="capitalize">{event.mood}</span>
                            </span>
                          )}
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize">
                            {event.type}
                          </span>
                        </div>

                        {/* Content */}
                        {event.content && (
                          <div
                            className="prose prose-sm max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{
                              __html: markdownToHtml(event.content),
                            }}
                          />
                        )}

                        {/* Photos */}
                        {event.photos.length > 0 && (
                          <div
                            className={`
                              grid gap-3
                              ${event.photos.length === 1 ? "grid-cols-1" : ""}
                              ${event.photos.length === 2 ? "grid-cols-2" : ""}
                              ${event.photos.length >= 3 ? "grid-cols-2 sm:grid-cols-3" : ""}
                            `}
                          >
                            {event.photos.map((photo, photoIndex) => (
                              <img
                                key={photoIndex}
                                src={photo}
                                alt=""
                                className={`
                                  w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity
                                  ${event.photos.length === 1 ? "h-96" : "h-48"}
                                `}
                                onClick={() => window.open(photo, "_blank")}
                              />
                            ))}
                          </div>
                        )}

                        {/* User Attribution */}
                        <div className="flex items-center gap-2 pt-2">
                          <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-semibold">
                            {event.user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-600">
                            {event.user.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Continuous Story Mode */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-12">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="space-y-6">
                {/* Chapter Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-purple-600">
                      {chapter.year}
                    </div>
                    <div className="text-xs text-gray-600">{chapter.description}</div>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
                </div>

                {/* Chapter Events */}
                <div className="space-y-8">
                  {chapter.events.map((event) => (
                    <div
                      key={event.id}
                      className="relative pl-8 border-l-4 border-purple-200"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-purple-500 border-4 border-white shadow-sm"></div>

                      {/* Event Content */}
                      <div className="space-y-3 pb-6">
                        <div className="text-sm font-semibold text-purple-600">
                          {format(new Date(event.date), "MMMM d")}
                        </div>

                        <h3 className="text-xl font-bold text-gray-900">
                          {event.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <span>📍</span>
                              {event.location}
                            </span>
                          )}
                          {event.mood && (
                            <span className="flex items-center gap-1">
                              <span>😊</span>
                              <span className="capitalize">{event.mood}</span>
                            </span>
                          )}
                        </div>

                        {event.content && (
                          <div
                            className="prose prose-sm max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{
                              __html: markdownToHtml(event.content),
                            }}
                          />
                        )}

                        {event.photos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {event.photos.map((photo, photoIndex) => (
                              <img
                                key={photoIndex}
                                src={photo}
                                alt=""
                                className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => window.open(photo, "_blank")}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {chapters.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Your Story Awaits
          </h3>
          <p className="text-gray-600">
            Start adding events to begin writing your life story!
          </p>
        </div>
      )}
    </div>
  );
}
