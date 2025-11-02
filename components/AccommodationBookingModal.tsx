"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { differenceInDays, format } from "date-fns";

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

interface AccommodationBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accommodationData: any) => void;
  tripDestination?: string;
}

export default function AccommodationBookingModal({
  isOpen,
  onClose,
  onSave,
  tripDestination,
}: AccommodationBookingModalProps) {
  const [step, setStep] = useState<"search" | "select" | "details">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState(tripDestination || "");
  const [searching, setSearching] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<HotelDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
    if (isOpen && tripDestination) {
      setSearchLocation(tripDestination);
    }
  }, [isOpen, tripDestination]);

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
        setStep("select");
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
        setSelectedHotel(data.hotel);
        setStep("details");
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
    if (!selectedHotel) return;

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
      accommodationName: selectedHotel.name,
      googlePlaceId: selectedHotel.placeId,
      hotelAddress: selectedHotel.address,
      hotelPhone: selectedHotel.phone,
      hotelWebsite: selectedHotel.website,
      hotelRating: selectedHotel.rating,
      hotelPhotos: selectedHotel.photos,
      latitude: selectedHotel.location.lat,
      longitude: selectedHotel.location.lng,
      location: selectedHotel.name,
    };

    onSave(accommodationData);
    handleClose();
  };

  const handleClose = () => {
    setStep("search");
    setSearchQuery("");
    setHotels([]);
    setSelectedHotel(null);
    setFormData({
      checkInDate: "",
      checkOutDate: "",
      amount: "",
      currency: "USD",
      accommodationType: "Hotel",
      confirmationNumber: "",
      note: "",
    });
    onClose();
  };

  const getPhotoUrl = (photoReference: string) => {
    return `/api/places/photo?photo_reference=${photoReference}&maxwidth=400`;
  };

  const getPriceLevel = (level?: number) => {
    if (!level) return "";
    return "$".repeat(level);
  };

  const numberOfNights = formData.checkInDate && formData.checkOutDate
    ? differenceInDays(new Date(formData.checkOutDate), new Date(formData.checkInDate))
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>🏨</span>
                <span>Book Accommodation</span>
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {step === "search" && "Search for your hotel"}
                {step === "select" && `${hotels.length} hotels found`}
                {step === "details" && "Enter booking details"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center gap-2 ${step === "search" ? "text-white" : "text-blue-200"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "search" ? "bg-white text-blue-600" : "bg-white/20"}`}>
                1
              </div>
              <span className="text-sm font-medium">Search</span>
            </div>
            <div className="flex-1 h-px bg-white/20"></div>
            <div className={`flex items-center gap-2 ${step === "select" ? "text-white" : "text-blue-200"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "select" ? "bg-white text-blue-600" : "bg-white/20"}`}>
                2
              </div>
              <span className="text-sm font-medium">Select</span>
            </div>
            <div className="flex-1 h-px bg-white/20"></div>
            <div className={`flex items-center gap-2 ${step === "details" ? "text-white" : "text-blue-200"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "details" ? "bg-white text-blue-600" : "bg-white/20"}`}>
                3
              </div>
              <span className="text-sm font-medium">Details</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Search */}
          {step === "search" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  🔍 Hotel Name
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchHotels()}
                  placeholder="e.g., Hilton, Marriott, Grand Hotel"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  📍 Location
                </label>
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchHotels()}
                  placeholder="e.g., Paris, New York, Tokyo"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={searchHotels}
                disabled={searching || !searchQuery.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {searching ? "🔄 Searching..." : "🔍 Search Hotels"}
              </button>
            </div>
          )}

          {/* Step 2: Select Hotel */}
          {step === "select" && (
            <div className="space-y-4">
              <button
                onClick={() => setStep("search")}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                ← Back to search
              </button>

              {hotels.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏨</div>
                  <p className="text-gray-500">No hotels found. Try a different search.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {hotels.map((hotel) => (
                    <div
                      key={hotel.placeId}
                      onClick={() => selectHotel(hotel)}
                      className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex gap-4">
                        {/* Hotel Photo */}
                        <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg overflow-hidden relative flex items-center justify-center text-5xl">
                          🏨
                        </div>

                        {/* Hotel Info */}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                            {hotel.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {hotel.address}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            {hotel.rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <span className="text-yellow-500">⭐</span>
                                <span className="font-semibold">{hotel.rating.toFixed(1)}</span>
                                {hotel.userRatingsTotal && (
                                  <span className="text-gray-500">({hotel.userRatingsTotal})</span>
                                )}
                              </div>
                            )}
                            {hotel.priceLevel && (
                              <div className="text-sm text-green-600 font-semibold">
                                {getPriceLevel(hotel.priceLevel)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center text-gray-400 group-hover:text-blue-600 transition-colors">
                          →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Booking Details */}
          {step === "details" && selectedHotel && (
            <div className="space-y-6">
              <button
                onClick={() => setStep("select")}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                ← Choose different hotel
              </button>

              {/* Selected Hotel Display */}
              <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
                <div className="flex gap-4">
                  {selectedHotel.photos && selectedHotel.photos[0] && (
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                      <Image
                        src={selectedHotel.photos[0]}
                        alt={selectedHotel.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{selectedHotel.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedHotel.address}</p>
                    {selectedHotel.rating && (
                      <div className="flex items-center gap-1 text-sm mt-2">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-semibold">{selectedHotel.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    📅 Check-in Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                    min={formData.checkInDate}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {numberOfNights > 0 && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
                  <span className="text-2xl font-bold text-purple-600">{numberOfNights}</span>
                  <span className="text-purple-600 ml-2">night{numberOfNights !== 1 ? "s" : ""}</span>
                </div>
              )}

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
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    💱 Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
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

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  🏷️ Accommodation Type
                </label>
                <select
                  value={formData.accommodationType}
                  onChange={(e) => setFormData({ ...formData, accommodationType: e.target.value })}
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

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  🎫 Confirmation Number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.confirmationNumber}
                  onChange={(e) => setFormData({ ...formData, confirmationNumber: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., ABC123456"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  📝 Note <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="e.g., Room with sea view, breakfast included"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!formData.checkInDate || !formData.checkOutDate || !formData.amount}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ✓ Save Accommodation
              </button>
            </div>
          )}

          {loadingDetails && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔄</div>
              <p className="text-gray-500">Loading hotel details...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
