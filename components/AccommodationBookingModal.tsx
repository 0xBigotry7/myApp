"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { differenceInDays, format } from "date-fns";
import { 
  Search, 
  Hotel, 
  MapPin, 
  ArrowLeft, 
  X, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Check, 
  Star,
  Loader2,
  ChevronRight
} from "lucide-react";

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

  const getPriceLevel = (level?: number) => {
    if (!level) return "";
    return "$".repeat(level);
  };

  const numberOfNights = formData.checkInDate && formData.checkOutDate
    ? differenceInDays(new Date(formData.checkOutDate), new Date(formData.checkInDate))
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[85vh] sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-w-3xl shadow-2xl">
        {/* Header */}
        <div className="border-b border-zinc-100 p-4 sm:p-6 flex justify-between items-center bg-white shrink-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Hotel className="w-5 h-5" />
              Book Accommodation
            </h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              {step === "search" && "Search for your hotel"}
              {step === "select" && `${hotels.length} hotels found`}
              {step === "details" && "Enter booking details"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <div className={`flex-1 py-3 text-center text-xs font-medium border-b-2 transition-colors ${step === "search" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400"}`}>
            1. Search
          </div>
          <div className={`flex-1 py-3 text-center text-xs font-medium border-b-2 transition-colors ${step === "select" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400"}`}>
            2. Select
          </div>
          <div className={`flex-1 py-3 text-center text-xs font-medium border-b-2 transition-colors ${step === "details" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400"}`}>
            3. Details
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Step 1: Search */}
          {step === "search" && (
            <div className="space-y-5 max-w-lg mx-auto py-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Hotel Name
                </label>
                <div className="relative">
                  <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && searchHotels()}
                    placeholder="e.g. Hilton, Marriott, Grand Hotel"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && searchHotels()}
                    placeholder="e.g. Paris, New York, Tokyo"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={searchHotels}
                disabled={searching || !searchQuery.trim()}
                className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search Hotels
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Select Hotel */}
          {step === "select" && (
            <div className="space-y-4">
              <button
                onClick={() => setStep("search")}
                className="text-zinc-500 hover:text-zinc-900 text-sm font-medium flex items-center gap-1 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to search
              </button>

              {hotels.length === 0 ? (
                <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <Hotel className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500 font-medium">No hotels found</p>
                  <p className="text-zinc-400 text-sm mt-1">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {hotels.map((hotel) => (
                    <button
                      key={hotel.placeId}
                      onClick={() => selectHotel(hotel)}
                      className="flex items-start gap-4 p-4 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:shadow-md transition-all text-left bg-white group w-full"
                    >
                      <div className="w-20 h-20 shrink-0 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-300">
                        <Hotel className="w-8 h-8" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-zinc-900 group-hover:text-zinc-700 transition-colors truncate">
                          {hotel.name}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1 line-clamp-1">
                          {hotel.address}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          {hotel.rating && (
                            <div className="flex items-center gap-1 text-amber-500 font-medium">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              {hotel.rating.toFixed(1)}
                              {hotel.userRatingsTotal && (
                                <span className="text-zinc-400 font-normal">({hotel.userRatingsTotal})</span>
                              )}
                            </div>
                          )}
                          {hotel.priceLevel && (
                            <div className="text-zinc-600 font-medium">
                              {getPriceLevel(hotel.priceLevel)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="self-center text-zinc-300 group-hover:text-zinc-900 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Booking Details */}
          {step === "details" && selectedHotel && (
            <div className="space-y-6 pb-20 sm:pb-0">
              <button
                onClick={() => setStep("select")}
                className="text-zinc-500 hover:text-zinc-900 text-sm font-medium flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Choose different hotel
              </button>

              {/* Selected Hotel Card */}
              <div className="flex gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                {selectedHotel.photos && selectedHotel.photos[0] ? (
                  <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden relative bg-zinc-200">
                    <Image
                      src={selectedHotel.photos[0]}
                      alt={selectedHotel.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 shrink-0 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-400">
                    <Hotel className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-zinc-900">{selectedHotel.name}</h3>
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{selectedHotel.address}</p>
                  {selectedHotel.rating && (
                    <div className="flex items-center gap-1 text-sm text-amber-500 mt-1.5">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-medium">{selectedHotel.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                    Check-in Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="date"
                      required
                      value={formData.checkInDate}
                      onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                    Check-out Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="date"
                      required
                      value={formData.checkOutDate}
                      onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                      min={formData.checkInDate}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {numberOfNights > 0 && (
                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 text-indigo-900 rounded-lg text-sm font-medium border border-indigo-100">
                  <Calendar className="w-4 h-4" />
                  <span>{numberOfNights} night{numberOfNights !== 1 ? "s" : ""}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                    Total Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                    Currency
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none text-sm bg-white appearance-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="CNY">CNY (¥)</option>
                      <option value="THB">THB (฿)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                  Accommodation Type
                </label>
                <div className="relative">
                  <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <select
                    value={formData.accommodationType}
                    onChange={(e) => setFormData({ ...formData, accommodationType: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none text-sm bg-white appearance-none"
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Airbnb">Airbnb</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Resort">Resort</option>
                    <option value="Vacation Rental">Vacation Rental</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                  Confirmation Number <span className="text-zinc-400 normal-case">(Optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={formData.confirmationNumber}
                    onChange={(e) => setFormData({ ...formData, confirmationNumber: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none text-sm"
                    placeholder="e.g. ABC123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                  Note <span className="text-zinc-400 normal-case">(Optional)</span>
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none text-sm resize-none"
                  placeholder="e.g. Room with sea view, breakfast included"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!formData.checkInDate || !formData.checkOutDate || !formData.amount}
                className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Check className="w-5 h-5" />
                Save Accommodation
              </button>
            </div>
          )}

          {loadingDetails && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-zinc-900 mx-auto mb-3" />
                <p className="text-zinc-600 font-medium">Loading details...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
