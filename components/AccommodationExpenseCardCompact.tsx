"use client";

import { format, differenceInDays } from "date-fns";
import { Bed, Calendar, Star, FileText, Edit2, Trash2 } from "lucide-react";

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
      className={`group relative flex flex-col sm:flex-row justify-between items-start gap-4 p-5 rounded-xl transition-all border border-zinc-100 hover:border-zinc-200 bg-white shadow-sm`}
    >
      {/* Icon */}
      <div className="hidden sm:block mt-1">
        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Bed className="w-5 h-5" />
        </div>
      </div>

      <div className="flex-1 min-w-0 w-full">
        {/* Header: Amount & Type */}
        <div className="flex items-center justify-between sm:justify-start gap-3 mb-1">
          <span className="font-bold text-zinc-900 text-lg">
            {getCurrencySymbol(expense.currency)}
            {expense.amount.toFixed(2)}
          </span>
          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
            {expense.accommodationType || "Accommodation"}
          </span>
        </div>

        {/* Hotel Name */}
        {expense.accommodationName && (
          <h4 className="font-semibold text-zinc-800 mb-2">
            {expense.accommodationName}
          </h4>
        )}

        {/* Details Grid */}
        <div className="space-y-1.5">
          {dateRange && (
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span>{dateRange.checkIn} - {dateRange.checkOut}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300" />
              <span className="font-medium">
                {dateRange.nights} night{dateRange.nights !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {dateRange && dateRange.nights > 0 && (
            <div className="text-xs text-zinc-500 ml-6">
              {getCurrencySymbol(expense.currency)}
              {(expense.amount / dateRange.nights).toFixed(0)} / night
            </div>
          )}

          {expense.confirmationNumber && (
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="font-mono bg-zinc-50 px-1.5 py-0.5 rounded text-zinc-700">
                #{expense.confirmationNumber}
              </span>
            </div>
          )}

          {expense.hotelRating && (
            <div className="flex items-center gap-1 text-sm text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-medium text-zinc-700">{expense.hotelRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Note */}
        {expense.note && (
          <p className="text-sm text-zinc-600 mt-3 bg-zinc-50 p-3 rounded-lg italic">
            "{expense.note}"
          </p>
        )}

        {/* Added By */}
        <div className="mt-3 text-xs text-zinc-400">
          Added by {expense.user.name}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 absolute top-4 right-4 sm:static opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
