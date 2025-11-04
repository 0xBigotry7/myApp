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
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate statistics
  const totalItems = luggages.reduce((sum, l) => sum + l.items.length, 0);
  const packedItems = luggages.reduce(
    (sum, l) => sum + l.items.filter((i) => i.isPacked).length,
    0
  );
  const totalWeight = luggages.reduce(
    (sum, l) =>
      sum +
      l.items.reduce((itemSum, i) => itemSum + ((i.weight || 0) * i.quantity), 0),
    0
  );
  const packingProgress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  const handleMoveItem = async (itemId: string, luggageId: string | null) => {
    try {
      await fetch(`/api/packing/items/${itemId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ luggageId }),
      });
      router.refresh();
    } catch (error) {
      console.error("Error moving item:", error);
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

    try {
      await fetch(`/api/packing/items/${itemId}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleToggleItem = async (itemId: string, isPacked: boolean) => {
    try {
      await fetch(`/api/packing/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPacked: !isPacked }),
      });
      router.refresh();
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const refreshData = () => {
    router.refresh();
  };

  // Search across all luggage
  const searchResults = searchQuery
    ? luggages.flatMap((luggage) =>
        luggage.items
          .filter(
            (item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            <p className="text-gray-600 mt-1">
              {t.organizeYourLuggage}
            </p>
          </div>
          <button
            onClick={handleAddLuggage}
            className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            + {t.addLuggage}
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-violet-600">
              {luggages.length}
            </div>
            <div className="text-sm text-gray-600">{t.luggage}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
            <div className="text-sm text-gray-600">{t.items}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-emerald-600">
              {packingProgress.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">{t.packed}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {totalWeight.toFixed(1)} kg
            </div>
            <div className="text-sm text-gray-600">{t.totalWeight}</div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalItems > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {t.overallProgress}
              </span>
              <span className="text-sm text-gray-600">
                {packedItems} / {totalItems} {t.items}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all"
                style={{ width: `${packingProgress}%` }}
              />
            </div>
          </div>
        )}

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
              onRefresh={refreshData}
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddLuggage && (
        <AddLuggageModal
          isOpen={showAddLuggage}
          onClose={() => setShowAddLuggage(false)}
          onSuccess={refreshData}
          existingCount={luggages.length}
          locale={locale}
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
          onSuccess={refreshData}
          locale={locale}
          userId={userId}
        />
      )}
    </div>
  );
}
