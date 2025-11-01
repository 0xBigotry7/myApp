"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { getUserBadge } from "@/lib/household";
import { useRouter } from "next/navigation";
import LocationAutocomplete from "./LocationAutocomplete";

interface TimelineExpense {
  id: string;
  amount: number;
  category: string;
  currency: string;
  date: Date;
  note?: string | null;
  receiptUrl?: string | null;
  location?: string | null;
  transportationMethod?: string | null;
  fromLocation?: string | null;
  toLocation?: string | null;
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
  const router = useRouter();
  const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState<"all" | "photos" | "expenses">("all");
  const [selectedUser, setSelectedUser] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<{ type: "expense" | "post"; id: string } | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTransportationMethod, setEditTransportationMethod] = useState("");
  const [editFromLocation, setEditFromLocation] = useState("");
  const [editToLocation, setEditToLocation] = useState("");
  const [deletingItem, setDeletingItem] = useState<{ type: "expense" | "post"; id: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggleImageExpand = (imageId: string) => {
    setExpandedImages((prev) => ({
      ...prev,
      [imageId]: !prev[imageId],
    }));
  };

  const handleDelete = async (type: "expense" | "post", id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    setDeletingItem({ type, id });

    try {
      const endpoint = type === "expense" ? `/api/expenses/${id}` : `/api/posts/${id}`;

      // Delete in background
      fetch(endpoint, {
        method: "DELETE",
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to delete");
          }
          // Refresh in background
          router.refresh();
        })
        .catch((error) => {
          console.error("Error deleting:", error);
          alert(`Failed to delete ${type}. Please refresh and try again.`);
          setDeletingItem(null);
        });

      // Reset deleting state after a moment
      setTimeout(() => {
        setDeletingItem(null);
      }, 1000);
    } catch (error) {
      console.error("Error deleting:", error);
      setDeletingItem(null);
    }
  };

  const startEdit = (
    type: "expense" | "post",
    id: string,
    currentContent?: string,
    currentLocation?: string,
    transportationMethod?: string,
    fromLocation?: string,
    toLocation?: string
  ) => {
    setEditingItem({ type, id });
    setEditContent(currentContent || "");
    setEditLocation(currentLocation || "");
    setEditTransportationMethod(transportationMethod || "");
    setEditFromLocation(fromLocation || "");
    setEditToLocation(toLocation || "");
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditContent("");
    setEditLocation("");
    setEditTransportationMethod("");
    setEditFromLocation("");
    setEditToLocation("");
  };

  const handleEdit = async () => {
    if (!editingItem) return;

    setIsSaving(true);

    try {
      const endpoint = editingItem.type === "expense"
        ? `/api/expenses/${editingItem.id}`
        : `/api/posts/${editingItem.id}`;

      const body = editingItem.type === "expense"
        ? {
            note: editContent,
            location: editLocation,
            transportationMethod: editTransportationMethod || null,
            fromLocation: editFromLocation || null,
            toLocation: editToLocation || null
          }
        : { content: editContent, location: editLocation };

      // Close edit mode immediately for instant feedback
      cancelEdit();

      // Save in background
      fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to save");
          }
          // Refresh in background
          router.refresh();
        })
        .catch((error) => {
          console.error("Error updating:", error);
          // Only show error if save actually failed
          alert(`Failed to save changes. Please refresh and try again.`);
        })
        .finally(() => {
          setIsSaving(false);
        });
    } catch (error) {
      console.error("Error updating:", error);
      setIsSaving(false);
    }
  };

  // Merge and filter timeline items
  const timelineItems: TimelineItem[] = useMemo(() => {
    let items = [
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
    ];

    // Apply filters
    if (filterType === "photos") {
      items = items.filter(item => item.type === "post");
    } else if (filterType === "expenses") {
      items = items.filter(item => item.type === "expense");
    }

    if (selectedUser !== "all") {
      items = items.filter(item => {
        if (item.type === "expense") {
          return (item.data as TimelineExpense).user.id === selectedUser;
        } else {
          return (item.data as TimelinePost).user.id === selectedUser;
        }
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => {
        if (item.type === "expense") {
          const expense = item.data as TimelineExpense;
          return (
            expense.category.toLowerCase().includes(query) ||
            expense.note?.toLowerCase().includes(query) ||
            expense.location?.toLowerCase().includes(query) ||
            expense.amount.toString().includes(query)
          );
        } else {
          const post = item.data as TimelinePost;
          return (
            post.content?.toLowerCase().includes(query) ||
            post.location?.toLowerCase().includes(query) ||
            post.type.toLowerCase().includes(query)
          );
        }
      });
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses, posts, filterType, selectedUser, searchQuery]);

  // Group by date
  const groupedByDate = useMemo(() => {
    return timelineItems.reduce((acc, item) => {
      const dateKey = format(item.date, "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, TimelineItem[]>);
  }, [timelineItems]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search timeline... (notes, locations, categories)"
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

      {/* Filters - Mobile Optimized */}
      <div className="space-y-3">
        {/* Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              filterType === "all"
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🌟 All
          </button>
          <button
            onClick={() => setFilterType("photos")}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              filterType === "photos"
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📸 Photos ({posts.length})
          </button>
          <button
            onClick={() => setFilterType("expenses")}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              filterType === "expenses"
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            💰 Expenses ({expenses.length})
          </button>
        </div>

        {/* User Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedUser("all")}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              selectedUser === "all"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            👥 Everyone
          </button>
          {users.map((user) => {
            const badge = getUserBadge(user.id, users);
            return (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedUser === user.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: badge.color }}
                >
                  {badge.initial}
                </div>
                {badge.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {timelineItems.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl border-2 border-dashed border-purple-200">
          <div className="text-6xl mb-4">
            {filterType === "photos" ? "📸" : filterType === "expenses" ? "💰" : "🌟"}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {filterType === "all" ? "No memories yet" : `No ${filterType} found`}
          </h3>
          <p className="text-gray-600">
            {selectedUser !== "all"
              ? "Try selecting a different user or filter"
              : "Start capturing your trip moments!"}
          </p>
        </div>
      )}

      {/* Timeline Items */}
      {timelineItems.length > 0 && (
        <div className="space-y-8">
        {Object.entries(groupedByDate).map(([dateKey, items]) => (
          <div key={dateKey}>
            {/* Date header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 sm:px-6 py-3 rounded-2xl shadow-lg mb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base sm:text-lg">
                  {format(new Date(dateKey), "EEEE, MMMM d, yyyy")}
                </h3>
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            {/* Timeline items for this date */}
            <div className="space-y-4">
              {items.map((item, index) => {
                if (item.type === "expense") {
                  const expense = item.data as TimelineExpense;
                  const badge = getUserBadge(expense.user.id, users);
                  const isEditing = editingItem?.type === "expense" && editingItem.id === expense.id;
                  const isDeleting = deletingItem?.type === "expense" && deletingItem.id === expense.id;

                  return (
                    <div
                      key={`expense-${expense.id}`}
                      className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all p-4 sm:p-5 transform hover:scale-[1.01] relative group"
                    >
                      {/* Action Buttons */}
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(
                            "expense",
                            expense.id,
                            expense.note || "",
                            expense.location || "",
                            expense.transportationMethod || "",
                            expense.fromLocation || "",
                            expense.toLocation || ""
                          )}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          disabled={isDeleting}
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete("expense", expense.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          disabled={isDeleting}
                          title="Delete"
                        >
                          {isDeleting ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>

                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* User badge */}
                        <div
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.initial}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-16">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="font-bold text-gray-900 text-base sm:text-lg">
                                💰 {expense.category}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600">
                                {badge.name} • {format(item.date, "h:mm a")}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xl sm:text-2xl font-bold text-indigo-600">
                                {expense.currency} {expense.amount.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="space-y-3 mt-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                  rows={3}
                                  placeholder="Add a note..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                  type="text"
                                  value={editLocation}
                                  onChange={(e) => setEditLocation(e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                  placeholder="Add location..."
                                />
                              </div>

                              {/* Transportation fields - show if category is Transportation */}
                              {expense.category === "Transportation" && (
                                <div className="space-y-3 pt-3 border-t-2 border-blue-100">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">🚗 Transportation Method</label>
                                    <select
                                      value={editTransportationMethod}
                                      onChange={(e) => setEditTransportationMethod(e.target.value)}
                                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                    >
                                      <option value="">Select method...</option>
                                      <option value="Flight">✈️ Flight</option>
                                      <option value="Train">🚆 Train</option>
                                      <option value="Bus">🚌 Bus</option>
                                      <option value="Car">🚗 Car</option>
                                      <option value="Taxi">🚕 Taxi</option>
                                      <option value="Uber/Lyft">🚙 Uber/Lyft</option>
                                      <option value="Subway">🚇 Subway</option>
                                      <option value="Boat">⛴️ Boat/Ferry</option>
                                      <option value="Bicycle">🚴 Bicycle</option>
                                      <option value="Walking">🚶 Walking</option>
                                      <option value="Other">🚦 Other</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">📍 From</label>
                                    <LocationAutocomplete
                                      value={editFromLocation}
                                      onChange={setEditFromLocation}
                                      placeholder="Starting location..."
                                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">🎯 To</label>
                                    <LocationAutocomplete
                                      value={editToLocation}
                                      onChange={setEditToLocation}
                                      placeholder="Destination..."
                                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={handleEdit}
                                  disabled={isSaving}
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isSaving ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={isSaving}
                                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Transportation Details */}
                              {expense.category === "Transportation" && (expense.transportationMethod || expense.fromLocation || expense.toLocation) && (
                                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  {expense.transportationMethod && (
                                    <div className="text-sm font-medium text-blue-900 mb-2">
                                      🚗 {expense.transportationMethod}
                                    </div>
                                  )}
                                  {(expense.fromLocation || expense.toLocation) && (
                                    <div className="flex items-center gap-2 text-sm text-blue-800">
                                      {expense.fromLocation && (
                                        <>
                                          <span className="font-medium">From:</span>
                                          <span>{expense.fromLocation}</span>
                                        </>
                                      )}
                                      {expense.fromLocation && expense.toLocation && (
                                        <span className="text-blue-400">→</span>
                                      )}
                                      {expense.toLocation && (
                                        <>
                                          <span className="font-medium">To:</span>
                                          <span>{expense.toLocation}</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {expense.note && (
                                <p className="text-gray-700 mb-2 text-sm sm:text-base bg-gray-50 p-3 rounded-lg">
                                  {expense.note}
                                </p>
                              )}

                              {expense.location && (
                                <div className="text-sm text-gray-600 flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-lg w-fit">
                                  📍 {expense.location}
                                </div>
                              )}
                            </>
                          )}

                          {expense.receiptUrl && (
                            <div className="mt-3">
                              <img
                                src={expense.receiptUrl}
                                alt="Receipt"
                                className="rounded-xl max-w-full sm:max-w-sm cursor-pointer hover:opacity-90 transition-opacity shadow-md"
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
                  const isEditing = editingItem?.type === "post" && editingItem.id === post.id;
                  const isDeleting = deletingItem?.type === "post" && deletingItem.id === post.id;

                  return (
                    <div
                      key={`post-${post.id}`}
                      className="bg-white rounded-2xl border-2 border-purple-200 shadow-sm hover:shadow-lg transition-all p-4 sm:p-5 transform hover:scale-[1.01] relative group"
                    >
                      {/* Action Buttons */}
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={() => startEdit("post", post.id, post.content || "", post.location || "")}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          disabled={isDeleting}
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete("post", post.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          disabled={isDeleting}
                          title="Delete"
                        >
                          {isDeleting ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>

                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* User badge */}
                        <div
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.initial}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-16">
                          <div className="mb-2">
                            <div className="font-bold text-gray-900 text-base sm:text-lg">
                              {post.type === "photo" && "📸"}
                              {post.type === "note" && "📝"}
                              {post.type === "checkin" && "📍"}
                              {" "}
                              {badge.name}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              {format(item.date, "h:mm a")}
                              {!isEditing && post.location && (
                                <span className="ml-2 bg-purple-50 px-2 py-0.5 rounded-md">
                                  📍 {post.location}
                                </span>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="space-y-3 mt-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                  rows={4}
                                  placeholder="What's on your mind?"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                  type="text"
                                  value={editLocation}
                                  onChange={(e) => setEditLocation(e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                  placeholder="Where are you?"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleEdit}
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {post.content && (
                                <p className="text-gray-700 mb-3 text-sm sm:text-base whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                                  {post.content}
                                </p>
                              )}
                            </>
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
                                  <div key={photoIndex} className="relative group">
                                    <img
                                      src={displayUrl}
                                      alt={`Photo ${photoIndex + 1}`}
                                      className={`rounded-xl cursor-pointer hover:opacity-90 transition-all shadow-md ${
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
                                    {!isExpanded && (
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-xl flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                                          <span className="text-2xl">🔍</span>
                                        </div>
                                      </div>
                                    )}
                                    {isExpanded && (
                                      <button
                                        className="fixed top-4 right-4 z-50 bg-white text-gray-900 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl hover:bg-gray-200 transition-colors shadow-xl"
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
      )}
    </div>
  );
}
