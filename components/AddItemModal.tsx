"use client";

import { useState, useEffect } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  luggageId: string;
  onSuccess: () => void;
  locale: Locale;
}

export default function AddItemModal({
  isOpen,
  onClose,
  luggageId,
  onSuccess,
  locale,
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
  });

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

    try {
      const res = await fetch("/api/packing/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          luggageId,
          name: formData.name,
          category: formData.category,
          quantity: parseInt(formData.quantity),
          weight: formData.weight ? parseFloat(formData.weight) : null,
          notes: formData.notes || null,
          isPacked: formData.isPacked,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          name: "",
          category: "clothing",
          quantity: "1",
          weight: "",
          notes: "",
          isPacked: false,
        });
      } else {
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
