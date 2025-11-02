"use client";

import { useState, useEffect, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import Image from "next/image";

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  type: string;
  content?: string;
  photos: string[];
  location?: string;
  mood?: string;
  user: { id: string; name: string; email?: string };
  metadata?: Record<string, any>;
}

interface EnhancedTimelineViewProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
}

export default function EnhancedTimelineView({ events, onEventClick }: EnhancedTimelineViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Setup Intersection Observer for scroll animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll(".timeline-item");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      elements.forEach((el) => observerRef.current?.unobserve(el));
    };
  }, [events]);

  const getTypeColor = (type: string) => {
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
      default: "from-gray-500 to-slate-500",
    };
    return colors[type.toLowerCase()] || colors.default;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      travel: "✈️",
      milestone: "🎯",
      memory: "💭",
      achievement: "🏆",
      celebration: "🎉",
      relationship: "❤️",
      work: "💼",
      education: "🎓",
      health: "🌸",
      default: "📌",
    };
    return icons[type.toLowerCase()] || icons.default;
  };

  return (
    <div className="relative max-w-4xl mx-auto px-4 py-8">
      {/* Timeline Line */}
      <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-indigo-200 to-purple-200 transform md:-translate-x-px"></div>

      {/* Timeline Items */}
      <div className="space-y-12">
        {events.map((event, index) => {
          const isVisible = visibleItems.has(`timeline-${event.id}`);
          const isLeft = index % 2 === 0;

          return (
            <div
              key={event.id}
              id={`timeline-${event.id}`}
              className={`timeline-item relative transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {/* Timeline Dot */}
              <div
                className={`absolute left-8 md:left-1/2 w-4 h-4 rounded-full bg-gradient-to-br ${getTypeColor(
                  event.type
                )} transform md:-translate-x-1/2 shadow-lg z-10 ring-4 ring-white ${
                  isVisible ? "scale-100" : "scale-0"
                } transition-transform duration-500`}
                style={{ transitionDelay: `${index * 50 + 200}ms` }}
              >
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getTypeColor(event.type)} animate-ping opacity-30`}></div>
              </div>

              {/* Content Card */}
              <div
                className={`ml-16 md:ml-0 md:w-[calc(50%-2rem)] ${
                  isLeft ? "md:mr-auto md:pr-12" : "md:ml-auto md:pl-12"
                }`}
              >
                <div
                  className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-purple-200"
                  onClick={() => onEventClick?.(event)}
                >
                  {/* Header */}
                  <div className={`bg-gradient-to-r ${getTypeColor(event.type)} p-4 text-white`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{getTypeIcon(event.type)}</span>
                          <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                            {event.type}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg leading-tight">
                          {event.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 text-xs">
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                        <span>📅</span>
                        <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                        <span>⏰</span>
                        <span>{format(new Date(event.date), "h:mm a")}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                          <span>📍</span>
                          <span className="truncate max-w-[120px]">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photos Grid */}
                  {event.photos.length > 0 && (
                    <div className={`grid gap-1 p-1 ${
                      event.photos.length === 1 ? "grid-cols-1" :
                      event.photos.length === 2 ? "grid-cols-2" :
                      event.photos.length === 3 ? "grid-cols-3" :
                      "grid-cols-2"
                    }`}>
                      {event.photos.slice(0, 4).map((photo, idx) => (
                        <div
                          key={idx}
                          className={`relative overflow-hidden rounded-lg ${
                            event.photos.length === 1 ? "aspect-video" :
                            event.photos.length === 3 && idx === 0 ? "col-span-2 aspect-video" :
                            "aspect-square"
                          } group/photo`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhoto(photo);
                          }}
                        >
                          <Image
                            src={photo}
                            alt={`Photo ${idx + 1}`}
                            fill
                            className="object-cover group-hover/photo:scale-110 transition-transform duration-500"
                          />
                          {idx === 3 && event.photos.length > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">
                                +{event.photos.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  {event.content && (
                    <div className="p-4">
                      <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                        {event.content}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-4 pb-4 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white font-semibold text-xs">
                        {event.user.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{event.user.name}</span>
                    </div>
                    <span className="text-gray-400">
                      {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Hover Indicator */}
                  <div className={`h-1 bg-gradient-to-r ${getTypeColor(event.type)} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
                </div>

                {/* Connecting Line to Dot (Desktop) */}
                <div
                  className={`hidden md:block absolute top-8 ${
                    isLeft ? "right-0 left-auto" : "left-0 right-auto"
                  } w-12 h-px bg-gradient-to-r ${
                    isLeft
                      ? "from-purple-200 to-transparent"
                      : "from-transparent to-purple-200"
                  } ${
                    isVisible ? "scale-x-100" : "scale-x-0"
                  } transition-transform duration-500`}
                  style={{
                    transformOrigin: isLeft ? "right" : "left",
                    transitionDelay: `${index * 50 + 300}ms`,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors z-10 w-12 h-12 flex items-center justify-center"
            onClick={() => setSelectedPhoto(null)}
          >
            ×
          </button>
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedPhoto}
              alt="Full size"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
