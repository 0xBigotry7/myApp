"use client";

import { useState } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";

interface PackingItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  weight: number | null;
  isPacked: boolean;
  belongsTo: string;
  colorCode: string | null;
  importance: string;
  notes: string | null;
}

interface Luggage {
  id: string;
  name: string;
}

interface UnorganizedItemsProps {
  items: PackingItem[];
  luggages: Luggage[];
  locale: Locale;
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
  onMoveItem: (itemId: string, luggageId: string | null) => void;
}

function ItemCard({
  item,
  isSelected,
  onSelect,
  onDelete
}: {
  item: PackingItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  // Get background color based on belongsTo
  const getBackgroundColor = () => {
    if (isSelected) return "bg-violet-50";
    if (item.belongsTo === "baber") return "bg-pink-50"; // Light pink for baber
    if (item.belongsTo === "BABER") return "bg-blue-50"; // Light blue for BABER
    return "bg-white"; // White for shared
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border-2 transition-all group max-w-fit ${
        isSelected ? "border-violet-500" : "border-gray-200 hover:border-gray-300"
      } ${getBackgroundColor()}`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="w-3 h-3 text-violet-600 rounded cursor-pointer"
      />
      {item.importance && item.importance !== "normal" && (
        <span className="text-[10px] flex-shrink-0 leading-none" title={item.importance}>
          {item.importance === "essential" && "🔴"}
          {item.importance === "important" && "🟠"}
          {item.importance === "optional" && "⚪"}
        </span>
      )}
      <span className="flex-1 text-xs text-gray-700">
        {item.name}
        {item.quantity > 1 && (
          <span className="text-[10px] text-gray-500 ml-0.5">×{item.quantity}</span>
        )}
      </span>
      <span className="text-[10px] text-gray-400 capitalize px-1.5 py-0.5 bg-gray-100 rounded">{item.category}</span>
      {item.weight && (
        <span className="text-[10px] text-gray-400">
          {(item.weight * item.quantity).toFixed(1)}kg
        </span>
      )}
      <button
        onClick={onDelete}
        className="sm:opacity-0 sm:group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs transition-opacity ml-1"
      >
        🗑️
      </button>
    </div>
  );
}

export default function UnorganizedItems({
  items,
  luggages,
  locale,
  onAddItem,
  onDeleteItem,
  onMoveItem,
}: UnorganizedItemsProps) {
  const t = getTranslations(locale);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const handleSelectItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((i) => i.id));
    }
  };

  const handleMoveToLuggage = async (luggageId: string) => {
    for (const itemId of selectedItems) {
      await onMoveItem(itemId, luggageId);
    }
    setSelectedItems([]);
    setShowMoveMenu(false);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-dashed border-gray-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            📦 {t.unorganizedItems}
            <span className="text-sm font-normal text-gray-500">
              ({items.length})
            </span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">{t.itemsNotInLuggage}</p>
        </div>
        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                className="px-3 py-2 bg-violet-500 text-white rounded-xl text-xs font-semibold hover:bg-violet-600 transition-colors"
              >
                Move {selectedItems.length} to...
              </button>
              {showMoveMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10 max-h-64 overflow-y-auto">
                  {luggages.map((luggage) => (
                    <button
                      key={luggage.id}
                      onClick={() => handleMoveToLuggage(luggage.id)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-violet-50 transition-colors"
                    >
                      {luggage.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={onAddItem}
            className="px-4 py-2 bg-violet-500 text-white rounded-xl text-xs font-semibold hover:bg-violet-600 transition-colors"
          >
            + {t.addItem}
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-3">
          <button
            onClick={handleSelectAll}
            className="text-xs text-violet-600 hover:text-violet-700 font-semibold"
          >
            {selectedItems.length === items.length ? "Deselect All" : "Select All"}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-1">📦</div>
          <p className="text-xs">No unorganized items</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onSelect={() => handleSelectItem(item.id)}
              onDelete={() => onDeleteItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
