"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Edit3,
  Trash2,
  Tag,
  Copy,
  Receipt,
  X,
  Check,
  Plane,
  Home,
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  merchantName?: string;
  description?: string;
  date: string;
  tripId?: string | null;
  receiptUrl?: string | null;
}

interface TransactionActionsProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (transaction: Transaction) => void;
  trips?: Array<{ id: string; name: string; destination: string }>;
  className?: string;
}

export default function TransactionActions({
  transaction,
  onEdit,
  onDelete,
  onDuplicate,
  trips = [],
  className,
}: TransactionActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTripMenu, setShowTripMenu] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete?.(transaction.id);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setIsOpen(false);
    }
  };

  const handleLinkToTrip = async (tripId: string | null) => {
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          isTripRelated: !!tripId,
        }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update transaction:", error);
    } finally {
      setShowTripMenu(false);
      setIsOpen(false);
    }
  };

  const handleDuplicate = () => {
    onDuplicate?.(transaction);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-zinc-100 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreHorizontal className="w-4 h-4 text-zinc-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setShowTripMenu(false);
            }}
          />

          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-zinc-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
            {/* Edit */}
            <button
              onClick={() => {
                onEdit?.(transaction);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors"
            >
              <Edit3 className="w-4 h-4 text-zinc-400" />
              Edit Transaction
            </button>

            {/* Duplicate */}
            <button
              onClick={handleDuplicate}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors"
            >
              <Copy className="w-4 h-4 text-zinc-400" />
              Duplicate
            </button>

            {/* Link to Trip */}
            <div className="relative">
              <button
                onClick={() => setShowTripMenu(!showTripMenu)}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  {transaction.tripId ? (
                    <Plane className="w-4 h-4 text-purple-500" />
                  ) : (
                    <Tag className="w-4 h-4 text-zinc-400" />
                  )}
                  {transaction.tripId ? "Change Trip" : "Link to Trip"}
                </span>
              </button>

              {/* Trip submenu */}
              {showTripMenu && (
                <div className="absolute left-full top-0 ml-1 w-52 bg-white rounded-xl shadow-xl border border-zinc-100 py-1 max-h-64 overflow-y-auto">
                  {transaction.tripId && (
                    <button
                      onClick={() => handleLinkToTrip(null)}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 border-b border-zinc-100"
                    >
                      <Home className="w-4 h-4 text-zinc-400" />
                      Remove from Trip
                    </button>
                  )}
                  {trips.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => handleLinkToTrip(trip.id)}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-zinc-50 flex items-center gap-2.5 transition-colors ${
                        transaction.tripId === trip.id
                          ? "text-purple-600 bg-purple-50"
                          : "text-zinc-700"
                      }`}
                    >
                      <Plane className={`w-4 h-4 ${
                        transaction.tripId === trip.id ? "text-purple-500" : "text-zinc-400"
                      }`} />
                      <div className="truncate">
                        <div className="font-semibold">{trip.name || trip.destination}</div>
                        {trip.name && (
                          <div className="text-xs text-zinc-400">{trip.destination}</div>
                        )}
                      </div>
                      {transaction.tripId === trip.id && (
                        <Check className="w-4 h-4 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Receipt */}
            {transaction.receiptUrl && (
              <a
                href={transaction.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors"
              >
                <Receipt className="w-4 h-4 text-zinc-400" />
                View Receipt
              </a>
            )}

            <div className="my-1 border-t border-zinc-100" />

            {/* Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Delete Transaction?</h3>
              <p className="text-sm text-zinc-500">
                This will permanently delete this {transaction.merchantName || transaction.category} transaction of ${Math.abs(transaction.amount).toFixed(2)}.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setIsOpen(false);
                }}
                className="flex-1 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



