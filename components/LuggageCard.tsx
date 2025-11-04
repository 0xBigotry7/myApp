"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PackingItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  weight: number | null;
  isPacked: boolean;
  notes: string | null;
}

interface Luggage {
  id: string;
  name: string;
  type: string;
  color: string;
  weight: number | null;
  maxWeight: number | null;
  description: string | null;
  items: PackingItem[];
}

interface LuggageCardProps {
  luggage: Luggage;
  onAddItem: () => void;
  onRefresh: () => void;
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

export default function LuggageCard({ luggage, onAddItem, onRefresh }: LuggageCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const packedCount = luggage.items.filter((i) => i.isPacked).length;
  const totalCount = luggage.items.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;
  const totalWeight = luggage.items.reduce(
    (sum, item) => sum + ((item.weight || 0) * item.quantity),
    0
  );

  const colorClass = COLOR_CLASSES[luggage.color] || COLOR_CLASSES.gray;
  const icon = LUGGAGE_ICONS[luggage.type] || LUGGAGE_ICONS.other;

  const handleToggleItem = async (itemId: string, isPacked: boolean) => {
    try {
      const res = await fetch(`/api/packing/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPacked: !isPacked }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Delete this item?")) return;

    try {
      const res = await fetch(`/api/packing/items/${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

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

  // Group items by category
  const itemsByCategory = luggage.items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colorClass} p-4 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{icon}</div>
            <div>
              <h3 className="font-bold text-lg">{luggage.name}</h3>
              <p className="text-sm opacity-90 capitalize">{luggage.type}</p>
            </div>
          </div>
          <button
            onClick={handleDeleteLuggage}
            disabled={loading}
            className="text-white/80 hover:text-white transition-colors"
          >
            🗑️
          </button>
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
            <span>{expanded ? "▼" : "▶"} Items ({totalCount})</span>
          </button>
          <button
            onClick={onAddItem}
            className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold hover:bg-violet-200 transition-colors"
          >
            + Add Item
          </button>
        </div>

        {expanded && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {totalCount === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">
                No items yet. Add your first item!
              </p>
            ) : (
              Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="border-l-2 border-gray-200 pl-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 group"
                      >
                        <input
                          type="checkbox"
                          checked={item.isPacked}
                          onChange={() => handleToggleItem(item.id, item.isPacked)}
                          className="w-4 h-4 text-violet-600 rounded cursor-pointer"
                        />
                        <span
                          className={`flex-1 text-sm ${
                            item.isPacked
                              ? "line-through text-gray-400"
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
                          onClick={() => handleDeleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
