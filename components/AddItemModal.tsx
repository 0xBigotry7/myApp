"use client";

import { useState, useEffect } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  luggageId?: string | null; // Optional - null means unorganized
  onSuccess: (newItem: any) => void;
  locale: Locale;
  userId: string;
}

export default function AddItemModal({
  isOpen,
  onClose,
  luggageId,
  onSuccess,
  locale,
  userId,
}: AddItemModalProps) {
  const t = getTranslations(locale);

  const CATEGORIES = [
    { value: "clothing", label: `👕 ${t.clothing}`, icon: "👕" },
    { value: "electronics", label: `📱 ${t.electronics}`, icon: "📱" },
    { value: "toiletries", label: `🧴 ${t.toiletries}`, icon: "🧴" },
    { value: "documents", label: `📄 ${t.documents}`, icon: "📄" },
    { value: "medications", label: `💊 ${t.medications}`, icon: "💊" },
    { value: "accessories", label: `👓 ${t.accessories}`, icon: "👓" },
    { value: "shoes", label: `👟 ${t.shoes}`, icon: "👟" },
    { value: "books", label: `📚 ${t.books}`, icon: "📚" },
    { value: "food", label: `🍎 ${t.food}`, icon: "🍎" },
    { value: "gear", label: `⚙️ ${t.gear}`, icon: "⚙️" },
    { value: "other", label: `📦 ${t.other}`, icon: "📦" },
  ];
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "clothing",
    quantity: "1",
    weight: "",
    notes: "",
    isPacked: false,
    belongsTo: "shared",
    importance: "normal",
  });

  const BELONGS_TO_OPTIONS = [
    { value: "shared", label: t.shared, color: "#9CA3AF" }, // Gray
    { value: "baber", label: t.baber, color: "#FF6B6B" }, // Red
    { value: "BABER", label: t.BABER, color: "#4ECDC4" }, // Teal
  ];

  const IMPORTANCE_OPTIONS = [
    { value: "essential", label: t.essential, icon: "🔴", color: "#EF4444" }, // Red
    { value: "important", label: t.important, icon: "🟠", color: "#F59E0B" }, // Orange
    { value: "normal", label: t.normal, icon: "🟢", color: "#10B981" }, // Green
    { value: "optional", label: t.optionalItem, icon: "⚪", color: "#9CA3AF" }, // Gray
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const selectedOption = BELONGS_TO_OPTIONS.find(
      (opt) => opt.value === formData.belongsTo
    );

    // Create optimistic item object
    const optimisticItem = {
      id: `temp-${Date.now()}`,
      category: formData.category,
      name: formData.name,
      quantity: parseInt(formData.quantity),
      weight: formData.weight ? parseFloat(formData.weight) : null,
      isPacked: formData.isPacked,
      belongsTo: formData.belongsTo,
      colorCode: selectedOption?.color || null,
      importance: formData.importance,
      notes: formData.notes || null,
    };

    // Immediately update UI
    onSuccess(optimisticItem);
    onClose();

    // Reset form
    setFormData({
      name: "",
      category: "clothing",
      quantity: "1",
      weight: "",
      notes: "",
      isPacked: false,
      belongsTo: "shared",
      importance: "normal",
    });

    try {
      const res = await fetch("/api/packing/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          luggageId: luggageId || null,
          name: formData.name,
          category: formData.category,
          quantity: parseInt(formData.quantity),
          weight: formData.weight ? parseFloat(formData.weight) : null,
          notes: formData.notes || null,
          isPacked: formData.isPacked,
          belongsTo: formData.belongsTo,
          colorCode: selectedOption?.color,
          importance: formData.importance,
        }),
      });

      if (!res.ok) {
        alert("Failed to add item");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Error adding item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{t.addItem}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.itemName}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t.itemNamePlaceholder}
              className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.category}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, category: cat.value })
                  }
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    formData.category === cat.value
                      ? "bg-violet-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.quantity}
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.weight} (kg) <span className="text-gray-400 text-xs">({t.optional})</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                placeholder="0.5"
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Belongs To */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.belongsTo} <span className="text-gray-400 text-xs">({t.optional})</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BELONGS_TO_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, belongsTo: option.value })
                  }
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                    formData.belongsTo === option.value
                      ? "border-violet-500 shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{
                    backgroundColor:
                      formData.belongsTo === option.value
                        ? `${option.color}20`
                        : "white",
                    color:
                      formData.belongsTo === option.value
                        ? option.color
                        : "#374151",
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Importance */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.importance}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {IMPORTANCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, importance: option.value })
                  }
                  className={`px-2 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${
                    formData.importance === option.value
                      ? "border-violet-500 shadow-lg scale-105"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{
                    backgroundColor:
                      formData.importance === option.value
                        ? `${option.color}15`
                        : "white",
                  }}
                >
                  <div className="text-xl mb-1">{option.icon}</div>
                  <div className="text-xs">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.notes} <span className="text-gray-400 text-xs">({t.optional})</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              placeholder={t.notesPlaceholder}
              className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          {/* Is Packed */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPacked}
                onChange={(e) =>
                  setFormData({ ...formData, isPacked: e.target.checked })
                }
                className="w-5 h-5 text-violet-600 rounded cursor-pointer"
              />
              <span className="text-sm font-semibold text-gray-700">
                {t.alreadyPacked}
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? t.adding : t.addItem}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
