"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { getUserBadge } from "@/lib/household";
import { useRouter } from "next/navigation";
import LocationAutocomplete from "./LocationAutocomplete";
import { 
  Search, 
  X, 
  Filter, 
  Camera, 
  Receipt, 
  LayoutList, 
  MapPin, 
  Calendar, 
  Clock, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Plane, 
  Train, 
  Bus, 
  Car, 
  Bike, 
  Navigation, 
  StickyNote,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";

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
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [deletingItem, setDeletingItem] = useState<{ type: "expense" | "post"; id: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CNY: "¥",
      THB: "฿",
    };
    return symbols[currency] || "$";
  };

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

      fetch(endpoint, {
        method: "DELETE",
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to delete");
          }
          router.refresh();
        })
        .catch((error) => {
          console.error("Error deleting:", error);
          alert(`Failed to delete ${type}. Please refresh and try again.`);
          setDeletingItem(null);
        });

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
    currentDate: Date,
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
    setEditDate(format(currentDate, "yyyy-MM-dd"));
    setEditTime(format(currentDate, "HH:mm"));
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditContent("");
    setEditLocation("");
    setEditTransportationMethod("");
    setEditFromLocation("");
    setEditToLocation("");
    setEditDate("");
    setEditTime("");
  };

  const handleEdit = async () => {
    if (!editingItem) return;

    setIsSaving(true);

    try {
      const endpoint = editingItem.type === "expense"
        ? `/api/expenses/${editingItem.id}`
        : `/api/posts/${editingItem.id}`;

      const [year, month, day] = editDate.split('-').map(Number);
      const [hours, minutes] = editTime.split(':').map(Number);
      const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const combinedDateTime = localDate.toISOString();

      const body = editingItem.type === "expense"
        ? {
            date: combinedDateTime,
            note: editContent,
            location: editLocation,
            transportationMethod: editTransportationMethod || null,
            fromLocation: editFromLocation || null,
            toLocation: editToLocation || null
          }
        : {
            timestamp: combinedDateTime,
            content: editContent,
            location: editLocation
          };

      cancelEdit();

      fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to save");
          }
          router.refresh();
        })
        .catch((error) => {
          console.error("Error updating:", error);
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

  const groupedByDate = useMemo(() => {
    return timelineItems.reduce((acc, item) => {
      const year = item.date.getFullYear();
      const month = String(item.date.getMonth() + 1).padStart(2, '0');
      const day = String(item.date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, TimelineItem[]>);
  }, [timelineItems]);

  return (
    <div className="space-y-8">
      {/* Search and Filter Bar */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 -mx-6 px-6 py-4 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search timeline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-300 dark:focus:border-zinc-600 focus:ring-0 transition-all text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                filterType === "all"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              All
            </button>
            <button
              onClick={() => setFilterType("photos")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                filterType === "photos"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Photos
            </button>
            <button
              onClick={() => setFilterType("expenses")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                filterType === "expenses"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Expenses
            </button>
          </div>

          <div className="flex gap-2 pl-4 border-l border-zinc-100 dark:border-zinc-700">
            <button
              onClick={() => setSelectedUser("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedUser === "all"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              Everyone
            </button>
            {users.map((user) => {
              const badge = getUserBadge(user.id, users);
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ring-2 ${
                    selectedUser === user.id
                      ? "ring-zinc-900 dark:ring-white ring-offset-2 dark:ring-offset-zinc-900"
                      : "ring-transparent opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: badge.color, color: '#fff' }}
                  title={user.name}
                >
                  {badge.initial}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {timelineItems.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            {filterType === "photos" ? <Camera className="w-8 h-8 text-zinc-400 dark:text-zinc-500" /> : 
             filterType === "expenses" ? <Receipt className="w-8 h-8 text-zinc-400 dark:text-zinc-500" /> : 
             <Filter className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />}
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
            {filterType === "all" ? "No timeline items yet" : `No ${filterType} found`}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mx-auto">
            {selectedUser !== "all"
              ? "Try selecting a different user or filter"
              : "Items will appear here once you add them to your trip."}
          </p>
        </div>
      )}

      {/* Timeline Items */}
      {timelineItems.length > 0 && (
        <div className="relative border-l-2 border-zinc-100 dark:border-zinc-800 ml-4 sm:ml-8 space-y-12 pb-8">
          {Object.entries(groupedByDate).map(([dateKey, items]) => (
            <div key={dateKey} className="relative pl-8 sm:pl-12">
              {/* Date Marker */}
              <div className="absolute -left-[9px] sm:-left-[9px] top-0">
                <div className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 border-4 border-white dark:border-zinc-950 ring-1 ring-zinc-100 dark:ring-zinc-800" />
              </div>
              
              {/* Date Header */}
              <div className="mb-6 flex items-center gap-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {(() => {
                    const [year, month, day] = dateKey.split('-').map(Number);
                    const localDate = new Date(year, month - 1, day);
                    return format(localDate, "EEEE, MMM d");
                  })()}
                </h3>
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-full border border-zinc-100 dark:border-zinc-700">
                  {items.length} items
                </span>
              </div>

              {/* Items Grid */}
              <div className="space-y-6">
                {items.map((item) => {
                  if (item.type === "expense") {
                    const expense = item.data as TimelineExpense;
                    const badge = getUserBadge(expense.user.id, users);
                    const isEditing = editingItem?.type === "expense" && editingItem.id === expense.id;
                    
                    return (
                      <div key={expense.id} className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                        <div className="flex gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                    {expense.category}
                                  </span>
                                  <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(item.date, "h:mm a")}
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                                    {getCurrencySymbol(expense.currency)}{expense.amount.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                  style={{ backgroundColor: badge.color }}
                                  title={badge.name}
                                >
                                  {badge.initial}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <button 
                                    onClick={() => startEdit("expense", expense.id, item.date, expense.note || "", expense.location || "", expense.transportationMethod || "", expense.fromLocation || "", expense.toLocation || "")}
                                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete("expense", expense.id)}
                                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-4 border border-zinc-200 dark:border-zinc-700">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Date</label>
                                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Time</label>
                                    <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm" />
                                  </div>
                                </div>
                                <input 
                                  type="text" 
                                  value={editContent} 
                                  onChange={e => setEditContent(e.target.value)} 
                                  placeholder="Note"
                                  className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">Cancel</button>
                                  <button onClick={handleEdit} className="px-3 py-1.5 text-xs font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200">Save</button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 space-y-2">
                                {expense.note && (
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{expense.note}</p>
                                )}
                                
                                {(expense.location || expense.transportationMethod) && (
                                  <div className="flex flex-wrap gap-2">
                                    {expense.location && (
                                      <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-100 dark:border-zinc-700">
                                        <MapPin className="w-3 h-3" />
                                        {expense.location}
                                      </span>
                                    )}
                                    {expense.transportationMethod && (
                                      <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-100 dark:border-zinc-700">
                                        <Navigation className="w-3 h-3" />
                                        {expense.transportationMethod}
                                      </span>
                                    )}
                                  </div>
                                )}
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

                    return (
                      <div key={post.id} className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                        <div className="flex gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-zinc-900 shadow-sm"
                                  style={{ backgroundColor: badge.color }}
                                >
                                  {badge.initial}
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-zinc-900 dark:text-white block leading-none mb-1">{badge.name}</span>
                                  <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(item.date, "h:mm a")}
                                    {post.location && (
                                      <>
                                        <span>•</span>
                                        <MapPin className="w-3 h-3" />
                                        {post.location}
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button 
                                  onClick={() => startEdit("post", post.id, item.date, post.content || "", post.location || "")}
                                  className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete("post", post.id)}
                                  className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-4 border border-zinc-200 dark:border-zinc-700">
                                <div className="grid grid-cols-2 gap-3">
                                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm" />
                                  <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm" />
                                </div>
                                <textarea 
                                  value={editContent} 
                                  onChange={e => setEditContent(e.target.value)} 
                                  className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm"
                                  rows={3}
                                />
                                <input 
                                  type="text" 
                                  value={editLocation} 
                                  onChange={e => setEditLocation(e.target.value)} 
                                  className="w-full px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm"
                                  placeholder="Location"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">Cancel</button>
                                  <button onClick={handleEdit} className="px-3 py-1.5 text-xs font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200">Save</button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {post.content && (
                                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                    {post.content}
                                  </p>
                                )}
                                
                                {post.photos.length > 0 && (
                                  <div className={`grid gap-2 ${post.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    {post.photos.map((photoUrl, index) => {
                                       const displayUrl = photoUrl.includes('drive.google.com') || photoUrl.includes('googleusercontent.com')
                                         ? `/api/proxy-image?url=${encodeURIComponent(photoUrl)}`
                                         : photoUrl;
                                         
                                       return (
                                        <div key={index} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                          <img 
                                            src={displayUrl} 
                                            alt="" 
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                                            onClick={() => toggleImageExpand(`${post.id}-${index}`)}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
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
      
      {/* Expanded Image Modal */}
      {Object.entries(expandedImages).map(([key, isExpanded]) => {
        if (!isExpanded) return null;
        const [postId, photoIndexStr] = key.split('-');
        const photoIndex = parseInt(photoIndexStr);
        // Find the post and photo URL logic here (simplified for brevity, ideally would be in a separate component)
        // For now just reusing the basic logic if needed, but let's rely on the implementation in the map loop for opening
        return (
             <div key={key} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => toggleImageExpand(key)}>
               <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
                 <X className="w-6 h-6" />
               </button>
               {/* Image content would go here, finding it from props.posts */}
             </div>
        );
      })}
    </div>
  );
}
