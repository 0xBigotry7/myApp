"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LuggageCard from "./LuggageCard";
import AddLuggageModal from "./AddLuggageModal";
import AddItemModal from "./AddItemModal";
import SearchItems from "./SearchItems";
import UnorganizedItems from "./UnorganizedItems";
import { getTranslations, type Locale } from "@/lib/i18n";

interface PackingItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  weight: number | null;
  isPacked: boolean;
  notes: string | null;
  photoUrl: string | null;
  tags: string[];
  lastUsedDate: Date | null;
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
  order: number;
  items: PackingItem[];
}

interface PackingTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string[];
  items: any;
  useCount: number;
}

interface PackingDashboardProps {
  luggages: Luggage[];
  unorganizedItems: PackingItem[];
  templates: PackingTemplate[];
  userEmail: string;
  userId: string;
  locale: Locale;
}

export default function PackingDashboard({
  luggages: initialLuggages,
  unorganizedItems: initialUnorganizedItems,
  templates,
  userEmail,
  userId,
  locale,
}: PackingDashboardProps) {
  const router = useRouter();
  const t = getTranslations(locale);
  const [luggages, setLuggages] = useState(initialLuggages);
  const [unorganizedItems, setUnorganizedItems] = useState(initialUnorganizedItems);
  const [showAddLuggage, setShowAddLuggage] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedLuggage, setSelectedLuggage] = useState<string | null>(null);
  const [editingLuggage, setEditingLuggage] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate statistics
  const totalItems = luggages.reduce((sum, l) => sum + l.items.length, 0);
  const packedItems = luggages.reduce(
    (sum, l) => sum + l.items.filter((i) => i.isPacked).length,
    0
  );
  const packingProgress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  const handleMoveItem = async (itemId: string, luggageId: string | null) => {
    // Find the item in unorganized or luggage
    let item = unorganizedItems.find((i) => i.id === itemId);
    let sourceLuggageId: string | null = null;

    if (!item) {
      // Search in luggage
      for (const luggage of luggages) {
        item = luggage.items.find((i) => i.id === itemId);
        if (item) {
          sourceLuggageId = luggage.id;
          break;
        }
      }
    }

    if (!item) return;

    // Optimistic update: move item immediately
    if (sourceLuggageId) {
      // Move from luggage
      setLuggages(
        luggages.map((l) => {
          if (l.id === sourceLuggageId) {
            return { ...l, items: l.items.filter((i) => i.id !== itemId) };
          }
          if (l.id === luggageId) {
            return { ...l, items: [...l.items, item!] };
          }
          return l;
        })
      );
      if (!luggageId) {
        // Moving to unorganized
        setUnorganizedItems([...unorganizedItems, item]);
      }
    } else {
      // Move from unorganized
      setUnorganizedItems(unorganizedItems.filter((i) => i.id !== itemId));
      if (luggageId) {
        setLuggages(
          luggages.map((l) =>
            l.id === luggageId ? { ...l, items: [...l.items, item!] } : l
          )
        );
      }
    }

    try {
      await fetch(`/api/packing/items/${itemId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ luggageId }),
      });
    } catch (error) {
      console.error("Error moving item:", error);
      // Revert on error
      router.refresh();
    }
  };

  const handleAddLuggage = () => {
    setShowAddLuggage(true);
  };

  const handleAddItem = (luggageId: string) => {
    setSelectedLuggage(luggageId);
    setShowAddItem(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    // Optimistic update: remove item immediately
    setUnorganizedItems(unorganizedItems.filter((i) => i.id !== itemId));
    setLuggages(
      luggages.map((l) => ({
        ...l,
        items: l.items.filter((i) => i.id !== itemId),
      }))
    );

    try {
      await fetch(`/api/packing/items/${itemId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      // Revert on error
      router.refresh();
    }
  };

  const handleToggleItem = async (itemId: string, isPacked: boolean) => {
    // Optimistic update: toggle immediately in both luggage and unorganized
    setLuggages(
      luggages.map((l) => ({
        ...l,
        items: l.items.map((i) =>
          i.id === itemId ? { ...i, isPacked: !isPacked } : i
        ),
      }))
    );
    setUnorganizedItems(
      unorganizedItems.map((i) =>
        i.id === itemId ? { ...i, isPacked: !isPacked } : i
      )
    );

    try {
      await fetch(`/api/packing/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPacked: !isPacked }),
      });
    } catch (error) {
      console.error("Error toggling item:", error);
      // Revert on error
      router.refresh();
    }
  };

  const refreshData = () => {
    router.refresh();
  };

  const handleLuggageAdded = (newLuggage: any) => {
    if (editingLuggage) {
      // Update existing luggage
      setLuggages(luggages.map((l) => (l.id === newLuggage.id ? newLuggage : l)));
      setEditingLuggage(null);
    } else {
      // Add new luggage
      setLuggages([...luggages, newLuggage]);
    }
    // Also refresh to get server state
    refreshData();
  };

  const handleEditLuggage = (luggage: any) => {
    setEditingLuggage(luggage);
    setShowAddLuggage(true);
  };

  const handleItemAdded = (newItem: any) => {
    // Optimistic update: immediately add to UI
    if (selectedLuggage) {
      // Add to specific luggage
      setLuggages(
        luggages.map((l) =>
          l.id === selectedLuggage
            ? { ...l, items: [...l.items, newItem] }
            : l
        )
      );
    } else {
      // Add to unorganized items
      setUnorganizedItems([...unorganizedItems, newItem]);
    }
  };

  // Search across all luggage
  const searchResults = searchQuery
    ? luggages.flatMap((luggage) =>
        luggage.items
          .filter(
            (item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
              item.tags.some((tag) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase())
              )
          )
          .map((item) => ({ ...item, luggageName: luggage.name, luggageColor: luggage.color }))
      )
    : [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              🧳 {t.packingHelper}
            </h1>
          </div>
          <button
            onClick={handleAddLuggage}
            className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            + {t.addLuggage}
          </button>
        </div>

        {/* Search */}
        <div className="mt-6">
          <SearchItems
            query={searchQuery}
            onChange={setSearchQuery}
            results={searchResults}
            locale={locale}
          />
        </div>
      </div>

      {/* Unorganized Items */}
      <div className="mb-6">
        <UnorganizedItems
          items={unorganizedItems}
          luggages={luggages}
          locale={locale}
          onAddItem={() => {
            setSelectedLuggage(null);
            setShowAddItem(true);
          }}
          onDeleteItem={handleDeleteItem}
          onMoveItem={handleMoveItem}
        />
      </div>

      {/* Luggage Grid */}
      {luggages.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">🧳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t.noLuggageYet}
          </h2>
          <p className="text-gray-600 mb-6">
            {t.addYourFirstLuggage}
          </p>
          <button
            onClick={handleAddLuggage}
            className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            + {t.addFirstLuggage}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {luggages.map((luggage) => (
            <LuggageCard
              key={luggage.id}
              luggage={luggage}
              onAddItem={() => handleAddItem(luggage.id)}
              onEdit={() => handleEditLuggage(luggage)}
              onRefresh={refreshData}
              onToggleItem={handleToggleItem}
              onRemoveFromLuggage={(itemId) => handleMoveItem(itemId, null)}
              locale={locale}
              userId={userId}
            />
          ))}
        </div>
      )}

      {/* Compact Stats at Bottom */}
      {totalItems > 0 && (
        <div className="mt-8 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-gray-600">
                <span className="font-semibold text-violet-600">{luggages.length}</span> {t.luggage}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">
                <span className="font-semibold text-blue-600">{totalItems}</span> {t.items}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">
                <span className="font-semibold text-emerald-600">{packedItems}</span> packed
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${packingProgress}%` }}
                />
              </div>
              <span className="font-semibold text-emerald-600 min-w-[3rem] text-right">
                {packingProgress.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddLuggage && (
        <AddLuggageModal
          isOpen={showAddLuggage}
          onClose={() => {
            setShowAddLuggage(false);
            setEditingLuggage(null);
          }}
          onSuccess={handleLuggageAdded}
          existingCount={luggages.length}
          editLuggage={editingLuggage}
        />
      )}

      {showAddItem && (
        <AddItemModal
          isOpen={showAddItem}
          onClose={() => {
            setShowAddItem(false);
            setSelectedLuggage(null);
          }}
          luggageId={selectedLuggage}
          onSuccess={handleItemAdded}
          locale={locale}
          userId={userId}
        />
      )}
    </div>
  );
}
