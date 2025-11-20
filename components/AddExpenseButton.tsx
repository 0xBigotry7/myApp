"use client";

import { useState } from "react";
import AddExpenseModal from "./AddExpenseModal";
import { Plus } from "lucide-react";

interface AddExpenseButtonProps {
  tripId: string;
  categories: string[];
  buttonText?: string;
  defaultLocation?: string;
}

export default function AddExpenseButton({
  tripId,
  categories,
  buttonText = "Add Expense",
  defaultLocation,
}: AddExpenseButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all font-medium text-sm shadow-sm hover:shadow-md active:scale-[0.98]"
      >
        <Plus className="w-4 h-4" />
        <span>{buttonText}</span>
      </button>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tripId={tripId}
        categories={categories}
        defaultLocation={defaultLocation}
      />
    </>
  );
}
