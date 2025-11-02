"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { markdownToHtml } from "@/lib/markdown";

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

  // Clean up location display - extract English name from possible JSON or formatted string
  const cleanLocationName = (location: string | undefined | null): string => {
    if (!location) return "";

    // If it looks like JSON, try to parse it
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

  // Determine card style based on source
  const getCardStyle = () => {
    switch (item.source) {
      case "trip_post":
      case "expense":
        return "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200";
      case "transaction":
        return "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200";
      case "health":
        return "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200";
      case "life_event":
        return "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  const getIcon = () => {
    switch (item.source) {
      case "trip_post":
        return "📸";
      case "expense":
        return "💳";
      case "transaction":
        return "💰";
      case "health":
        return "🌸";
      case "life_event":
        return "✨";
      default:
        return "📝";
    }
  };

  const canEditTime = item.source === "life_event" || item.source === "expense";

  return (
    <div className={`rounded-2xl shadow-sm border-2 p-6 ${getCardStyle()} hover:shadow-md transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-3xl">{getIcon()}</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
              {isEditingTime ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={editedTime}
                    onChange={(e) => setEditedTime(e.target.value)}
                    className="px-2 py-1 border-2 border-blue-300 rounded text-sm"
                  />
                  <button
                    onClick={handleTimeUpdate}
                    disabled={isSaving}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isSaving ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTime(false);
                      setEditedTime(format(new Date(item.date), "HH:mm"));
                    }}
                    className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className={canEditTime ? "cursor-pointer hover:text-blue-600" : ""}
                    onClick={() => canEditTime && setIsEditingTime(true)}
                    title={canEditTime ? "Click to edit time" : ""}
                  >
                    {format(new Date(item.date), "h:mm a")}
                  </span>
                  {canEditTime && (
                    <button
                      onClick={() => setIsEditingTime(true)}
                      className="text-blue-500 hover:text-blue-700 text-xs"
                      title="Edit time"
                    >
                      ✏️
                    </button>
                  )}
                </>
              )}
              {item.location && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span>📍</span>
                    {cleanLocationName(item.location)}
                  </span>
                </>
              )}
              {item.metadata?.tripName && (
                <>
                  <span>•</span>
                  <Link
                    href={`/trips/${item.metadata.tripId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {item.metadata.tripName}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {item.isEditable && (
          <div className="flex gap-1">
            {/* Edit button - only for expenses */}
            {item.source === "expense" && (
              <button
                onClick={() => {
                  // Navigate to trip page to edit
                  if (item.metadata?.tripId) {
                    window.location.href = `/trips/${item.metadata.tripId}`;
                  }
                }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Edit in trip"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {item.content && (
        <div className="mb-3 bg-gray-50 rounded-xl p-4">
          <div
            className="text-gray-700 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(item.content) }}
          />
        </div>
      )}

      {/* Metadata for specific types */}
      {item.source === "expense" && item.metadata && (
        <div className="mb-3 p-3 bg-white/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {item.metadata.currency} {item.metadata.amount.toLocaleString()}
            </span>
            <span className="text-sm text-gray-600">{item.metadata.category}</span>
          </div>
          {item.metadata.transportationMethod && (
            <div className="mt-2 text-sm text-blue-700">
              🚗 {item.metadata.transportationMethod}
              {item.metadata.fromLocation && item.metadata.toLocation && (
                <div className="mt-1">
                  {cleanLocationName(item.metadata.fromLocation)} → {cleanLocationName(item.metadata.toLocation)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {item.source === "transaction" && item.metadata && (
        <div className="mb-3 p-3 bg-white/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-green-700">
              ${item.metadata.amount.toLocaleString()}
            </span>
            <span className="text-sm text-gray-600">{item.metadata.category}</span>
          </div>
          {item.metadata.merchantName && (
            <div className="mt-1 text-sm text-gray-600">
              at {item.metadata.merchantName}
            </div>
          )}
        </div>
      )}

      {item.source === "health" && item.metadata && (
        <div className="mb-3 p-3 bg-white/50 rounded-lg">
          {item.metadata.flowIntensity && (
            <div className="text-sm text-pink-700 mb-1">
              Flow: {item.metadata.flowIntensity}
            </div>
          )}
          {item.metadata.symptoms && item.metadata.symptoms.length > 0 && (
            <div className="text-sm text-gray-600">
              Symptoms: {item.metadata.symptoms.join(", ")}
            </div>
          )}
        </div>
      )}

      {item.source === "life_event" && item.metadata && (
        <div className="mb-3 flex flex-wrap gap-2">
          {item.metadata.mood && (
            <span className="px-3 py-1 bg-white/70 rounded-full text-sm font-medium text-gray-700">
              😊 {item.metadata.mood}
            </span>
          )}
          {item.metadata.tags && item.metadata.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-3 py-1 bg-white/70 rounded-full text-sm font-medium text-gray-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Photos */}
      {item.photos && item.photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
          {item.photos.slice(0, expanded ? undefined : 4).map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt=""
              className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(photo, "_blank")}
            />
          ))}
        </div>
      )}

      {item.photos.length > 4 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm text-purple-600 hover:text-purple-800 font-medium"
        >
          Show {item.photos.length - 4} more photos
        </button>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <p className="text-sm text-red-800 mb-3">Are you sure you want to delete this memory?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
