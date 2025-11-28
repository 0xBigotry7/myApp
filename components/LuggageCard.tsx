"use client";

import { useState, useEffect } from "react";
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
  red: "bg-red-100 text-red-600",
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
  yellow: "bg-amber-100 text-amber-600",
  purple: "bg-purple-100 text-purple-600",
  pink: "bg-pink-100 text-pink-600",
  orange: "bg-orange-100 text-orange-600",
  gray: "bg-zinc-100 text-zinc-600",
  black: "bg-zinc-800 text-zinc-100",
};

export default function LuggageCard({ luggage, onAddItem, onEdit, onRefresh, onToggleItem, onRemoveFromLuggage, locale, userId }: LuggageCardProps) {
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
      setItems(luggage.items);
    }
  };

  const handleEditItem = (item: PackingItem) => {
    setEditingItem(item);
  };

  const handleItemUpdated = (updatedItem: any) => {
    setItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    onRefresh();
  };

  useEffect(() => {
    setItems(luggage.items);
  }, [luggage.items]);

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

  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);

  const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a);
    const indexB = CATEGORY_ORDER.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white rounded-[24px] shadow-sm border border-zinc-100 hover:shadow-lg hover:border-zinc-200 transition-all overflow-hidden flex flex-col h-full group/card ${
        isOver ? "ring-2 ring-zinc-900 ring-offset-2" : ""
      }`}
    >
      <div ref={setDropRef} className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-50">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div
                {...listeners}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm ${colorClass}`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-xl leading-tight">{luggage.name}</h3>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mt-1">
                  <span className="uppercase tracking-wider">{luggage.type}</span>
                  {luggage.airtagName && (
                    <>
                      <span className="text-zinc-300">•</span>
                      <span className="flex items-center gap-1 text-zinc-600 bg-zinc-50 px-1.5 py-0.5 rounded-md">
                        <span>📍</span> {luggage.airtagName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteLuggage}
                disabled={loading}
                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {luggage.description && (
            <p className="text-sm text-zinc-500 mb-5 leading-relaxed">{luggage.description}</p>
          )}

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide">
              <span>{packedCount} of {totalCount} packed</span>
              <span className={progress === 100 ? "text-emerald-600" : "text-zinc-900"}>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  progress === 100 ? "bg-emerald-500" : "bg-zinc-900"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 bg-zinc-50/30">
          <div className="px-6 py-3 flex items-center justify-between border-b border-zinc-50/50">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 uppercase tracking-wider transition-colors py-1"
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Items
            </button>
            <button
              onClick={onAddItem}
              className="text-xs font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow hover:border-zinc-300 transition-all"
            >
              <Plus className="w-3 h-3" />
              Add Item
            </button>
          </div>

          {expanded && (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="px-4 pb-4 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pt-2">
                {totalCount === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-zinc-400 text-sm font-medium">No items yet</p>
                    <button 
                      onClick={onAddItem}
                      className="text-xs text-zinc-500 hover:text-zinc-900 mt-2 font-medium underline decoration-zinc-300 underline-offset-2"
                    >
                      Add your first item
                    </button>
                  </div>
                ) : (
                  sortedCategories.map((category) => {
                    const categoryItems = itemsByCategory[category];
                    return (
                      <div key={category}>
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 ml-2">
                          {t[category as keyof typeof t] || category}
                        </h4>
                        <SortableContext
                          items={categoryItems.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
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
      className={`group relative flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
        item.isPacked
          ? "bg-zinc-50/50 border-zinc-100/50"
          : "bg-white border-zinc-100 shadow-sm hover:shadow hover:border-zinc-200"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-zinc-200 hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <button onClick={onToggle} className="shrink-0 transition-transform active:scale-90">
        {item.isPacked ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        ) : (
          <Circle className="w-6 h-6 text-zinc-300 hover:text-zinc-400 transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className={`text-sm font-medium truncate transition-colors ${
              item.isPacked ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-900"
            }`}
          >
            {item.name}
          </span>
          {item.quantity > 1 && (
            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-md">
              ×{item.quantity}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {item.belongsTo !== "shared" && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${
              item.belongsTo === "baber" ? "bg-pink-50 text-pink-600" : 
              item.belongsTo === "BABER" ? "bg-blue-50 text-blue-600" : 
              "bg-zinc-100 text-zinc-500"
            }`}>
              {item.belongsTo}
            </span>
          )}
          
          {item.importance === "essential" && (
            <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide">
              Essential
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-zinc-100">
        <button
          onClick={onEdit}
          className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-zinc-200 mx-0.5" />
        <button
          onClick={onRemove}
          className="p-1.5 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
          title="Move to unorganized"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
