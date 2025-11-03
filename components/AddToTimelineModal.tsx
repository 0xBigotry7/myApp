"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationAutocomplete from "./LocationAutocomplete";

interface AddToTimelineModalProps {
  tripId: string;
  onClose: () => void;
}

export default function AddToTimelineModal({ tripId, onClose }: AddToTimelineModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common fields
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  // Expense fields
  const [hasExpense, setHasExpense] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [currency, setCurrency] = useState("USD");

  // Transportation fields
  const [transportationMethod, setTransportationMethod] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");

  // Photo upload
  const [photos, setPhotos] = useState<File[]>([]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create date in local timezone, not UTC
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const timestamp = new Date(year, month - 1, day, hours, minutes, 0, 0);

      // If has expense, create expense entry
      if (hasExpense && amount) {
        const expenseData = {
          tripId,
          amount: parseFloat(amount),
          category,
          currency,
          date: timestamp.toISOString(),
          note: note || undefined,
          location: location || undefined,
          // Transportation fields
          transportationMethod: category === "Transportation" && transportationMethod ? transportationMethod : undefined,
          fromLocation: category === "Transportation" && fromLocation ? fromLocation : undefined,
          toLocation: category === "Transportation" && toLocation ? toLocation : undefined,
        };

        const expenseResponse = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(expenseData),
        });

        if (!expenseResponse.ok) {
          throw new Error("Failed to create expense");
        }
      }

      // If has photos or note (without expense), create post
      if (photos.length > 0 || (note && !hasExpense)) {
        // Upload photos first if any
        let photoUrls: string[] = [];

        if (photos.length > 0) {
          const formData = new FormData();
          formData.append("tripId", tripId);
          photos.forEach((photo) => {
            formData.append("photos", photo);
          });

          const uploadResponse = await fetch("/api/upload-photos", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload photos");
          }

          const uploadData = await uploadResponse.json();
          photoUrls = uploadData.urls;
        }

        // Create post
        const postData = {
          tripId,
          type: photos.length > 0 ? "photo" : "note",
          content: note || undefined,
          photos: photoUrls,
          location: location || undefined,
          timestamp: timestamp.toISOString(),
        };

        const postResponse = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (!postResponse.ok) {
          throw new Error("Failed to create post");
        }
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error adding to timeline:", error);
      alert("Failed to add to timeline. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Add to Timeline</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📍 Location (optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where were you?"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Note/Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Note/Description (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What happened? Any details to remember..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📸 Photos (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
            {photos.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {photos.length} photo{photos.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Expense Toggle */}
          <div className="border-t-2 border-gray-200 pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasExpense}
                onChange={(e) => setHasExpense(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-lg font-semibold text-gray-900">
                💰 This activity has an expense
              </span>
            </label>
          </div>

          {/* Expense Fields */}
          {hasExpense && (
            <div className="space-y-4 bg-purple-50 p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required={hasExpense}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  >
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option>
                    <option value="JPY">JPY ¥</option>
                    <option value="CNY">CNY ¥</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                >
                  <option value="Food">🍽️ Food</option>
                  <option value="Transportation">🚗 Transportation</option>
                  <option value="Activities">🎭 Activities</option>
                  <option value="Shopping">🛍️ Shopping</option>
                  <option value="Other">📦 Other</option>
                </select>
              </div>

              {/* Transportation-specific fields */}
              {category === "Transportation" && (
                <div className="space-y-4 pt-4 border-t-2 border-purple-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🚗 Transportation Method
                    </label>
                    <select
                      value={transportationMethod}
                      onChange={(e) => setTransportationMethod(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Select method...</option>
                      <option value="Flight">✈️ Flight</option>
                      <option value="Train">🚆 Train</option>
                      <option value="Bus">🚌 Bus</option>
                      <option value="Car">🚗 Car</option>
                      <option value="Taxi">🚕 Taxi</option>
                      <option value="Uber/Lyft">🚙 Uber/Lyft</option>
                      <option value="Subway">🚇 Subway</option>
                      <option value="Boat">⛴️ Boat/Ferry</option>
                      <option value="Bicycle">🚴 Bicycle</option>
                      <option value="Walking">🚶 Walking</option>
                      <option value="Other">🚦 Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📍 From (optional)
                    </label>
                    <LocationAutocomplete
                      value={fromLocation}
                      onChange={setFromLocation}
                      placeholder="Starting location..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 To (optional)
                    </label>
                    <LocationAutocomplete
                      value={toLocation}
                      onChange={setToLocation}
                      placeholder="Destination..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add to Timeline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
