"use client";

import { useState } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";
import { Package, Plus, ChevronDown, ChevronUp, Trash2, Check, Box } from "lucide-react";

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
    if (isSelected) return "bg-zinc-100 ring-2 ring-zinc-400";
    if (item.belongsTo === "baber") return "bg-pink-50 text-pink-700 border-pink-100";
    if (item.belongsTo === "BABER") return "bg-blue-50 text-blue-700 border-blue-100";
    return "bg-white border-zinc-200 text-zinc-700";
  };

  return (
    <div
      className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${getBackgroundColor()}`}
      onClick={onSelect}
    >
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "bg-zinc-900 border-zinc-900" : "border-zinc-300 bg-white"}`}>
        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      
      {item.importance === "essential" && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Essential" />
      )}
      
      <span className="text-sm font-medium select-none">
        {item.name}
        {item.quantity > 1 && (
          <span className="text-xs opacity-60 ml-1">×{item.quantity}</span>
        )}
      </span>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-zinc-400 hover:text-red-600 transition-all"
      >
        <Trash2 className="w-3 h-3" />
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
    <div className="bg-zinc-50/50 border-2 border-dashed border-zinc-200 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border border-zinc-200 shadow-sm">
            <Package className="w-5 h-5 text-zinc-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              {t.unorganizedItems}
              <span className="ml-2 text-sm font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </h2>
            <p className="text-sm text-zinc-500">{t.itemsNotInLuggage}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm"
              >
                Move {selectedItems.length} to...
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showMoveMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-zinc-100 z-20 overflow-hidden py-1">
                  {luggages.map((luggage) => (
                    <button
                      key={luggage.id}
                      onClick={() => handleMoveToLuggage(luggage.id)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-zinc-700 hover:text-zinc-900 flex items-center gap-2"
                    >
                      <Box className="w-3.5 h-3.5 text-zinc-400" />
                      {luggage.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={onAddItem}
            className="px-3 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t.addItem}
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 uppercase tracking-wider px-2 py-1 hover:bg-zinc-100 rounded transition-colors"
          >
            {selectedItems.length === items.length ? "Deselect All" : "Select All"}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">📦</div>
          <p className="text-zinc-500 text-sm font-medium">No unorganized items</p>
          <p className="text-zinc-400 text-xs mt-1">Everything is packed in luggage!</p>
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
