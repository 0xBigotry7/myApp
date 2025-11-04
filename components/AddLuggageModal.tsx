"use client";

import { useState, useEffect } from "react";

interface AddLuggageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCount: number;
}

const LUGGAGE_TYPES = [
  { value: "suitcase", label: "🧳 Suitcase", icon: "🧳" },
  { value: "backpack", label: "🎒 Backpack", icon: "🎒" },
  { value: "duffel", label: "👜 Duffel Bag", icon: "👜" },
  { value: "carry-on", label: "💼 Carry-on", icon: "💼" },
  { value: "personal", label: "👝 Personal Item", icon: "👝" },
  { value: "box", label: "📦 Box/Container", icon: "📦" },
  { value: "other", label: "🎁 Other", icon: "🎁" },
];

const COLORS = [
  { value: "red", label: "Red", bg: "bg-red-500" },
  { value: "blue", label: "Blue", bg: "bg-blue-500" },
  { value: "green", label: "Green", bg: "bg-green-500" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-500" },
  { value: "purple", label: "Purple", bg: "bg-purple-500" },
  { value: "pink", label: "Pink", bg: "bg-pink-500" },
  { value: "orange", label: "Orange", bg: "bg-orange-500" },
  { value: "gray", label: "Gray", bg: "bg-gray-500" },
  { value: "black", label: "Black", bg: "bg-gray-900" },
];

export default function AddLuggageModal({
  isOpen,
  onClose,
  onSuccess,
  existingCount,
}: AddLuggageModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "suitcase",
    color: "blue",
    maxWeight: "",
    description: "",
  });

  // Prevent body scroll when modal open
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
      const res = await fetch("/api/packing/luggage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maxWeight: formData.maxWeight ? parseFloat(formData.maxWeight) : null,
          order: existingCount,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to add luggage");
      }
    } catch (error) {
      console.error("Error adding luggage:", error);
      alert("Error adding luggage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add Luggage</h2>
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
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Main Suitcase, Carry-on Backpack"
              className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LUGGAGE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, type: type.value })
                  }
                  className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    formData.type === type.value
                      ? "bg-violet-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, color: color.value })
                  }
                  className={`w-10 h-10 rounded-full ${color.bg} ${
                    formData.color === color.value
                      ? "ring-4 ring-violet-500 ring-offset-2"
                      : "hover:scale-110"
                  } transition-all`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Max Weight */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Weight Limit (kg) <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.maxWeight}
              onChange={(e) =>
                setFormData({ ...formData, maxWeight: e.target.value })
              }
              placeholder="e.g., 23"
              className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              placeholder="e.g., Checked luggage for clothes and shoes"
              className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Adding..." : "Add Luggage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
