"use client";

import { useState } from "react";
import { format } from "date-fns";
import { getUserBadge } from "@/lib/household";

interface TimelineExpense {
  id: string;
  amount: number;
  category: string;
  currency: string;
  date: Date;
  note?: string | null;
  receiptUrl?: string | null;
  location?: string | null;
  user: {
    id: string;
    name: string;
  };
}

interface TimelinePost {
  id: string;
  type: string;
  content?: string | null;
  photos: string[];
  location?: string | null;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TimelineItem {
  type: "expense" | "post";
  date: Date;
  data: TimelineExpense | TimelinePost;
}

interface TripTimelineProps {
  expenses: TimelineExpense[];
  posts: TimelinePost[];
  users: Array<{ id: string; name: string }>;
}

export default function TripTimeline({ expenses, posts, users }: TripTimelineProps) {
  // Merge expenses and posts into single timeline
  const timelineItems: TimelineItem[] = [
    ...expenses.map((e) => ({
      type: "expense" as const,
      date: new Date(e.date),
      data: e,
    })),
    ...posts.map((p) => ({
      type: "post" as const,
      date: new Date(p.timestamp),
      data: p,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Group by date
  const groupedByDate = timelineItems.reduce((acc, item) => {
    const dateKey = format(item.date, "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);

  const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>({});

  const toggleImageExpand = (imageId: string) => {
    setExpandedImages((prev) => ({
      ...prev,
      [imageId]: !prev[imageId],
    }));
  };

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl border-2 border-dashed border-purple-200">
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No memories yet</h3>
        <p className="text-gray-600">Start capturing your trip moments!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedByDate).map(([dateKey, items]) => (
        <div key={dateKey}>
          {/* Date header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-lg mb-4">
            <h3 className="font-bold text-lg">
              {format(new Date(dateKey), "EEEE, MMMM d, yyyy")}
            </h3>
          </div>

          {/* Timeline items for this date */}
          <div className="space-y-4">
            {items.map((item, index) => {
              if (item.type === "expense") {
                const expense = item.data as TimelineExpense;
                const badge = getUserBadge(expense.user.id, users);

                return (
                  <div
                    key={`expense-${expense.id}`}
                    className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5"
                  >
                    <div className="flex items-start gap-4">
                      {/* User badge */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: badge.color }}
                      >
                        {badge.initial}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 truncate">
                              💰 {expense.category}
                            </div>
                            <div className="text-sm text-gray-600">
                              {badge.name} • {format(item.date, "h:mm a")}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-600 whitespace-nowrap">
                              {expense.currency} {expense.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {expense.note && (
                          <p className="text-gray-700 mb-2">{expense.note}</p>
                        )}

                        {expense.location && (
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            📍 {expense.location}
                          </div>
                        )}

                        {expense.receiptUrl && (
                          <div className="mt-3">
                            <img
                              src={expense.receiptUrl}
                              alt="Receipt"
                              className="rounded-xl max-w-sm cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(expense.receiptUrl!, "_blank")}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else {
                const post = item.data as TimelinePost;
                const badge = getUserBadge(post.user.id, users);

                return (
                  <div
                    key={`post-${post.id}`}
                    className="bg-white rounded-2xl border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow p-5"
                  >
                    <div className="flex items-start gap-4">
                      {/* User badge */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: badge.color }}
                      >
                        {badge.initial}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <div className="font-bold text-gray-900">
                            {post.type === "photo" && "📸"}
                            {post.type === "note" && "📝"}
                            {post.type === "checkin" && "📍"}
                            {" "}
                            {badge.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(item.date, "h:mm a")}
                            {post.location && ` • ${post.location}`}
                          </div>
                        </div>

                        {post.content && (
                          <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                            {post.content}
                          </p>
                        )}

                        {post.photos.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            {post.photos.map((photoUrl, photoIndex) => {
                              const imageId = `${post.id}-${photoIndex}`;
                              const isExpanded = expandedImages[imageId];

                              // Use proxy for Google Drive images, direct URL for others
                              const displayUrl = photoUrl.includes('drive.google.com') || photoUrl.includes('googleusercontent.com')
                                ? `/api/proxy-image?url=${encodeURIComponent(photoUrl)}`
                                : photoUrl;

                              return (
                                <div key={photoIndex} className="relative">
                                  <img
                                    src={displayUrl}
                                    alt={`Photo ${photoIndex + 1}`}
                                    className={`rounded-xl cursor-pointer hover:opacity-90 transition-all ${
                                      isExpanded
                                        ? "fixed inset-0 z-50 w-screen h-screen object-contain bg-black/90 p-4"
                                        : "w-full h-auto"
                                    }`}
                                    onClick={() => toggleImageExpand(imageId)}
                                    onError={(e) => {
                                      // If image fails to load, show a fallback
                                      const img = e.target as HTMLImageElement;
                                      img.style.display = "none";
                                      const parent = img.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `
                                          <div class="flex items-center justify-center h-48 bg-gray-100 rounded-xl">
                                            <div class="text-center p-4">
                                              <div class="text-4xl mb-2">🖼️</div>
                                              <p class="text-sm text-gray-600">Image unavailable</p>
                                              <a href="${photoUrl}" target="_blank" class="text-xs text-blue-600 hover:underline mt-2 block">Open in Drive</a>
                                            </div>
                                          </div>
                                        `;
                                      }
                                    }}
                                  />
                                  {isExpanded && (
                                    <button
                                      className="fixed top-4 right-4 z-50 bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl hover:bg-gray-200 transition-colors"
                                      onClick={() => toggleImageExpand(imageId)}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
