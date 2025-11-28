"use client";

import { useState, useEffect } from "react";
import { X, Check, Briefcase, Backpack, ShoppingBag, Package, Gift, Luggage } from "lucide-react";

interface AddLuggageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLuggage: any) => void;
  existingCount: number;
  editLuggage?: any; // Luggage to edit (optional)
}

const LUGGAGE_TYPES = [
  { value: "suitcase", label: "Suitcase", icon: Luggage },
  { value: "backpack", label: "Backpack", icon: Backpack },
  { value: "duffel", label: "Duffel Bag", icon: ShoppingBag },
  { value: "carry-on", label: "Carry-on", icon: Briefcase },
  { value: "personal", label: "Personal Item", icon: ShoppingBag },
  { value: "box", label: "Box", icon: Package },
  { value: "other", label: "Other", icon: Gift },
];

const COLORS = [
  { value: "black", label: "Black", bg: "bg-zinc-900", ring: "ring-zinc-900" },
  { value: "gray", label: "Gray", bg: "bg-zinc-500", ring: "ring-zinc-500" },
  { value: "red", label: "Red", bg: "bg-red-500", ring: "ring-red-500" },
  { value: "blue", label: "Blue", bg: "bg-blue-500", ring: "ring-blue-500" },
  { value: "green", label: "Green", bg: "bg-emerald-500", ring: "ring-emerald-500" },
  { value: "yellow", label: "Yellow", bg: "bg-amber-400", ring: "ring-amber-400" },
  { value: "purple", label: "Purple", bg: "bg-purple-500", ring: "ring-purple-500" },
  { value: "pink", label: "Pink", bg: "bg-pink-500", ring: "ring-pink-500" },
  { value: "orange", label: "Orange", bg: "bg-orange-500", ring: "ring-orange-500" },
];

export default function AddLuggageModal({
  isOpen,
  onClose,
  onSuccess,
  existingCount,
  editLuggage,
}: AddLuggageModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "suitcase",
    color: "black",
    description: "",
    airtagName: "",
  });

  // Initialize form with edit luggage data
  useEffect(() => {
    if (editLuggage) {
      setFormData({
        name: editLuggage.name || "",
        type: editLuggage.type || "suitcase",
        color: editLuggage.color || "black",
        description: editLuggage.description || "",
        airtagName: editLuggage.airtagName || "",
      });
    } else {
      // Reset form when not editing
      setFormData({
        name: "",
        type: "suitcase",
        color: "black",
        description: "",
        airtagName: "",
      });
    }
  }, [editLuggage, isOpen]);

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

    // Create optimistic luggage object
    const optimisticLuggage = editLuggage ? {
      ...editLuggage, // Preserve all existing properties
      name: formData.name,
      type: formData.type,
      color: formData.color,
      description: formData.description || null,
      airtagName: formData.airtagName || null,
    } : {
      id: `temp-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      color: formData.color,
      description: formData.description || null,
      airtagName: formData.airtagName || null,
      order: existingCount,
      items: [],
    };

    // Immediately update UI
    onSuccess(optimisticLuggage);
    onClose();

    try {
      if (editLuggage) {
        // Update existing luggage
        const res = await fetch(`/api/packing/luggage/${editLuggage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            type: formData.type,
            color: formData.color,
            description: formData.description || null,
            airtagName: formData.airtagName || null,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          alert(`Failed to update luggage: ${errorData.details || errorData.error || "Unknown error"}`);
        }
      } else {
        // Create new luggage
        const res = await fetch("/api/packing/luggage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            airtagName: formData.airtagName || null,
            order: existingCount,
          }),
        });

        if (!res.ok) {
          alert("Failed to add luggage");
        }
      }
    } catch (error) {
      console.error("Error saving luggage:", error);
      alert("Error saving luggage");
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
      <div className="relative bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {editLuggage ? "Edit Luggage" : "Add Luggage"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Luggage Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Main Suitcase"
                className="w-full px-4 py-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LUGGAGE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all ${
                        formData.type === type.value
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-md"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Color Label
              </label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-full ${color.bg} transition-all relative flex items-center justify-center ${
                      formData.color === color.value
                        ? `ring-2 ring-offset-2 dark:ring-offset-zinc-900 ${color.ring} scale-110`
                        : "hover:scale-110"
                    }`}
                    title={color.label}
                  >
                    {formData.color === color.value && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Description <span className="text-zinc-400 dark:text-zinc-500 font-normal normal-case">(Optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="What's inside?"
                className="w-full px-4 py-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent resize-none"
              />
            </div>

            {/* AirTag */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                AirTag Name <span className="text-zinc-400 dark:text-zinc-500 font-normal normal-case">(Optional)</span>
              </label>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">📍</span>
                 <input
                  type="text"
                  value={formData.airtagName}
                  onChange={(e) => setFormData({ ...formData, airtagName: e.target.value })}
                  placeholder="e.g. Red Suitcase Tag"
                  className="w-full pl-10 pr-4 py-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-zinc-200 dark:shadow-zinc-900"
            >
              {loading ? (editLuggage ? "Saving..." : "Adding...") : (editLuggage ? "Save Changes" : "Add Luggage")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
