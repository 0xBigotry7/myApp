"use client";

import { useState } from "react";

interface CategorySpecificFieldsProps {
  category: string;
  formData: any;
  onChange: (field: string, value: any) => void;
}

export default function CategorySpecificFields({
  category,
  formData,
  onChange,
}: CategorySpecificFieldsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Normalize category for comparison
  const normalizedCategory = category.toLowerCase();

  // Determine if this category has special fields
  const hasSpecialFields =
    normalizedCategory.includes("food") ||
    normalizedCategory.includes("dining") ||
    normalizedCategory.includes("restaurant") ||
    normalizedCategory.includes("activit") ||
    normalizedCategory.includes("shop") ||
    normalizedCategory.includes("transport") ||
    normalizedCategory.includes("other");

  if (!hasSpecialFields) return null;

  // Render fields based on category
  const renderFields = () => {
    // Food & Dining fields
    if (normalizedCategory.includes("food") || normalizedCategory.includes("dining") || normalizedCategory.includes("restaurant")) {
      return (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <span>🍽️</span>
            <span>Dining Details</span>
          </h3>

          {/* Party Size & Meal Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                👥 Party Size
              </label>
              <input
                type="number"
                min="1"
                value={formData.partySize || ""}
                onChange={(e) => onChange("partySize", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="2"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                🍽️ Meal Type
              </label>
              <select
                value={formData.mealType || ""}
                onChange={(e) => onChange("mealType", e.target.value || null)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select...</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Brunch">Brunch</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snacks">Snacks</option>
                <option value="Drinks">Drinks</option>
              </select>
            </div>
          </div>

          {/* Cuisine & Restaurant */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                🌍 Cuisine
              </label>
              <input
                type="text"
                value={formData.cuisineType || ""}
                onChange={(e) => onChange("cuisineType", e.target.value || null)}
                placeholder="Japanese"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                🏪 Restaurant
              </label>
              <input
                type="text"
                value={formData.restaurantName || ""}
                onChange={(e) => onChange("restaurantName", e.target.value || null)}
                placeholder="Sushi Dai"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Reservation & Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                📅 Reservation?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange("hasReservation", true)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    formData.hasReservation === true
                      ? "bg-violet-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => onChange("hasReservation", false)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    formData.hasReservation === false
                      ? "bg-violet-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                ⭐ Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => onChange("expenseRating", star)}
                    className="text-xl"
                  >
                    {formData.expenseRating >= star ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Activities fields
    if (normalizedCategory.includes("activit")) {
      return (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <span>🎭</span>
            <span>Activity Details</span>
          </h3>

          {/* Activity Type & Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              🎯 Activity Type
            </label>
            <select
              value={formData.activityType || ""}
              onChange={(e) => onChange("activityType", e.target.value || null)}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select...</option>
              <option value="Museum">🏛️ Museum</option>
              <option value="Tour">🗺️ Guided Tour</option>
              <option value="Theme Park">🎢 Theme Park</option>
              <option value="Concert">🎵 Concert</option>
              <option value="Sports">⚽ Sports Event</option>
              <option value="Adventure">🏔️ Adventure</option>
              <option value="Sightseeing">👀 Sightseeing</option>
              <option value="Show">🎭 Show/Theater</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              📍 Activity Name
            </label>
            <input
              type="text"
              value={formData.activityName || ""}
              onChange={(e) => onChange("activityName", e.target.value || null)}
              placeholder="e.g., Louvre Museum"
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Duration & Tickets */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                ⏱️ Duration (hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.activityDuration || ""}
                onChange={(e) => onChange("activityDuration", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="2.5"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                🎫 Tickets
              </label>
              <input
                type="number"
                min="1"
                value={formData.numberOfTickets || ""}
                onChange={(e) => onChange("numberOfTickets", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="2"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Reference & Guide */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                🎟️ Booking Ref
              </label>
              <input
                type="text"
                value={formData.activityReference || ""}
                onChange={(e) => onChange("activityReference", e.target.value || null)}
                placeholder="ABC-123"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                🗣️ Guide?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange("hasGuide", true)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    formData.hasGuide === true
                      ? "bg-violet-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => onChange("hasGuide", false)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    formData.hasGuide === false
                      ? "bg-violet-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ⭐ Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => onChange("expenseRating", star)}
                  className="text-2xl"
                >
                  {formData.expenseRating >= star ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Shopping fields
    if (normalizedCategory.includes("shop")) {
      return (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <span>🛍️</span>
            <span>Shopping Details</span>
          </h3>

          {/* Store & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                🏪 Store Name
              </label>
              <input
                type="text"
                value={formData.storeName || ""}
                onChange={(e) => onChange("storeName", e.target.value || null)}
                placeholder="Local Market"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                📦 Category
              </label>
              <select
                value={formData.shoppingCategory || ""}
                onChange={(e) => onChange("shoppingCategory", e.target.value || null)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select...</option>
                <option value="Clothing">👔 Clothing</option>
                <option value="Souvenirs">🎁 Souvenirs</option>
                <option value="Electronics">📱 Electronics</option>
                <option value="Groceries">🛒 Groceries</option>
                <option value="Gifts">🎁 Gifts</option>
                <option value="Local Crafts">🎨 Local Crafts</option>
                <option value="Books">📚 Books</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Number of Items */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                🔢 Items
              </label>
              <input
                type="number"
                min="1"
                value={formData.numberOfItems || ""}
                onChange={(e) => onChange("numberOfItems", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="3"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                🔄 Returns?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange("hasReturnPolicy", true)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    formData.hasReturnPolicy === true
                      ? "bg-violet-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => onChange("hasReturnPolicy", false)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    formData.hasReturnPolicy === false
                      ? "bg-violet-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          {/* Gift fields */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              🎁 Is this a gift?
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange("isGift", true)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  formData.isGift === true
                    ? "bg-violet-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => onChange("isGift", false)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  formData.isGift === false
                    ? "bg-violet-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {formData.isGift && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                💝 Gift For
              </label>
              <input
                type="text"
                value={formData.giftRecipient || ""}
                onChange={(e) => onChange("giftRecipient", e.target.value || null)}
                placeholder="Mom"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}
        </div>
      );
    }

    // Transportation fields
    if (normalizedCategory.includes("transport")) {
      return (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <span>🚗</span>
            <span>Transportation Details</span>
          </h3>

          {/* Distance & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                📏 Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.transportationDistance || ""}
                onChange={(e) => onChange("transportationDistance", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="25.5"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                ⏱️ Duration (min)
              </label>
              <input
                type="number"
                min="1"
                value={formData.transportationDuration || ""}
                onChange={(e) => onChange("transportationDuration", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="45"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Ticket & Passengers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                🎫 Ticket Ref
              </label>
              <input
                type="text"
                value={formData.ticketReference || ""}
                onChange={(e) => onChange("ticketReference", e.target.value || null)}
                placeholder="ABC123"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                👥 Passengers
              </label>
              <input
                type="number"
                min="1"
                value={formData.numberOfPassengers || ""}
                onChange={(e) => onChange("numberOfPassengers", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="2"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>
      );
    }

    // Other category
    if (normalizedCategory.includes("other")) {
      return (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <span>📦</span>
            <span>Other Details</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              🏷️ Sub-category
            </label>
            <select
              value={formData.otherSubcategory || ""}
              onChange={(e) => onChange("otherSubcategory", e.target.value || null)}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select...</option>
              <option value="Tips">💵 Tips</option>
              <option value="Fees">💳 Fees</option>
              <option value="Insurance">🛡️ Insurance</option>
              <option value="Medical">🏥 Medical</option>
              <option value="Emergency">🚨 Emergency</option>
              <option value="Services">🔧 Services</option>
              <option value="Misc">📦 Miscellaneous</option>
            </select>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mt-4">
      {/* Collapsible Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-all"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-violet-900">
          <span className="text-violet-600">{isExpanded ? "▼" : "▶"}</span>
          <span>Add More Details</span>
          <span className="text-xs font-normal text-violet-600">(optional)</span>
        </span>
        <span className="text-xs font-medium text-violet-600">
          {isExpanded ? "Hide" : "Show"}
        </span>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          {renderFields()}
        </div>
      )}
    </div>
  );
}
