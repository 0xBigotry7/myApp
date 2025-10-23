"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useLocale } from "./LanguageSwitcher";
import { getTranslations } from "@/lib/i18n";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  category: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  notes: string | null;
  order: number;
  isAiGenerated: boolean;
}

interface ItineraryViewProps {
  tripId: string;
  destination: string;
  initialActivities: Activity[];
  startDate: Date;
  endDate: Date;
  itineraryImageUrl?: string | null;
}

function SortableActivity({
  activity,
  onEdit,
  onDelete,
  t,
}: {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof getTranslations>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 mb-3 hover:shadow-md transition-all cursor-move"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-lg text-gray-900">{activity.title}</h4>
            {activity.isAiGenerated && (
              <span className="text-xs bg-gradient-to-r from-sunset-100 to-ocean-100 text-sunset-700 px-2 py-1 rounded-lg font-medium">
                ✨ AI
              </span>
            )}
          </div>
          {activity.description && (
            <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            {activity.startTime && activity.endTime && (
              <span className="flex items-center gap-1">
                ⏰ {activity.startTime} - {activity.endTime}
              </span>
            )}
            {activity.location && (
              <span className="flex items-center gap-1">
                📍 {activity.location}
              </span>
            )}
            {activity.category && (
              <span className="bg-ocean-100 text-ocean-700 px-3 py-1 rounded-lg font-medium">
                {activity.category}
              </span>
            )}
            {activity.estimatedCost && activity.estimatedCost > 0 && (
              <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-lg font-medium">
                💰 ${activity.estimatedCost.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(activity);
            }}
            className="text-ocean-600 hover:text-ocean-800 hover:bg-ocean-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          >
            ✏️ {t.edit}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(activity.id);
            }}
            className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          >
            🗑️ {t.delete}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryView({
  tripId,
  destination,
  initialActivities,
  startDate,
  endDate,
  itineraryImageUrl,
}: ItineraryViewProps) {
  const locale = useLocale();
  const t = getTranslations(locale);
  const [activities, setActivities] = useState(initialActivities);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(itineraryImageUrl || null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    async function generateImage() {
      if (!imageUrl && !isGeneratingImage) {
        setIsGeneratingImage(true);
        try {
          const response = await fetch("/api/ai/generate-theme-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme: "itinerary", destination }),
          });

          if (response.ok) {
            const data = await response.json();
            setImageUrl(data.imageUrl);

            // Save to database
            await fetch(`/api/trips/${tripId}/update-image`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: data.imageUrl, type: "itinerary" }),
            });
          }
        } catch (error) {
          console.error("Failed to generate itinerary image:", error);
        } finally {
          setIsGeneratingImage(false);
        }
      }
    }

    generateImage();
  }, [imageUrl, destination, tripId, isGeneratingImage]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group activities by date
  const activitiesByDate = activities.reduce((acc, activity) => {
    const dateKey = format(new Date(activity.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setActivities((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update order in database
        fetch("/api/activities/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId,
            activityOrders: newItems.map((item, index) => ({
              id: item.id,
              order: index,
            })),
          }),
        });

        return newItems;
      });
    }
  };

  const handleGenerateItinerary = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          destination: "Auto-detected",
          startDate: format(new Date(startDate), "yyyy-MM-dd"),
          endDate: format(new Date(endDate), "yyyy-MM-dd"),
          budget: 2000,
          interests: ["sightseeing", "food", "culture"],
          travelStyle: "Balanced",
          numberOfPeople: 2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActivities([...activities, ...data.activities]);
      }
    } catch (error) {
      console.error("Error generating itinerary:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setActivities(activities.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Anime Background Header */}
      <div className="relative h-64">
        {isGeneratingImage ? (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 animate-pulse flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-2">✨</div>
              <p className="font-semibold">Generating anime art...</p>
            </div>
          </div>
        ) : imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt="Itinerary theme"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400" />
        )}
        <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-lg">
            <span>📅</span>
            <span>{t.itinerary}</span>
          </h2>
          <button
            onClick={handleGenerateItinerary}
            disabled={isGenerating}
            className="bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-xl font-medium hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/30"
          >
            {isGenerating ? t.generating : `✨ ${t.aiGenerateItinerary}`}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-600 mb-2 font-medium">
              {t.noActivitiesYet}
            </p>
            <p className="text-gray-500 text-sm">
              {t.generateOrAddManually}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(activitiesByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dayActivities]) => (
                <div key={`day-${date}`} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📆</span>
                    <span>{format(new Date(date), "EEEE, MMMM d, yyyy")}</span>
                  </h3>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={dayActivities.map((a) => a.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {dayActivities.map((activity) => (
                        <SortableActivity
                          key={activity.id}
                          activity={activity}
                          onEdit={(a) => console.log("Edit", a)}
                          onDelete={handleDeleteActivity}
                          t={t}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
