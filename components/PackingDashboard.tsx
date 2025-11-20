"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LuggageCard from "./LuggageCard";
import AddLuggageModal from "./AddLuggageModal";
import AddItemModal from "./AddItemModal";
import SearchItems from "./SearchItems";
import UnorganizedItems from "./UnorganizedItems";
import { getTranslations, type Locale } from "@/lib/i18n";
import { Plus, Search, Briefcase, CheckCircle2, Circle } from "lucide-react";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-4 flex items-center gap-3">
            <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-900" />
            {t.packingHelper}
          </h1>
          
          {/* Progress Bar */}
          {totalItems > 0 && (
            <div className="w-full md:w-96">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-zinc-500">{packedItems} of {totalItems} packed</span>
                <span className="text-zinc-900">{packingProgress.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-900 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${packingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleAddLuggage}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-semibold hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          {t.addLuggage}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-10 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-zinc-50 to-transparent pointer-events-none" />
        
        <div className="w-full">
            <SearchItems
              query={searchQuery}
              onChange={setSearchQuery}
              results={searchResults}
              locale={locale}
            />
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-10">
        {/* Unorganized Items Section */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-1">
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
          <div className="bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 p-16 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-zinc-100">
              <Briefcase className="w-8 h-8 text-zinc-300" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">
              {t.noLuggageYet}
            </h2>
            <p className="text-zinc-500 mb-8 max-w-md mx-auto">
              {t.addYourFirstLuggage}
            </p>
            <button
              onClick={handleAddLuggage}
              className="px-8 py-3 bg-white border-2 border-zinc-200 text-zinc-900 rounded-xl font-semibold hover:border-zinc-900 hover:bg-zinc-50 transition-all"
            >
              {t.addFirstLuggage}
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
      </div>

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
