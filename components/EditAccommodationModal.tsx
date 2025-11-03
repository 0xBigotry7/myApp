"use client";

import { useState, useEffect } from "react";
import { differenceInDays, format } from "date-fns";
import Image from "next/image";

interface EditAccommodationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accommodationData: any) => void;
  expense: {
    id: string;
    amount: number;
    currency: string;
    date: Date | string;
    accommodationName?: string | null;
    accommodationType?: string | null;
    checkInDate?: Date | string | null;
    checkOutDate?: Date | string | null;
    numberOfNights?: number | null;
    googlePlaceId?: string | null;
    hotelAddress?: string | null;
    hotelPhone?: string | null;
    hotelWebsite?: string | null;
    hotelRating?: number | null;
    hotelPhotos?: string[];
    latitude?: number | null;
    longitude?: number | null;
    confirmationNumber?: string | null;
    note?: string | null;
  };
}

interface Hotel {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  photos: Array<{ photoReference: string; width: number; height: number }>;
  location: { lat: number; lng: number };
}

interface HotelDetails {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  photos: string[];
  location: { lat: number; lng: number };
  googleMapsUrl?: string;
}

export default function EditAccommodationModal({
  isOpen,
  onClose,
  onSave,
  expense,
}: EditAccommodationModalProps) {
  const [showHotelSearch, setShowHotelSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedHotelDetails, setSelectedHotelDetails] = useState<HotelDetails | null>(null);

  const [formData, setFormData] = useState({
    checkInDate: "",
    checkOutDate: "",
    amount: "",
    currency: "USD",
    accommodationType: "Hotel",
    confirmationNumber: "",
    note: "",
  });

  useEffect(() => {
    if (isOpen && expense) {
      setFormData({
        checkInDate: expense.checkInDate
          ? format(new Date(expense.checkInDate), "yyyy-MM-dd")
          : "",
        checkOutDate: expense.checkOutDate
          ? format(new Date(expense.checkOutDate), "yyyy-MM-dd")
          : "",
        amount: expense.amount.toString(),
        currency: expense.currency,
        accommodationType: expense.accommodationType || "Hotel",
        confirmationNumber: expense.confirmationNumber || "",
        note: expense.note || "",
      });
    }
  }, [isOpen, expense]);

  const searchHotels = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        ...(searchLocation && { location: searchLocation }),
      });

      const response = await fetch(`/api/places/search-hotels?${params}`);
      const data = await response.json();

      if (response.ok) {
        setHotels(data.hotels || []);
      } else {
        alert(data.error || "Failed to search hotels");
      }
    } catch (error) {
      console.error("Error searching hotels:", error);
      alert("Failed to search hotels");
    } finally {
      setSearching(false);
    }
  };

  const selectHotel = async (hotel: Hotel) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(
        `/api/places/hotel-details?placeId=${hotel.placeId}`
      );
      const data = await response.json();

      if (response.ok) {
        setSelectedHotelDetails(data.hotel);
        setShowHotelSearch(false);
        setHotels([]);
        setSearchQuery("");
        setSearchLocation("");
      } else {
        alert(data.error || "Failed to load hotel details");
      }
    } catch (error) {
      console.error("Error loading hotel details:", error);
      alert("Failed to load hotel details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSave = () => {
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = differenceInDays(checkOut, checkIn);

    if (nights <= 0) {
      alert("Check-out date must be after check-in date");
      return;
    }

    if (!formData.amount) {
      alert("Please enter the total amount");
      return;
    }

    const accommodationData = {
      ...formData,
      amount: parseFloat(formData.amount),
      checkInDate: checkIn.toISOString(),
      checkOutDate: checkOut.toISOString(),
      numberOfNights: nights,
      // Use selected hotel details if changed, otherwise keep existing
      accommodationName: selectedHotelDetails?.name || expense.accommodationName,
      googlePlaceId: selectedHotelDetails?.placeId || expense.googlePlaceId,
      hotelAddress: selectedHotelDetails?.address || expense.hotelAddress,
      hotelPhone: selectedHotelDetails?.phone || expense.hotelPhone,
      hotelWebsite: selectedHotelDetails?.website || expense.hotelWebsite,
      hotelRating: selectedHotelDetails?.rating || expense.hotelRating,
      hotelPhotos: selectedHotelDetails?.photos || expense.hotelPhotos,
      latitude: selectedHotelDetails?.location.lat || expense.latitude,
      longitude: selectedHotelDetails?.location.lng || expense.longitude,
    };

    onSave(accommodationData);
    onClose();
  };

  const numberOfNights =
    formData.checkInDate && formData.checkOutDate
      ? differenceInDays(
          new Date(formData.checkOutDate),
          new Date(formData.checkInDate)
        )
      : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>✏️</span>
                <span>Edit Accommodation</span>
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {expense.accommodationName || "Update your booking details"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Hotel Info Display */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🏨</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">
                  {selectedHotelDetails?.name || expense.accommodationName || "Accommodation"}
                </h3>
                {(selectedHotelDetails?.address || expense.hotelAddress) && (
                  <p className="text-sm text-gray-600 mt-1">
                    📍 {selectedHotelDetails?.address || expense.hotelAddress}
                  </p>
                )}
                {(selectedHotelDetails?.rating || expense.hotelRating) && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-semibold text-sm">
                      {(selectedHotelDetails?.rating || expense.hotelRating)?.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowHotelSearch(!showHotelSearch)}
                className="px-3 py-2 bg-white text-blue-600 border-2 border-blue-300 rounded-lg hover:bg-blue-50 font-medium text-sm transition-all"
              >
                {showHotelSearch ? "Cancel" : "Change Hotel"}
              </button>
            </div>
          </div>

          {/* Hotel Search Section */}
          {showHotelSearch && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 space-y-4">
              <h4 className="font-bold text-gray-900">Search for a different hotel</h4>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  🏨 Hotel Name
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchHotels()}
                  placeholder="e.g., Hilton, Marriott"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  📍 Location (optional)
                </label>
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchHotels()}
                  placeholder="e.g., Paris, New York"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={searchHotels}
                disabled={searching || !searchQuery.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {searching ? "🔄 Searching..." : "🔍 Search Hotels"}
              </button>

              {/* Search Results */}
              {hotels.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700">Select a hotel:</p>
                  {hotels.map((hotel) => (
                    <div
                      key={hotel.placeId}
                      onClick={() => selectHotel(hotel)}
                      className="border-2 border-gray-200 rounded-lg p-3 hover:border-purple-500 hover:bg-white cursor-pointer transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                          🏨
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-gray-900 truncate">{hotel.name}</h5>
                          <p className="text-xs text-gray-600 truncate">{hotel.address}</p>
                          {hotel.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-yellow-500 text-xs">⭐</span>
                              <span className="text-xs font-semibold">{hotel.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loadingDetails && (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">🔄</div>
                  <p className="text-sm text-gray-600">Loading hotel details...</p>
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                📅 Check-in Date
              </label>
              <input
                type="date"
                required
                value={formData.checkInDate}
                onChange={(e) =>
                  setFormData({ ...formData, checkInDate: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                📅 Check-out Date
              </label>
              <input
                type="date"
                required
                value={formData.checkOutDate}
                onChange={(e) =>
                  setFormData({ ...formData, checkOutDate: e.target.value })
                }
                min={formData.checkInDate}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Nights Display */}
          {numberOfNights > 0 && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-purple-600">
                {numberOfNights}
              </span>
              <span className="text-purple-600 ml-2">
                night{numberOfNights !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Amount & Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                💵 Total Amount
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              {numberOfNights > 0 && formData.amount && (
                <p className="text-sm text-gray-600 mt-1">
                  ≈{" "}
                  {(parseFloat(formData.amount) / numberOfNights).toFixed(2)} per
                  night
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                💱 Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">🇺🇸 USD ($)</option>
                <option value="EUR">🇪🇺 EUR (€)</option>
                <option value="GBP">🇬🇧 GBP (£)</option>
                <option value="JPY">🇯🇵 JPY (¥)</option>
                <option value="CNY">🇨🇳 CNY (¥)</option>
              </select>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              🏷️ Accommodation Type
            </label>
            <select
              value={formData.accommodationType}
              onChange={(e) =>
                setFormData({ ...formData, accommodationType: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Hotel">Hotel</option>
              <option value="Airbnb">Airbnb</option>
              <option value="Hostel">Hostel</option>
              <option value="Resort">Resort</option>
              <option value="Vacation Rental">Vacation Rental</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Confirmation Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              🎫 Confirmation Number{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.confirmationNumber}
              onChange={(e) =>
                setFormData({ ...formData, confirmationNumber: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., ABC123456"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              📝 Note{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="e.g., Room with sea view, breakfast included"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                !formData.checkInDate || !formData.checkOutDate || !formData.amount
              }
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ✓ Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
