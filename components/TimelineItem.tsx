"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { markdownToHtml } from "@/lib/markdown";
import { 
  Camera, 
  CreditCard, 
  DollarSign, 
  Activity, 
  Sparkles, 
  Edit2, 
  Trash2, 
  MapPin, 
  Clock, 
  MoreHorizontal,
  Plane,
  Home,
  Heart
} from "lucide-react";

interface TimelineItemProps {
  item: {
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
  };
  onDeleted: () => void;
}

export default function TimelineItem({ item, onDeleted }: TimelineItemProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editedTime, setEditedTime] = useState(format(new Date(item.date), "HH:mm"));
  const [isSaving, setIsSaving] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleDelete = async () => {
    if (!item.isEditable) return;

    try {
      const response = await fetch(`/api/timeline/events/${item.originalId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDeleted();
      } else {
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete event");
    }
  };

  const handleTimeUpdate = async () => {
    setIsSaving(true);
    try {
      const [hours, minutes] = editedTime.split(":").map(Number);
      const newDate = new Date(item.date);
      newDate.setHours(hours, minutes, 0, 0);

      let endpoint = "";
      if (item.source === "life_event") {
        endpoint = `/api/timeline/events/${item.originalId}`;
      } else if (item.source === "expense") {
        endpoint = `/api/expenses/${item.originalId}`;
      } else {
        alert("Time editing not supported for this item type");
        setIsSaving(false);
        return;
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate.toISOString() }),
      });

      if (response.ok) {
        setIsEditingTime(false);
        router.refresh();
      } else {
        alert("Failed to update time");
      }
    } catch (error) {
      console.error("Error updating time:", error);
      alert("Failed to update time");
    } finally {
      setIsSaving(false);
    }
  };

  const cleanLocationName = (location: string | undefined | null): string => {
    if (!location) return "";
    if (location.startsWith("{") || location.startsWith("[")) {
      try {
        const parsed = JSON.parse(location);
        return parsed.name || parsed.formatted_address || location;
      } catch {
        return location;
      }
    }
    return location;
  };

  const getSourceStyle = () => {
    switch (item.source) {
      case "trip_post":
        return { bg: "bg-blue-50", border: "border-blue-100", icon: <Plane className="w-4 h-4 text-blue-500" />, color: "text-blue-700" };
      case "expense":
        return { bg: "bg-emerald-50", border: "border-emerald-100", icon: <CreditCard className="w-4 h-4 text-emerald-500" />, color: "text-emerald-700" };
      case "transaction":
        return { bg: "bg-green-50", border: "border-green-100", icon: <DollarSign className="w-4 h-4 text-green-500" />, color: "text-green-700" };
      case "health":
        return { bg: "bg-rose-50", border: "border-rose-100", icon: <Activity className="w-4 h-4 text-rose-500" />, color: "text-rose-700" };
      case "life_event":
        return { bg: "bg-amber-50", border: "border-amber-100", icon: <Sparkles className="w-4 h-4 text-amber-500" />, color: "text-amber-700" };
      default:
        return { bg: "bg-zinc-50", border: "border-zinc-100", icon: <Edit2 className="w-4 h-4 text-zinc-500" />, color: "text-zinc-700" };
    }
  };

  const style = getSourceStyle();
  const canEditTime = item.source === "life_event" || item.source === "expense";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5 transition-all hover:shadow-md group relative">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Avatar/Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
            {style.icon}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-zinc-900 leading-tight mb-1">
              {item.title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 font-medium">
              {/* Time */}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                {isEditingTime ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={editedTime}
                      onChange={(e) => setEditedTime(e.target.value)}
                      className="px-2 py-0.5 border border-zinc-200 rounded text-xs bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                      autoFocus
                    />
                    <button onClick={handleTimeUpdate} disabled={isSaving} className="text-emerald-600 font-bold hover:underline">
                      Save
                    </button>
                    <button onClick={() => setIsEditingTime(false)} className="text-zinc-400 hover:text-zinc-600">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => canEditTime && setIsEditingTime(true)}
                    className={canEditTime ? "hover:text-zinc-800 transition-colors cursor-pointer" : "cursor-default"}
                  >
                    {format(new Date(item.date), "h:mm a")}
                  </button>
                )}
              </div>

              {/* Location */}
              {item.location && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate max-w-[150px]">{cleanLocationName(item.location)}</span>
                </div>
              )}

              {/* Trip Link */}
              {item.metadata?.tripName && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />
                  <Plane className="w-3.5 h-3.5 text-zinc-400" />
                  <Link href={`/trips/${item.metadata.tripId}`} className="text-indigo-600 hover:text-indigo-700 hover:underline truncate max-w-[150px]">
                    {item.metadata.tripName}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {item.isEditable && (
          <div className="relative">
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-zinc-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {item.source === "expense" && item.metadata?.tripId && (
                    <Link 
                      href={`/trips/${item.metadata.tripId}`}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit in Trip
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setShowActions(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Event
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pl-[56px]">
        {item.content && (
          <div className="text-sm text-zinc-600 leading-relaxed mb-4 prose prose-sm max-w-none prose-p:my-1 prose-a:text-indigo-600">
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(item.content) }} />
          </div>
        )}

        {/* Specialized Metadata Cards */}
        {item.source === "expense" && item.metadata && (
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 mb-4 inline-block min-w-[200px]">
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Expense</div>
            <div className="font-bold text-zinc-900 text-lg">
              {item.metadata.currency} {item.metadata.amount.toLocaleString()}
            </div>
            <div className="text-sm text-zinc-600 mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-xs">
                {item.metadata.category}
              </span>
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {item.photos && item.photos.length > 0 && (
          <div className={`grid gap-2 mb-4 ${
            item.photos.length === 1 ? 'grid-cols-1' : 
            item.photos.length === 2 ? 'grid-cols-2' : 
            'grid-cols-2 sm:grid-cols-3'
          }`}>
            {item.photos.slice(0, expanded ? undefined : 4).map((photo, index) => (
              <div 
                key={index} 
                className={`relative rounded-xl overflow-hidden bg-zinc-100 cursor-zoom-in group/photo ${
                  item.photos.length === 1 ? 'aspect-video' : 'aspect-square'
                }`}
                onClick={() => window.open(photo, "_blank")}
              >
                <img
                  src={photo}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-105"
                />
                {!expanded && index === 3 && item.photos.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm cursor-pointer" onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>
                    <span className="text-white font-bold text-lg">+{item.photos.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags & Mood */}
        {(item.metadata?.tags || item.metadata?.mood) && (
          <div className="flex flex-wrap gap-2">
            {item.metadata.mood && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                <Sparkles className="w-3 h-3" />
                {item.metadata.mood}
              </span>
            )}
            {item.metadata.tags?.map((tag: string) => (
              <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium border border-zinc-200">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Delete this memory?</h3>
            <p className="text-zinc-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
