"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ExpenseInputForm from "./ExpenseInputForm";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  categories: string[];
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  tripId,
  categories,
}: AddExpenseModalProps) {
  const router = useRouter();

  // Prevent body scroll when modal is open
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

  const handleSuccess = () => {
    onClose();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">💰 Add Expense</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <ExpenseInputForm
            tripId={tripId}
            categories={categories}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
