"use client";

import Image from "next/image";
import { format, differenceInDays } from "date-fns";

interface AccommodationExpenseCardProps {
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
    user: {
      name: string;
    };
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AccommodationExpenseCard({
  expense,
  onEdit,
  onDelete,
}: AccommodationExpenseCardProps) {
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CNY: "¥",
      THB: "฿",
    };
    return symbols[currency] || currency;
  };

  const formatDateRange = () => {
    if (!expense.checkInDate || !expense.checkOutDate) return null;

    const checkIn = new Date(expense.checkInDate);
    const checkOut = new Date(expense.checkOutDate);

    return {
      checkIn: format(checkIn, "MMM d, yyyy"),
      checkOut: format(checkOut, "MMM d, yyyy"),
      nights: differenceInDays(checkOut, checkIn),
    };
  };

  const dateRange = formatDateRange();
  const primaryPhoto = expense.hotelPhotos && expense.hotelPhotos.length > 0
    ? expense.hotelPhotos[0]
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 overflow-hidden hover:shadow-xl transition-all">
      {/* Hotel Photo Header */}
      {primaryPhoto && (
        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
          <Image
            src={primaryPhoto}
            alt={expense.accommodationName || "Accommodation"}
            fill
            className="object-cover"
          />
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <span className="text-2xl">🏨</span>
              <span className="font-bold text-gray-900">
                {expense.accommodationType || "Accommodation"}
              </span>
            </div>
          </div>
          {/* Rating Badge */}
          {expense.hotelRating && (
            <div className="absolute top-4 right-4">
              <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-full flex items-center gap-1 shadow-lg">
                <span className="text-yellow-500">⭐</span>
                <span className="font-bold text-gray-900">
                  {expense.hotelRating.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Hotel Name & Amount */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {expense.accommodationName || "Accommodation"}
            </h3>
            {expense.hotelAddress && (
              <p className="text-sm text-gray-600 flex items-start gap-1">
                <span>📍</span>
                <span>{expense.hotelAddress}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {getCurrencySymbol(expense.currency)}{expense.amount.toLocaleString()}
            </div>
            {dateRange && dateRange.nights > 0 && (
              <div className="text-sm text-gray-500 mt-1">
                {getCurrencySymbol(expense.currency)}
                {(expense.amount / dateRange.nights).toFixed(0)}/night
              </div>
            )}
          </div>
        </div>

        {/* Date Range */}
        {dateRange && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">Check-in</div>
                <div className="font-bold text-gray-900">{dateRange.checkIn}</div>
              </div>
              <div className="flex flex-col items-center px-4">
                <div className="text-2xl font-bold text-purple-600">
                  {dateRange.nights}
                </div>
                <div className="text-xs text-gray-600">
                  night{dateRange.nights !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-xs text-gray-600 mb-1">Check-out</div>
                <div className="font-bold text-gray-900">{dateRange.checkOut}</div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Number */}
        {expense.confirmationNumber && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">🎫 Confirmation:</span>
            <span className="font-mono font-bold text-gray-900">
              {expense.confirmationNumber}
            </span>
          </div>
        )}

        {/* Contact Info */}
        {(expense.hotelPhone || expense.hotelWebsite) && (
          <div className="flex flex-wrap gap-3 text-sm">
            {expense.hotelPhone && (
              <a
                href={`tel:${expense.hotelPhone}`}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                <span>📞</span>
                <span>{expense.hotelPhone}</span>
              </a>
            )}
            {expense.hotelWebsite && (
              <a
                href={expense.hotelWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                <span>🌐</span>
                <span>Website</span>
              </a>
            )}
          </div>
        )}

        {/* Note */}
        {expense.note && (
          <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
            <span className="font-medium">Note:</span> {expense.note}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Added by <span className="font-medium text-gray-900">{expense.user.name}</span>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Additional Photos */}
        {expense.hotelPhotos && expense.hotelPhotos.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {expense.hotelPhotos.slice(1, 5).map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={photo}
                  alt={`Photo ${idx + 2}`}
                  fill
                  className="object-cover"
                />
                {idx === 3 && expense.hotelPhotos!.length > 5 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      +{expense.hotelPhotos!.length - 5}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
