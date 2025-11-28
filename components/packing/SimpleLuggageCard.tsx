"use client";

import { useState, useEffect } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";
import FastAdd from "./FastAdd";
import SimplePackingItem from "./SimplePackingItem";
import { 
  Edit2, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Briefcase,
  Backpack,
  Package,
  Gift,
  Luggage,
  CheckCheck,
  RotateCcw,
  Users
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

interface SimpleLuggageCardProps {
  luggage: LuggageType;
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

const COLOR_STYLES: Record<string, { bg: string; accent: string; border: string }> = {
  red: { bg: "bg-red-50 dark:bg-red-950/30", accent: "bg-red-500", border: "border-red-200 dark:border-red-900" },
  blue: { bg: "bg-blue-50 dark:bg-blue-950/30", accent: "bg-blue-500", border: "border-blue-200 dark:border-blue-900" },
  green: { bg: "bg-emerald-50 dark:bg-emerald-950/30", accent: "bg-emerald-500", border: "border-emerald-200 dark:border-emerald-900" },
  yellow: { bg: "bg-amber-50 dark:bg-amber-950/30", accent: "bg-amber-500", border: "border-amber-200 dark:border-amber-900" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/30", accent: "bg-purple-500", border: "border-purple-200 dark:border-purple-900" },
  pink: { bg: "bg-pink-50 dark:bg-pink-950/30", accent: "bg-pink-500", border: "border-pink-200 dark:border-pink-900" },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/30", accent: "bg-orange-500", border: "border-orange-200 dark:border-orange-900" },
  gray: { bg: "bg-zinc-100 dark:bg-zinc-800", accent: "bg-zinc-500", border: "border-zinc-200 dark:border-zinc-700" },
  black: { bg: "bg-zinc-800 dark:bg-zinc-900", accent: "bg-zinc-900 dark:bg-zinc-700", border: "border-zinc-700 dark:border-zinc-600" },
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

export default function SimpleLuggageCard({ 
  luggage, 
  onEdit, 
  onRefresh, 
  locale, 
  userId 
}: SimpleLuggageCardProps) {
  const t = getTranslations(locale);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(luggage.items);
  const [filterOwner, setFilterOwner] = useState<string | null>(null);
  const [showUnpacked, setShowUnpacked] = useState(true);

  useEffect(() => {
    setItems(luggage.items);
  }, [luggage.items]);

  const colorStyle = COLOR_STYLES[luggage.color] || COLOR_STYLES.gray;
  const Icon = LUGGAGE_ICONS[luggage.type] || LUGGAGE_ICONS.other;
  const isBlack = luggage.color === "black";

  // Filter items
  const filteredItems = items.filter(item => {
    if (filterOwner && item.belongsTo !== filterOwner) return false;
    if (!showUnpacked && !item.isPacked) return false;
    return true;
  });

  // Group by category
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

  // Stats
  const packedCount = items.filter(i => i.isPacked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;
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

  const handleToggleItem = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setItems(prev => prev.map(i => i.id === itemId ? { ...i, isPacked: !i.isPacked } : i));
    
    try {
      await fetch(`/api/packing/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPacked: !item.isPacked }),
      });
    } catch (error) {
      console.error("Error toggling item:", error);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, isPacked: item.isPacked } : i));
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

  const handlePackAll = async () => {
    const unpackedItems = items.filter(i => !i.isPacked);
    setItems(prev => prev.map(i => ({ ...i, isPacked: true })));

    try {
      await Promise.all(
        unpackedItems.map(item =>
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
    <div className={`bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm overflow-hidden ${colorStyle.border}`}>
      {/* Compact Header */}
      <div className={`${colorStyle.bg} ${isBlack ? "text-white" : ""}`}>
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${colorStyle.accent} text-white shadow-sm`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${isBlack ? "text-white" : "text-zinc-900 dark:text-white"}`}>
                  {luggage.name}
                </h3>
                <div className={`flex items-center gap-2 text-xs ${isBlack ? "text-zinc-300" : "text-zinc-500 dark:text-zinc-400"}`}>
                  <span className="uppercase tracking-wider font-medium">{luggage.type}</span>
                  {luggage.airtagName && (
                    <>
                      <span className={isBlack ? "text-zinc-500" : "text-zinc-300 dark:text-zinc-600"}>•</span>
                      <span className="flex items-center gap-1">📍 {luggage.airtagName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className={`p-2 rounded-xl transition-colors ${
                  isBlack 
                    ? "text-zinc-400 hover:text-white hover:bg-white/10" 
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
                }`}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteLuggage}
                disabled={loading}
                className={`p-2 rounded-xl transition-colors ${
                  isBlack 
                    ? "text-zinc-400 hover:text-red-400 hover:bg-red-500/10" 
                    : "text-zinc-500 hover:text-red-600 hover:bg-red-50"
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className={`flex items-center justify-between text-xs font-bold mb-1.5 ${
              isBlack ? "text-zinc-300" : "text-zinc-600"
            }`}>
              <span>{packedCount} / {totalCount} packed</span>
              <span className={progress === 100 ? "text-emerald-400" : ""}>
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className={`h-2 w-full rounded-full overflow-hidden ${
              isBlack ? "bg-zinc-700" : "bg-white/60"
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress === 100 ? "bg-emerald-500" : isBlack ? "bg-white" : colorStyle.accent
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800">
        <FastAdd 
          onAdd={handleQuickAdd}
          locale={locale}
          placeholder={`Add to ${luggage.name}...`}
          luggageName={luggage.name}
        />
      </div>

      {/* Filters & Actions - Simplified */}
      {totalCount > 0 && (
        <div className="px-3 sm:px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto">
          {/* Owner filter - only show if there are items from different owners */}
          {uniqueOwners.length > 0 && (
            <>
              <button
                onClick={() => setFilterOwner(null)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                  filterOwner === null 
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                All
              </button>
              {uniqueOwners.includes("baber") && (
                <button
                  onClick={() => setFilterOwner(filterOwner === "baber" ? null : "baber")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    filterOwner === "baber"
                      ? "bg-pink-500 text-white"
                      : "bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                  }`}
                >
                  {t.baber}
                </button>
              )}
              {uniqueOwners.includes("BABER") && (
                <button
                  onClick={() => setFilterOwner(filterOwner === "BABER" ? null : "BABER")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    filterOwner === "BABER"
                      ? "bg-blue-500 text-white"
                      : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  }`}
                >
                  {t.BABER}
                </button>
              )}
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
            </>
          )}

          <div className="flex-1" />

          {/* Bulk actions */}
          <button
            onClick={handlePackAll}
            disabled={packedCount === totalCount}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pack All</span>
          </button>
          <button
            onClick={handleUnpackAll}
            disabled={packedCount === 0}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      )}

      {/* Items List */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <span>{filteredItems.length} items</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <div className="px-2 sm:px-3 pb-3 max-h-[500px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📦</div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                  {items.length === 0 ? "No items yet" : "No items match the filter"}
                </p>
                {items.length === 0 && (
                  <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">
                    Use the quick add above to start!
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedCategories.map(category => {
                  const categoryItems = itemsByCategory[category];
                  const categoryPacked = categoryItems.filter(i => i.isPacked).length;
                  
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <h4 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <span>{CATEGORY_ICONS[category] || "📦"}</span>
                          {t[category as keyof typeof t] || category}
                        </h4>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                          {categoryPacked}/{categoryItems.length}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {categoryItems.map(item => (
                          <SimplePackingItem
                            key={item.id}
                            item={item}
                            onToggle={() => handleToggleItem(item.id)}
                            onDelete={() => handleDeleteItem(item.id)}
                            onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

