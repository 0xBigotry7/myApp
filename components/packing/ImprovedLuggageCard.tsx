"use client";

import { useState, useEffect } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { getTranslations, type Locale } from "@/lib/i18n";
import InlineEditableItem from "./InlineEditableItem";
import QuickAddItem from "./QuickAddItem";
import { 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  ShoppingBag,
  Briefcase,
  Backpack,
  Package,
  Gift,
  Luggage,
  CheckCheck,
  RotateCcw,
  Filter
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

interface ImprovedLuggageCardProps {
  luggage: LuggageType;
  allLuggages: { id: string; name: string }[];
  onEdit: () => void;
  onRefresh: () => void;
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

const COLOR_STYLES: Record<string, { bg: string; text: string; accent: string }> = {
  red: { bg: "bg-red-50", text: "text-red-700", accent: "bg-red-500" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", accent: "bg-blue-500" },
  green: { bg: "bg-emerald-50", text: "text-emerald-700", accent: "bg-emerald-500" },
  yellow: { bg: "bg-amber-50", text: "text-amber-700", accent: "bg-amber-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", accent: "bg-purple-500" },
  pink: { bg: "bg-pink-50", text: "text-pink-700", accent: "bg-pink-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", accent: "bg-orange-500" },
  gray: { bg: "bg-zinc-100", text: "text-zinc-700", accent: "bg-zinc-500" },
  black: { bg: "bg-zinc-800", text: "text-zinc-100", accent: "bg-zinc-900" },
};

const CATEGORY_ORDER = [
  "documents", "electronics", "charging", "clothing", "toiletries", 
  "cosmetics", "shoes", "accessories", "bags", "bedding", 
  "medications", "food", "other", "souvenirs"
];

const CATEGORY_ICONS: Record<string, string> = {
  documents: "📄",
  electronics: "📱",
  charging: "🔌",
  clothing: "👕",
  toiletries: "🧴",
  cosmetics: "💄",
  shoes: "👟",
  accessories: "👓",
  bags: "👜",
  bedding: "🛏️",
  medications: "💊",
  food: "🍎",
  other: "📦",
  souvenirs: "🎁",
};

export default function ImprovedLuggageCard({ 
  luggage, 
  allLuggages,
  onEdit, 
  onRefresh, 
  locale, 
  userId 
}: ImprovedLuggageCardProps) {
  const t = getTranslations(locale);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(luggage.items);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [filterOwner, setFilterOwner] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `luggage-${luggage.id}`,
    data: { type: 'luggage', luggageId: luggage.id },
  });

  useEffect(() => {
    setItems(luggage.items);
  }, [luggage.items]);

  const colorStyle = COLOR_STYLES[luggage.color] || COLOR_STYLES.gray;
  const Icon = LUGGAGE_ICONS[luggage.type] || LUGGAGE_ICONS.other;

  // Filter and group items
  const filteredItems = items.filter(item => {
    if (filterOwner && item.belongsTo !== filterOwner) return false;
    if (filterCategory && item.category !== filterCategory) return false;
    return true;
  });

  const itemsByCategory = filteredItems.reduce((acc, item) => {
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

  const packedCount = items.filter(i => i.isPacked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  // Get unique categories and owners for filtering
  const uniqueCategories = [...new Set(items.map(i => i.category))];
  const uniqueOwners = [...new Set(items.map(i => i.belongsTo))].filter(o => o !== "shared");

  const handleDeleteLuggage = async () => {
    if (!confirm(`Delete "${luggage.name}" and all its items?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/packing/luggage/${luggage.id}`, { method: "DELETE" });
      onRefresh();
    } catch (error) {
      console.error("Error deleting luggage:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (itemData: { 
    name: string; 
    category: string; 
    quantity: number; 
    belongsTo: string; 
    importance: string 
  }) => {
    // Optimistic update
    const tempItem: PackingItem = {
      id: `temp-${Date.now()}`,
      ...itemData,
      weight: null,
      isPacked: false,
      notes: null,
      colorCode: null,
    };
    setItems(prev => [...prev, tempItem]);

    try {
      const res = await fetch("/api/packing/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          luggageId: luggage.id,
          ...itemData,
        }),
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems(prev => prev.map(i => i.id === tempItem.id ? newItem : i));
      }
    } catch (error) {
      console.error("Error adding item:", error);
      setItems(prev => prev.filter(i => i.id !== tempItem.id));
    }
  };

  const handleToggleItem = async (itemId: string, isPacked: boolean) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, isPacked: !isPacked } : i));
    
    try {
      await fetch(`/api/packing/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPacked: !isPacked }),
      });
    } catch (error) {
      console.error("Error toggling item:", error);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, isPacked } : i));
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<PackingItem>) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
    
    try {
      await fetch(`/api/packing/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Error updating item:", error);
      onRefresh();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    
    try {
      await fetch(`/api/packing/items/${itemId}`, { method: "DELETE" });
    } catch (error) {
      console.error("Error deleting item:", error);
      onRefresh();
    }
  };

  const handleDuplicateItem = async (item: PackingItem) => {
    const tempItem: PackingItem = {
      ...item,
      id: `temp-${Date.now()}`,
      isPacked: false,
    };
    setItems(prev => [...prev, tempItem]);

    try {
      const res = await fetch("/api/packing/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          luggageId: luggage.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          belongsTo: item.belongsTo,
          importance: item.importance,
          notes: item.notes,
        }),
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems(prev => prev.map(i => i.id === tempItem.id ? newItem : i));
      }
    } catch (error) {
      console.error("Error duplicating item:", error);
      setItems(prev => prev.filter(i => i.id !== tempItem.id));
    }
  };

  const handleMoveItem = async (itemId: string, targetLuggageId: string | null) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    
    try {
      await fetch(`/api/packing/items/${itemId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ luggageId: targetLuggageId }),
      });
      onRefresh();
    } catch (error) {
      console.error("Error moving item:", error);
      onRefresh();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);
    setItems(newItems);

    try {
      await fetch(`/api/packing/luggage/${luggage.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: newItems.map(item => item.id) }),
      });
    } catch (error) {
      console.error("Error reordering items:", error);
      setItems(luggage.items);
    }
  };

  const handlePackAll = async (category?: string) => {
    const targetItems = category 
      ? items.filter(i => i.category === category && !i.isPacked)
      : items.filter(i => !i.isPacked);
    
    setItems(prev => prev.map(i => 
      targetItems.some(t => t.id === i.id) ? { ...i, isPacked: true } : i
    ));

    try {
      await Promise.all(
        targetItems.map(item =>
          fetch(`/api/packing/items/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPacked: true }),
          })
        )
      );
    } catch (error) {
      console.error("Error packing items:", error);
      onRefresh();
    }
  };

  const handleUnpackAll = async () => {
    const packedItems = items.filter(i => i.isPacked);
    setItems(prev => prev.map(i => ({ ...i, isPacked: false })));

    try {
      await Promise.all(
        packedItems.map(item =>
          fetch(`/api/packing/items/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPacked: false }),
          })
        )
      );
    } catch (error) {
      console.error("Error unpacking items:", error);
      onRefresh();
    }
  };

  return (
    <div
      ref={setDropRef}
      className={`bg-white rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all overflow-hidden ${
        isOver ? "ring-2 ring-zinc-900 ring-offset-2" : ""
      }`}
    >
      {/* Header */}
      <div className={`p-5 ${colorStyle.bg}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorStyle.accent} text-white shadow-sm`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-lg">{luggage.name}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <span className="uppercase tracking-wider font-medium">{luggage.type}</span>
                {luggage.airtagName && (
                  <>
                    <span className="text-zinc-300">•</span>
                    <span className="flex items-center gap-1">📍 {luggage.airtagName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-white/50 rounded-xl transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteLuggage}
              disabled={loading}
              className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-2">
            <span>{packedCount} of {totalCount} packed</span>
            <span className={progress === 100 ? "text-emerald-600" : "text-zinc-800"}>
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-200/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress === 100 ? "bg-emerald-500" : colorStyle.accent
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/50">
        <QuickAddItem 
          onAdd={handleQuickAdd}
          locale={locale}
          placeholder={`Add to ${luggage.name}...`}
        />
      </div>

      {/* Filters & Actions */}
      {totalCount > 0 && (
        <div className="px-5 py-3 border-b border-zinc-100 flex flex-wrap items-center gap-2">
          {/* Owner filter pills */}
          <button
            onClick={() => setFilterOwner(filterOwner === null ? null : null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterOwner === null 
                ? "bg-zinc-900 text-white" 
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            All
          </button>
          {uniqueOwners.map(owner => (
            <button
              key={owner}
              onClick={() => setFilterOwner(filterOwner === owner ? null : owner)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterOwner === owner
                  ? owner === "baber" ? "bg-pink-500 text-white" : "bg-blue-500 text-white"
                  : owner === "baber" ? "bg-pink-50 text-pink-700" : "bg-blue-50 text-blue-700"
              }`}
            >
              {owner === "baber" ? t.baber : t.BABER}
            </button>
          ))}

          <div className="flex-1" />

          {/* Bulk actions */}
          <button
            onClick={() => handlePackAll()}
            disabled={packedCount === totalCount}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <CheckCheck className="w-3 h-3" />
            Pack All
          </button>
          <button
            onClick={handleUnpackAll}
            disabled={packedCount === 0}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      )}

      {/* Items List */}
      <div className="flex-1">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="px-4 py-3 max-h-[500px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">📦</div>
                <p className="text-zinc-500 text-sm font-medium">
                  {items.length === 0 
                    ? "No items yet" 
                    : "No items match the filter"
                  }
                </p>
                {items.length === 0 && (
                  <p className="text-zinc-400 text-xs mt-1">
                    Use the quick add above to start packing!
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {sortedCategories.map(category => {
                  const categoryItems = itemsByCategory[category];
                  const categoryPacked = categoryItems.filter(i => i.isPacked).length;
                  
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <span>{CATEGORY_ICONS[category] || "📦"}</span>
                          {t[category as keyof typeof t] || category}
                          <span className="text-zinc-300 font-normal">
                            {categoryPacked}/{categoryItems.length}
                          </span>
                        </h4>
                        {categoryPacked < categoryItems.length && (
                          <button
                            onClick={() => handlePackAll(category)}
                            className="text-[10px] font-medium text-zinc-400 hover:text-emerald-600 transition-colors"
                          >
                            Pack all
                          </button>
                        )}
                      </div>
                      
                      <SortableContext
                        items={categoryItems.map(item => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-1.5">
                          {categoryItems.map(item => (
                            <InlineEditableItem
                              key={item.id}
                              item={item}
                              onToggle={() => handleToggleItem(item.id, item.isPacked)}
                              onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                              onDelete={() => handleDeleteItem(item.id)}
                              onDuplicate={() => handleDuplicateItem(item)}
                              onMove={(targetId) => handleMoveItem(item.id, targetId)}
                              luggages={allLuggages.filter(l => l.id !== luggage.id)}
                              locale={locale}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DndContext>
      </div>
    </div>
  );
}

