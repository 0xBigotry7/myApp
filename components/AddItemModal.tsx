"use client";

import { useState, useEffect } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";
import { X, Check, Circle, AlertCircle, Info, User, Users } from "lucide-react";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  luggageId?: string | null; // Optional - null means unorganized
  onSuccess: (newItem: any) => void;
  locale: Locale;
  userId: string;
  editItem?: any; // Item to edit (optional)
}

export default function AddItemModal({
  isOpen,
  onClose,
  luggageId,
  onSuccess,
  locale,
  userId,
  editItem,
}: AddItemModalProps) {
  const t = getTranslations(locale);

  const CATEGORIES = [
    { value: "documents", label: t.documents, icon: "📄" },
    { value: "electronics", label: t.electronics, icon: "📱" },
    { value: "charging", label: t.charging || "Charging", icon: "🔌" },
    { value: "clothing", label: t.clothing, icon: "👕" },
    { value: "toiletries", label: t.toiletries, icon: "🧴" },
    { value: "cosmetics", label: t.cosmetics || "Cosmetics", icon: "💄" },
    { value: "shoes", label: t.shoes, icon: "👟" },
    { value: "accessories", label: t.accessories, icon: "👓" },
    { value: "bags", label: t.bags || "Bags", icon: "👜" },
    { value: "bedding", label: t.bedding || "Bedding", icon: "🛏️" },
    { value: "medications", label: t.medications, icon: "💊" },
    { value: "food", label: t.food, icon: "🍎" },
    { value: "other", label: t.other, icon: "📦" },
    { value: "souvenirs", label: t.souvenirs || "Souvenirs", icon: "🎁" },
  ];

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "clothing",
    quantity: "1",
    notes: "",
    isPacked: false,
    belongsTo: "shared",
    importance: "normal",
  });

  // Initialize form with edit item data
  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name || "",
        category: editItem.category || "clothing",
        quantity: String(editItem.quantity || 1),
        notes: editItem.notes || "",
        isPacked: editItem.isPacked || false,
        belongsTo: editItem.belongsTo || "shared",
        importance: editItem.importance || "normal",
      });
    } else {
      setFormData({
        name: "",
        category: "clothing",
        quantity: "1",
        notes: "",
        isPacked: false,
        belongsTo: "shared",
        importance: "normal",
      });
    }
  }, [editItem, isOpen]);

  const BELONGS_TO_OPTIONS = [
    { value: "shared", label: t.shared, color: "bg-zinc-100 text-zinc-700", icon: Users },
    { value: "baber", label: t.baber, color: "bg-pink-50 text-pink-700", icon: User },
    { value: "BABER", label: t.BABER, color: "bg-blue-50 text-blue-700", icon: User },
  ];

  const IMPORTANCE_OPTIONS = [
    { value: "essential", label: t.essential, icon: AlertCircle, color: "text-red-600 bg-red-50 border-red-100" },
    { value: "important", label: t.important, icon: Info, color: "text-orange-600 bg-orange-50 border-orange-100" },
    { value: "normal", label: t.normal, icon: Circle, color: "text-zinc-600 bg-zinc-50 border-zinc-200" },
    { value: "optional", label: t.optionalItem, icon: Circle, color: "text-zinc-400 bg-zinc-50 border-zinc-100" },
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

    // Create optimistic item object
    const optimisticItem = editItem ? {
      ...editItem,
      category: formData.category,
      name: formData.name,
      quantity: parseInt(formData.quantity),
      isPacked: formData.isPacked,
      belongsTo: formData.belongsTo,
      importance: formData.importance,
      notes: formData.notes || null,
    } : {
      id: `temp-${Date.now()}`,
      category: formData.category,
      name: formData.name,
      quantity: parseInt(formData.quantity),
      isPacked: formData.isPacked,
      belongsTo: formData.belongsTo,
      importance: formData.importance,
      notes: formData.notes || null,
      photoUrl: null,
      tags: [],
      lastUsedDate: null,
    };

    onSuccess(optimisticItem);
    onClose();

    try {
      if (editItem) {
        const res = await fetch(`/api/packing/items/${editItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            quantity: parseInt(formData.quantity),
            notes: formData.notes || null,
            isPacked: formData.isPacked,
            belongsTo: formData.belongsTo,
            importance: formData.importance,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          alert(`Failed to update item: ${errorData.details || errorData.error}`);
        }
      } else {
        const res = await fetch("/api/packing/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            luggageId: luggageId || null,
            name: formData.name,
            category: formData.category,
            quantity: parseInt(formData.quantity),
            notes: formData.notes || null,
            isPacked: formData.isPacked,
            belongsTo: formData.belongsTo,
            importance: formData.importance,
          }),
        });

        if (!res.ok) {
          alert("Failed to add item");
        }
      }
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Error saving item");
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <h2 className="text-xl font-bold text-zinc-900">
              {editItem ? t.editItem : t.addItem}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                {t.itemName}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t.itemNamePlaceholder}
                className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                {t.category}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`px-2 py-2 rounded-xl text-xs font-medium transition-all border flex flex-col items-center gap-1 ${
                      formData.category === cat.value
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="line-clamp-1">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Importance Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  {t.quantity}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Packed?
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPacked: !formData.isPacked })}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                    formData.isPacked
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  }`}
                >
                  {formData.isPacked ? (
                    <>
                      <Check className="w-4 h-4" /> Yes
                    </>
                  ) : (
                    "No"
                  )}
                </button>
              </div>
            </div>

            {/* Importance */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                {t.importance}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {IMPORTANCE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, importance: option.value })}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border flex items-center justify-center gap-1.5 ${
                        formData.importance === option.value
                          ? `${option.color} shadow-sm ring-1 ring-offset-1 ring-transparent`
                          : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Belongs To */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                {t.belongsTo}
              </label>
              <div className="flex gap-2">
                {BELONGS_TO_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, belongsTo: option.value })}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all border flex items-center justify-center gap-2 ${
                        formData.belongsTo === option.value
                          ? `${option.color} border-transparent shadow-sm`
                          : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                {t.notes} <span className="text-zinc-400 font-normal normal-case">({t.optional})</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder={t.notesPlaceholder}
                className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-all"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-zinc-200"
            >
              {loading ? (editItem ? t.saving : t.adding) : (editItem ? t.save : t.addItem)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
