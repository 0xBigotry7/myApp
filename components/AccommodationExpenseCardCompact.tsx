"use client";

import { format, differenceInDays } from "date-fns";

interface AccommodationExpenseCardCompactProps {
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
    hotelAddress?: string | null;
    hotelRating?: number | null;
    confirmationNumber?: string | null;
    note?: string | null;
    user: {
      name: string;
    };
  };
  onEdit?: () => void;
  onDelete?: () => void;
  userColor: {
    bg: string;
    badge: string;
    icon?: string;
  };
}

export default function AccommodationExpenseCardCompact({
  expense,
  onEdit,
  onDelete,
  userColor,
}: AccommodationExpenseCardCompactProps) {
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
      checkIn: format(checkIn, "MMM d"),
      checkOut: format(checkOut, "MMM d, yyyy"),
      nights: differenceInDays(checkOut, checkIn),
    };
  };

  const dateRange = formatDateRange();

  return (
    <div
      className={`flex justify-between items-start p-4 rounded-xl transition-all ${userColor.bg} group`}
    >
      <div className="flex-1 min-w-0 mr-3">
        {/* Amount and Hotel Name */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-base sm:text-lg whitespace-nowrap">
            {getCurrencySymbol(expense.currency)}
            {expense.amount.toFixed(2)}
          </span>
          <span className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg font-medium ${userColor.badge}`}>
            🏨 {expense.accommodationType || "Accommodation"}
          </span>
        </div>

        {/* Hotel Name */}
        {expense.accommodationName && (
          <p className="text-sm font-medium text-gray-800 mb-1">
            {expense.accommodationName}
          </p>
        )}

        {/* Date Range with Nights */}
        {dateRange && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1 flex-wrap">
            <span className="flex items-center gap-1">
              <span>📅</span>
              <span>
                {dateRange.checkIn} - {dateRange.checkOut}
              </span>
            </span>
            <span className="text-purple-600 font-semibold">
              ({dateRange.nights} night{dateRange.nights !== 1 ? "s" : ""})
            </span>
            {dateRange.nights > 0 && (
              <span className="text-gray-500">
                • {getCurrencySymbol(expense.currency)}
                {(expense.amount / dateRange.nights).toFixed(0)}/night
              </span>
            )}
          </div>
        )}

        {/* Confirmation Number */}
        {expense.confirmationNumber && (
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
            <span>🎫</span>
            <span className="font-mono">{expense.confirmationNumber}</span>
          </div>
        )}

        {/* Note */}
        {expense.note && (
          <p className="text-sm text-gray-600 mt-1 break-words line-clamp-2">
            {expense.note}
          </p>
        )}

        {/* User Info */}
        <div className="flex gap-3 text-xs text-gray-500 mt-1 flex-wrap">
          <span className="flex items-center gap-1">
            {userColor.icon && <span>{userColor.icon}</span>}
            <span className="truncate">Added by {expense.user.name}</span>
          </span>
          {expense.hotelRating && (
            <span className="flex items-center gap-1">
              <span className="text-yellow-500">⭐</span>
              <span>{expense.hotelRating.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all touch-manipulation md:opacity-0 md:group-hover:opacity-100"
            title="Edit"
          >
            ✏️
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all touch-manipulation md:opacity-0 md:group-hover:opacity-100"
            title="Delete"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
