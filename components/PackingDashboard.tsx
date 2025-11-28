"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddLuggageModal from "./AddLuggageModal";
import SimpleLuggageCard from "./packing/SimpleLuggageCard";
import FastAdd from "./packing/FastAdd";
import PackingTemplates from "./packing/PackingTemplates";
import { getTranslations, type Locale } from "@/lib/i18n";
import { 
  Plus, 
  Search, 
  Briefcase, 
  Package, 
  Check, 
  X, 
  Trash2,
  CheckCheck,
  PartyPopper,
  AlertCircle
} from "lucide-react";

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
  const [editingLuggage, setEditingLuggage] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnorganized, setSelectedUnorganized] = useState<string[]>([]);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  // Calculate statistics
  const totalLuggageItems = luggages.reduce((sum, l) => sum + l.items.length, 0);
  const packedLuggageItems = luggages.reduce(
    (sum, l) => sum + l.items.filter((i) => i.isPacked).length, 0
  );
  const totalItems = totalLuggageItems + unorganizedItems.length;
  const packedItems = packedLuggageItems + unorganizedItems.filter(i => i.isPacked).length;
  const packingProgress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  // Essential items not packed
  const essentialUnpacked = [
    ...luggages.flatMap(l => l.items.filter(i => i.importance === "essential" && !i.isPacked)),
    ...unorganizedItems.filter(i => i.importance === "essential" && !i.isPacked)
  ];

  // Search across all items
  const searchResults = searchQuery.trim()
    ? [
        ...luggages.flatMap((luggage) =>
          luggage.items
            .filter((item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.category.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((item) => ({ ...item, luggageName: luggage.name, luggageId: luggage.id }))
        ),
        ...unorganizedItems
          .filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((item) => ({ ...item, luggageName: "Unorganized", luggageId: null }))
      ]
    : [];

  const handleAddLuggage = () => {
    setShowAddLuggage(true);
  };

  const handleEditLuggage = (luggage: any) => {
    setEditingLuggage(luggage);
    setShowAddLuggage(true);
  };

  const handleLuggageAdded = (newLuggage: any) => {
    if (editingLuggage) {
      setLuggages(luggages.map((l) => (l.id === newLuggage.id ? newLuggage : l)));
      setEditingLuggage(null);
    } else {
      setLuggages([...luggages, newLuggage]);
    }
    refreshData();
  };

  const refreshData = () => {
    router.refresh();
  };

  // Template application handler
  const handleApplyTemplate = async (items: { name: string; category: string; quantity: number }[], owner: string) => {
    // If no luggage exists, create a default one first
    let targetLuggageId = luggages[0]?.id;
    
    if (!targetLuggageId) {
      // Create default luggage
      try {
        const res = await fetch("/api/packing/luggage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Main Luggage",
            type: "suitcase",
            color: "black",
            order: 0,
          }),
        });
        if (res.ok) {
          const newLuggage = await res.json();
          targetLuggageId = newLuggage.id;
          setLuggages([newLuggage]);
        }
      } catch (error) {
        console.error("Error creating luggage:", error);
        return;
      }
    }

    // Add all items to the first luggage
    try {
      await Promise.all(
        items.map(item =>
          fetch("/api/packing/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              luggageId: targetLuggageId,
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              belongsTo: owner,
              importance: "normal",
            }),
          })
        )
      );
      refreshData();
    } catch (error) {
      console.error("Error adding template items:", error);
    }
  };

  // Unorganized items handlers
  const handleQuickAddUnorganized = async (itemData: {
    name: string;
    category: string;
    quantity: number;
    belongsTo: string;
    importance: string;
  }) => {
    const tempItem: PackingItem = {
      id: `temp-${Date.now()}`,
      ...itemData,
      weight: null,
      isPacked: false,
      notes: null,
      photoUrl: null,
      tags: [],
      lastUsedDate: null,
      colorCode: null,
    };
    setUnorganizedItems(prev => [...prev, tempItem]);

    try {
      const res = await fetch("/api/packing/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          luggageId: null,
          ...itemData,
        }),
      });
      if (res.ok) {
        const newItem = await res.json();
        setUnorganizedItems(prev => prev.map(i => i.id === tempItem.id ? newItem : i));
      }
    } catch (error) {
      console.error("Error adding item:", error);
      setUnorganizedItems(prev => prev.filter(i => i.id !== tempItem.id));
    }
  };

  const handleToggleUnorganized = async (itemId: string) => {
    const item = unorganizedItems.find(i => i.id === itemId);
    if (!item) return;

    setUnorganizedItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, isPacked: !i.isPacked } : i
    ));

    try {
      await fetch(`/api/packing/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPacked: !item.isPacked }),
      });
    } catch (error) {
      console.error("Error toggling item:", error);
      refreshData();
    }
  };

  const handleDeleteUnorganized = async (itemId: string) => {
    setUnorganizedItems(prev => prev.filter(i => i.id !== itemId));

    try {
      await fetch(`/api/packing/items/${itemId}`, { method: "DELETE" });
    } catch (error) {
      console.error("Error deleting item:", error);
      refreshData();
    }
  };

  const handleMoveToLuggage = async (luggageId: string) => {
    const itemsToMove = selectedUnorganized;
    setUnorganizedItems(prev => prev.filter(i => !itemsToMove.includes(i.id)));
    setSelectedUnorganized([]);
    setShowMoveMenu(false);

    try {
      await Promise.all(
        itemsToMove.map(itemId =>
          fetch(`/api/packing/items/${itemId}/move`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ luggageId }),
          })
        )
      );
      refreshData();
    } catch (error) {
      console.error("Error moving items:", error);
      refreshData();
    }
  };

  const toggleSelectUnorganized = (itemId: string) => {
    setSelectedUnorganized(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 sm:p-3 bg-zinc-900 dark:bg-white rounded-2xl text-white dark:text-zinc-900">
              <Briefcase className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {t.packingHelper}
            </h1>
          </div>

          {/* Progress Bar - Only show if there are items */}
          {totalItems > 0 && (
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {packedItems} of {totalItems} packed
                </span>
                <span className={packingProgress === 100 ? "text-emerald-600" : "text-zinc-900 dark:text-white"}>
                  {packingProgress.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    packingProgress === 100 ? "bg-emerald-500" : "bg-zinc-900 dark:bg-white"
                  }`}
                  style={{ width: `${packingProgress}%` }}
                />
              </div>
              {packingProgress === 100 && (
                <p className="text-emerald-600 text-sm font-medium mt-2 flex items-center gap-2">
                  <PartyPopper className="w-4 h-4" />
                  All packed! Ready to go ✈️
                </p>
              )}
              {essentialUnpacked.length > 0 && packingProgress < 100 && (
                <p className="text-amber-600 text-xs font-medium mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {essentialUnpacked.length} essential item{essentialUnpacked.length > 1 ? "s" : ""} not packed yet
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleAddLuggage}
          className="flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          {t.addLuggage}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchItemsAcrossLuggage}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="absolute top-full mt-2 w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 max-h-80 overflow-y-auto z-20">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">No items found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${result.isPacked ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
                      <div>
                        <p className={`text-sm font-medium ${result.isPacked ? "text-zinc-400 dark:text-zinc-500 line-through" : "text-zinc-900 dark:text-white"}`}>
                          {result.name}
                          {result.quantity > 1 && <span className="text-zinc-400 dark:text-zinc-500 ml-1">×{result.quantity}</span>}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{result.luggageName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Templates - Only show if user has no items yet */}
      {totalItems === 0 && (
        <PackingTemplates onApplyTemplate={handleApplyTemplate} locale={locale} />
      )}

      {/* Unorganized Items Section */}
      {unorganizedItems.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-3xl p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl border border-amber-200 dark:border-amber-700 shadow-sm">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  {t.unorganizedItems}
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                    {unorganizedItems.length}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">{t.itemsNotInLuggage}</p>
              </div>
            </div>

            {selectedUnorganized.length > 0 && luggages.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMoveMenu(!showMoveMenu)}
                  className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  Move {selectedUnorganized.length} to...
                </button>
                {showMoveMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-700 z-20 py-1">
                    {luggages.map((luggage) => (
                      <button
                        key={luggage.id}
                        onClick={() => handleMoveToLuggage(luggage.id)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-zinc-700 dark:text-zinc-200"
                      >
                        🧳 {luggage.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Unorganized Items List - Compact chips */}
          <div className="flex flex-wrap gap-2">
            {unorganizedItems.map((item) => {
              const isSelected = selectedUnorganized.includes(item.id);
              const ownerStyle = 
                item.belongsTo === "baber" ? "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800" :
                item.belongsTo === "BABER" ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" :
                "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700";
              
              return (
                <div
                  key={item.id}
                  className={`group inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    isSelected ? "ring-2 ring-zinc-900 dark:ring-white ring-offset-1 dark:ring-offset-zinc-900" : ""
                  } ${item.isPacked ? "opacity-50" : ""} ${ownerStyle}`}
                >
                  {/* Selection checkbox (only if there are luggages to move to) */}
                  {luggages.length > 0 && (
                    <button
                      onClick={() => toggleSelectUnorganized(item.id)}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                        isSelected ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white" : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500"
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white dark:text-zinc-900" />}
                    </button>
                  )}

                  {/* Pack toggle */}
                  <button
                    onClick={() => handleToggleUnorganized(item.id)}
                    className="shrink-0"
                  >
                    {item.isPacked ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500" />
                    )}
                  </button>

                  {item.importance === "essential" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  )}

                  <span className={`text-sm font-medium ${item.isPacked ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"}`}>
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="text-xs opacity-60 ml-1">×{item.quantity}</span>
                    )}
                  </span>

                  <button
                    onClick={() => handleDeleteUnorganized(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-zinc-400 hover:text-red-600 transition-all shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick add for unorganized */}
          <div className="mt-4">
            <FastAdd
              onAdd={handleQuickAddUnorganized}
              locale={locale}
              placeholder="Add item to organize later..."
            />
          </div>
        </div>
      )}

      {/* Luggage Grid */}
      {luggages.length === 0 ? (
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-10 sm:p-16 text-center">
          <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-zinc-100 dark:border-zinc-700">
            <Briefcase className="w-9 h-9 text-zinc-300 dark:text-zinc-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">{t.noLuggageYet}</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">{t.addYourFirstLuggage}</p>
          
          {/* Templates for empty state */}
          {totalItems === 0 && (
            <div className="mb-6">
              <PackingTemplates onApplyTemplate={handleApplyTemplate} locale={locale} />
            </div>
          )}
          
          <button
            onClick={handleAddLuggage}
            className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg active:scale-95"
          >
            {t.addFirstLuggage}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {luggages.map((luggage) => (
            <SimpleLuggageCard
              key={luggage.id}
              luggage={luggage}
              onEdit={() => handleEditLuggage(luggage)}
              onRefresh={refreshData}
              locale={locale}
              userId={userId}
            />
          ))}
        </div>
      )}

      {/* Add Luggage Modal */}
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
    </div>
  );
}

