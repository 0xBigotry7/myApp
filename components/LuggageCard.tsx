"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable, DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { getTranslations, type Locale } from "@/lib/i18n";
import AddItemModal from "./AddItemModal";

interface PackingItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  weight: number | null;
  isPacked: boolean;
  notes: string | null;
  belongsTo: string;
  colorCode: string | null;
  importance: string;
}

interface Luggage {
  id: string;
  name: string;
  type: string;
  color: string;
  weight: number | null;
  maxWeight: number | null;
  description: string | null;
  airtagName?: string | null;
  items: PackingItem[];
}

interface LuggageCardProps {
  luggage: Luggage;
  onAddItem: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  onToggleItem: (itemId: string, isPacked: boolean) => void;
  onRemoveFromLuggage: (itemId: string) => void;
  locale: Locale;
  userId: string;
}

const LUGGAGE_ICONS: Record<string, string> = {
  suitcase: "🧳",
  backpack: "🎒",
  duffel: "👜",
  "carry-on": "💼",
  personal: "👝",
  box: "📦",
  other: "🎁",
};

const COLOR_CLASSES: Record<string, string> = {
  red: "from-red-400 to-red-600",
  blue: "from-blue-400 to-blue-600",
  green: "from-green-400 to-green-600",
  yellow: "from-yellow-400 to-yellow-600",
  purple: "from-purple-400 to-purple-600",
  pink: "from-pink-400 to-pink-600",
  orange: "from-orange-400 to-orange-600",
  gray: "from-gray-400 to-gray-600",
  black: "from-gray-700 to-gray-900",
};

export default function LuggageCard({ luggage, onAddItem, onEdit, onRefresh, onToggleItem, onRemoveFromLuggage, locale, userId }: LuggageCardProps) {
  const router = useRouter();
  const t = getTranslations(locale);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null);
  const [items, setItems] = useState(luggage.items);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: luggage.id });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `luggage-${luggage.id}`,
    data: {
      type: 'luggage',
      luggageId: luggage.id,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const packedCount = luggage.items.filter((i) => i.isPacked).length;
  const totalCount = luggage.items.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;
  const totalWeight = luggage.items.reduce(
    (sum, item) => sum + ((item.weight || 0) * item.quantity),
    0
  );

  const colorClass = COLOR_CLASSES[luggage.color] || COLOR_CLASSES.gray;
  const icon = LUGGAGE_ICONS[luggage.type] || LUGGAGE_ICONS.other;


  const handleDeleteLuggage = async () => {
    if (!confirm(`Delete "${luggage.name}" and all its items?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/packing/luggage/${luggage.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting luggage:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder items locally
    const newItems = [...items];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);
    setItems(newItems);

    // Update order in the backend
    try {
      await fetch(`/api/packing/luggage/${luggage.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: newItems.map((item) => item.id),
        }),
      });
    } catch (error) {
      console.error("Error reordering items:", error);
      // Revert on error
      setItems(luggage.items);
    }
  };

  const handleEditItem = (item: PackingItem) => {
    setEditingItem(item);
  };

  const handleItemUpdated = (updatedItem: any) => {
    // Update local state
    setItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    // Also refresh to get server state
    onRefresh();
  };

  // Sync items with luggage prop when it changes
  useEffect(() => {
    setItems(luggage.items);
  }, [luggage.items]);

  // Category order for consistent display
  const CATEGORY_ORDER = [
    "documents",
    "electronics",
    "charging",
    "clothing",
    "toiletries",
    "shoes",
    "accessories",
    "bedding",
    "medications",
    "food",
    "gifts",
    "other",
  ];

  // Group items by category and sort by category order
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);

  // Sort categories by the defined order
  const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a);
    const indexB = CATEGORY_ORDER.indexOf(b);
    // If category not found in order, put it at the end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden ${
        isOver ? "ring-4 ring-violet-300" : ""
      }`}
    >
      <div ref={setDropRef} className="w-full h-full">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colorClass} p-4 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              {...listeners}
              className="text-3xl cursor-move"
              title="Drag to reorder"
            >
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-lg">{luggage.name}</h3>
              <p className="text-sm opacity-90 capitalize">{luggage.type}</p>
              {luggage.airtagName && (
                <p className="text-xs opacity-80 mt-1 flex items-center gap-1">
                  <span>📍</span> {luggage.airtagName}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="text-white/80 hover:text-white transition-colors"
              title="Edit luggage"
            >
              ✏️
            </button>
            <button
              onClick={handleDeleteLuggage}
              disabled={loading}
              className="text-white/80 hover:text-white transition-colors"
            >
              🗑️
            </button>
          </div>
        </div>

        {luggage.description && (
          <p className="text-sm opacity-90 mt-2">{luggage.description}</p>
        )}

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>
              {packedCount} / {totalCount} items
            </span>
            <span>{totalWeight.toFixed(1)} kg</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-4">
        <div className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 text-left hover:text-gray-900 transition-colors"
          >
            <span>{expanded ? "▼" : "▶"} {t.items} ({totalCount})</span>
          </button>
          <button
            onClick={onAddItem}
            className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold hover:bg-violet-200 transition-colors"
          >
            + {t.addItem}
          </button>
        </div>

        {expanded && (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {totalCount === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  {t.noItemsYet}
                </p>
              ) : (
                sortedCategories.map((category) => {
                  const categoryItems = itemsByCategory[category];
                  return (
                    <div key={category} className="border-l-2 border-gray-200 pl-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        {t[category as keyof typeof t] || category}
                      </div>
                      <SortableContext
                        items={categoryItems.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-1">
                          {categoryItems.map((item) => (
                            <SortableItem
                              key={item.id}
                              item={item}
                              onToggle={() => onToggleItem(item.id, item.isPacked)}
                              onEdit={() => handleEditItem(item)}
                              onRemove={() => onRemoveFromLuggage(item.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  );
                })
              )}
            </div>
          </DndContext>
        )}
      </div>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <AddItemModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          luggageId={luggage.id}
          onSuccess={handleItemUpdated}
          locale={locale}
          userId={userId}
          editItem={editingItem}
        />
      )}
    </div>
  );
}

// Sortable Item Component
interface SortableItemProps {
  item: PackingItem;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function SortableItem({ item, onToggle, onEdit, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get background color based on belongsTo
  const getBackgroundColor = () => {
    if (item.belongsTo === "baber") return "bg-pink-50"; // Light pink for baber
    if (item.belongsTo === "BABER") return "bg-blue-50"; // Light blue for BABER
    return "bg-white"; // White for shared
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 group px-2 py-1 rounded-lg ${getBackgroundColor()}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        ⋮⋮
      </div>
      <input
        type="checkbox"
        checked={item.isPacked}
        onChange={onToggle}
        className="w-4 h-4 text-violet-600 rounded cursor-pointer"
      />
      {item.importance && item.importance !== "normal" && (
        <span
          className="text-xs flex-shrink-0"
          title={item.importance}
        >
          {item.importance === "essential" && "🔴"}
          {item.importance === "important" && "🟠"}
          {item.importance === "optional" && "⚪"}
        </span>
      )}
      <span
        className={`flex-1 text-sm ${
          item.isPacked
            ? "text-gray-500"
            : "text-gray-700"
        }`}
      >
        {item.name}
        {item.quantity > 1 && (
          <span className="text-xs text-gray-500 ml-1">
            ×{item.quantity}
          </span>
        )}
      </span>
      {item.weight && (
        <span className="text-xs text-gray-400">
          {(item.weight * item.quantity).toFixed(1)}kg
        </span>
      )}
      <button
        onClick={onEdit}
        className="sm:opacity-0 sm:group-hover:opacity-100 text-blue-500 hover:text-blue-700 text-xs transition-opacity"
        title="Edit item"
      >
        ✏️
      </button>
      <button
        onClick={onRemove}
        className="sm:opacity-0 sm:group-hover:opacity-100 text-orange-500 hover:text-orange-700 text-xs transition-opacity"
        title="Move to unorganized"
      >
        ↩
      </button>
    </div>
  );
}
