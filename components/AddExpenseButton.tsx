"use client";

import { useState } from "react";
import AddExpenseModal from "./AddExpenseModal";

interface AddExpenseButtonProps {
  tripId: string;
  categories: string[];
  buttonText?: string;
}

export default function AddExpenseButton({
  tripId,
  categories,
  buttonText = "Add Expense",
}: AddExpenseButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:shadow-xl transition-all font-bold text-lg transform active:scale-95"
      >
        <span className="text-2xl">💰</span>
        <span>{buttonText}</span>
      </button>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tripId={tripId}
        categories={categories}
      />
    </>
  );
}
