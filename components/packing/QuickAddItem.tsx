"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Sparkles, Tag, User, Users } from "lucide-react";
import { getTranslations, type Locale } from "@/lib/i18n";

interface QuickAddItemProps {
  onAdd: (item: { name: string; category: string; quantity: number; belongsTo: string; importance: string }) => void;
  locale: Locale;
  placeholder?: string;
  autoFocus?: boolean;
}

const COMMON_ITEMS: Record<string, { name: string; icon: string; category: string }[]> = {
  documents: [
    { name: "Passport", icon: "🛂", category: "documents" },
    { name: "ID Card", icon: "💳", category: "documents" },
    { name: "Boarding Pass", icon: "🎫", category: "documents" },
    { name: "Travel Insurance", icon: "📋", category: "documents" },
    { name: "Visa", icon: "📄", category: "documents" },
    { name: "Hotel Confirmation", icon: "🏨", category: "documents" },
  ],
  electronics: [
    { name: "Phone", icon: "📱", category: "electronics" },
    { name: "Laptop", icon: "💻", category: "electronics" },
    { name: "iPad", icon: "📱", category: "electronics" },
    { name: "Kindle", icon: "📖", category: "electronics" },
    { name: "Camera", icon: "📷", category: "electronics" },
    { name: "Headphones", icon: "🎧", category: "electronics" },
    { name: "AirPods", icon: "🎵", category: "electronics" },
  ],
  charging: [
    { name: "Phone Charger", icon: "🔌", category: "charging" },
    { name: "Laptop Charger", icon: "🔌", category: "charging" },
    { name: "Power Bank", icon: "🔋", category: "charging" },
    { name: "USB Cable", icon: "🔌", category: "charging" },
    { name: "Travel Adapter", icon: "🔌", category: "charging" },
  ],
  clothing: [
    { name: "T-Shirts", icon: "👕", category: "clothing" },
    { name: "Pants", icon: "👖", category: "clothing" },
    { name: "Underwear", icon: "🩲", category: "clothing" },
    { name: "Socks", icon: "🧦", category: "clothing" },
    { name: "Jacket", icon: "🧥", category: "clothing" },
    { name: "Sweater", icon: "🧶", category: "clothing" },
    { name: "Dress", icon: "👗", category: "clothing" },
    { name: "Pajamas", icon: "👚", category: "clothing" },
    { name: "Swimwear", icon: "👙", category: "clothing" },
  ],
  toiletries: [
    { name: "Toothbrush", icon: "🪥", category: "toiletries" },
    { name: "Toothpaste", icon: "🦷", category: "toiletries" },
    { name: "Shampoo", icon: "🧴", category: "toiletries" },
    { name: "Conditioner", icon: "🧴", category: "toiletries" },
    { name: "Body Wash", icon: "🧼", category: "toiletries" },
    { name: "Deodorant", icon: "🫧", category: "toiletries" },
    { name: "Razor", icon: "🪒", category: "toiletries" },
    { name: "Sunscreen", icon: "☀️", category: "toiletries" },
  ],
  cosmetics: [
    { name: "Moisturizer", icon: "💧", category: "cosmetics" },
    { name: "Makeup", icon: "💄", category: "cosmetics" },
    { name: "Lip Balm", icon: "💋", category: "cosmetics" },
    { name: "Perfume", icon: "🌸", category: "cosmetics" },
    { name: "Skincare", icon: "✨", category: "cosmetics" },
  ],
  shoes: [
    { name: "Sneakers", icon: "👟", category: "shoes" },
    { name: "Sandals", icon: "🩴", category: "shoes" },
    { name: "Dress Shoes", icon: "👞", category: "shoes" },
    { name: "Slippers", icon: "🥿", category: "shoes" },
  ],
  accessories: [
    { name: "Sunglasses", icon: "🕶️", category: "accessories" },
    { name: "Watch", icon: "⌚", category: "accessories" },
    { name: "Belt", icon: "🔗", category: "accessories" },
    { name: "Hat", icon: "🧢", category: "accessories" },
    { name: "Umbrella", icon: "☂️", category: "accessories" },
    { name: "Wallet", icon: "👛", category: "accessories" },
  ],
  medications: [
    { name: "Pain Relief", icon: "💊", category: "medications" },
    { name: "Vitamins", icon: "💊", category: "medications" },
    { name: "First Aid Kit", icon: "🩹", category: "medications" },
    { name: "Prescription Meds", icon: "💊", category: "medications" },
    { name: "Hand Sanitizer", icon: "🧴", category: "medications" },
  ],
  other: [
    { name: "Book", icon: "📚", category: "other" },
    { name: "Snacks", icon: "🍿", category: "food" },
    { name: "Water Bottle", icon: "🧴", category: "other" },
    { name: "Travel Pillow", icon: "💤", category: "other" },
    { name: "Eye Mask", icon: "😴", category: "other" },
    { name: "Earplugs", icon: "👂", category: "other" },
  ],
};

const ALL_COMMON_ITEMS = Object.values(COMMON_ITEMS).flat();

export default function QuickAddItem({ onAdd, locale, placeholder, autoFocus }: QuickAddItemProps) {
  const t = getTranslations(locale);
  const [value, setValue] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<"shared" | "baber" | "BABER">("shared");
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = value.length > 0
    ? ALL_COMMON_ITEMS.filter(item => 
        item.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6)
    : ALL_COMMON_ITEMS.slice(0, 8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    // Try to match with a common item for category
    const matchedItem = ALL_COMMON_ITEMS.find(
      item => item.name.toLowerCase() === value.toLowerCase()
    );

    onAdd({
      name: value.trim(),
      category: matchedItem?.category || "other",
      quantity,
      belongsTo: selectedOwner,
      importance: "normal",
    });

    setValue("");
    setQuantity(1);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (item: typeof ALL_COMMON_ITEMS[0]) => {
    onAdd({
      name: item.name,
      category: item.category,
      quantity,
      belongsTo: selectedOwner,
      importance: "normal",
    });
    setValue("");
    setQuantity(1);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 bg-white border-2 border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-zinc-900 focus-within:shadow-lg transition-all">
          <Plus className="w-5 h-5 text-zinc-400 shrink-0" />
          
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder || "Type to add item... (Enter to add)"}
            className="flex-1 outline-none text-zinc-900 placeholder:text-zinc-400 bg-transparent text-sm"
          />

          {/* Quantity */}
          <div className="flex items-center gap-1 border-l border-zinc-200 pl-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-medium text-zinc-700">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              +
            </button>
          </div>

          {/* Owner Toggle */}
          <div className="flex items-center gap-1 border-l border-zinc-200 pl-3">
            <button
              type="button"
              onClick={() => setSelectedOwner("shared")}
              className={`p-1.5 rounded-lg transition-all ${selectedOwner === "shared" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
              title="Shared"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedOwner("baber")}
              className={`p-1.5 rounded-lg transition-all ${selectedOwner === "baber" ? "bg-pink-100 text-pink-700" : "text-zinc-400 hover:text-zinc-600"}`}
              title={t.baber}
            >
              <span className="text-xs font-bold">她</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOwner("BABER")}
              className={`p-1.5 rounded-lg transition-all ${selectedOwner === "BABER" ? "bg-blue-100 text-blue-700" : "text-zinc-400 hover:text-zinc-600"}`}
              title={t.BABER}
            >
              <span className="text-xs font-bold">他</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!value.trim()}
            className="shrink-0 px-4 py-1.5 bg-zinc-900 text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
          >
            Add
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl z-30 overflow-hidden">
          <div className="p-3 border-b border-zinc-100">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              {value ? "Matching items" : "Quick add suggestions"}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2">
            {suggestions.map((item, index) => (
              <button
                key={`${item.name}-${index}`}
                type="button"
                onClick={() => handleSuggestionClick(item)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-50 transition-colors text-left group"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-zinc-700 group-hover:text-zinc-900 truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

