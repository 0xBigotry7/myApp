"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable, DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { getTranslations, type Locale } from "@/lib/i18n";
import AddItemModal from "./AddItemModal";
import { 
  GripVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  ShoppingBag,
  Briefcase,
  Backpack,
  Package,
  Gift,
  Luggage
} from "lucide-react";

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

interface LuggageType {
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
  luggage: LuggageType;
  onAddItem: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  onToggleItem: (itemId: string, isPacked: boolean) => void;
  onRemoveFromLuggage: (itemId: string) => void;
  locale: Locale;
  userId: string;
}

const LUGGAGE_ICONS: Record<string, any> = {
  suitcase: Luggage,
  backpack: Backpack,
  duffel: ShoppingBag,
  "carry-on": Briefcase,
  personal: ShoppingBag,
  box: Package,
  other: Gift,
};

const COLOR_CLASSES: Record<string, string> = {
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  purple: "bg-purple-100 text-purple-700",
  pink: "bg-pink-100 text-pink-700",
  orange: "bg-orange-100 text-orange-700",
  gray: "bg-zinc-100 text-zinc-700",
  black: "bg-zinc-800 text-zinc-100",
};

export default function LuggageCard({ luggage, onAddItem, onEdit, onRefresh, onToggleItem, onRemoveFromLuggage, locale, userId }: LuggageCardProps) {
  const router = useRouter();
  const t = getTranslations(locale);
  const [expanded, setExpanded] = useState(true);
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

  const colorClass = COLOR_CLASSES[luggage.color] || COLOR_CLASSES.gray;
  const Icon = LUGGAGE_ICONS[luggage.type] || LUGGAGE_ICONS.other;

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
    "cosmetics",
    "shoes",
    "accessories",
    "bags",
    "bedding",
    "medications",
    "food",
    "other",
    "souvenirs",
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
      className={`bg-white rounded-2xl shadow-sm border border-zinc-200 hover:shadow-md transition-all overflow-hidden flex flex-col h-full ${
        isOver ? "ring-2 ring-zinc-900" : ""
      }`}
    >
      <div ref={setDropRef} className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                {...listeners}
                className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing ${colorClass}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-lg leading-tight">{luggage.name}</h3>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                  <span className="capitalize">{luggage.type}</span>
                  {luggage.airtagName && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span>📍</span> {luggage.airtagName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteLuggage}
                disabled={loading}
                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {luggage.description && (
            <p className="text-sm text-zinc-500 mb-4">{luggage.description}</p>
          )}

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 mb-1.5">
              <span>{packedCount} of {totalCount} packed</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress === 100 ? "bg-emerald-500" : "bg-zinc-900"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 bg-zinc-50/50">
          <div className="p-4 pb-2">
             <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-zinc-600 uppercase tracking-wider transition-colors"
              >
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Items ({totalCount})
              </button>
              <button
                onClick={onAddItem}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 bg-white border border-zinc-200 px-2 py-1 rounded-md shadow-sm"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
          </div>

          {expanded && (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="px-4 pb-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {totalCount === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                    <p className="text-zinc-400 text-sm">Empty luggage</p>
                  </div>
                ) : (
                  sortedCategories.map((category) => {
                    const categoryItems = itemsByCategory[category];
                    return (
                      <div key={category}>
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">
                          {t[category as keyof typeof t] || category}
                        </h4>
                        <SortableContext
                          items={categoryItems.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1.5">
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
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
        item.isPacked
          ? "bg-zinc-50 border-zinc-100"
          : "bg-white border-zinc-200 shadow-sm hover:border-zinc-300"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <button onClick={onToggle} className="shrink-0">
        {item.isPacked ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5 text-zinc-300 hover:text-zinc-400" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className={`text-sm font-medium truncate ${
              item.isPacked ? "text-zinc-400 line-through" : "text-zinc-700"
            }`}
          >
            {item.name}
          </span>
          {item.quantity > 1 && (
            <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-md">
              ×{item.quantity}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-0.5">
          {/* User Badge */}
          {item.belongsTo !== "shared" && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium uppercase tracking-wide ${
              item.belongsTo === "baber" ? "bg-pink-50 text-pink-600" : 
              item.belongsTo === "BABER" ? "bg-blue-50 text-blue-600" : 
              "bg-zinc-100 text-zinc-500"
            }`}>
              {item.belongsTo}
            </span>
          )}
          
          {/* Importance Badge */}
          {item.importance === "essential" && (
            <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md font-medium">
              Essential
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
          title="Move to unorganized"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
