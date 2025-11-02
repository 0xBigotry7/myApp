"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AccommodationExpenseCard from "./AccommodationExpenseCard";
import EditAccommodationModal from "./EditAccommodationModal";

interface AccommodationExpense {
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
}

interface AccommodationExpenseManagerProps {
  expense: AccommodationExpense;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function AccommodationExpenseManager({
  expense,
  canEdit = true,
  canDelete = true,
}: AccommodationExpenseManagerProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = async (accommodationData: any) => {
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "Accommodation",
          ...accommodationData,
        }),
      });

      if (response.ok) {
        router.refresh();
        setIsEditModalOpen(false);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update accommodation");
      }
    } catch (error) {
      console.error("Error updating accommodation:", error);
      alert("Failed to update accommodation");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete this accommodation booking at ${expense.accommodationName || "this hotel"}?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete accommodation");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting accommodation:", error);
      alert("Failed to delete accommodation");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AccommodationExpenseCard
        expense={expense}
        onEdit={canEdit ? () => setIsEditModalOpen(true) : undefined}
        onDelete={canDelete ? handleDelete : undefined}
      />

      {isEditModalOpen && (
        <EditAccommodationModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEdit}
          expense={expense}
        />
      )}

      {isDeleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔄</div>
            <p className="text-gray-700">Deleting accommodation...</p>
          </div>
        </div>
      )}
    </>
  );
}
