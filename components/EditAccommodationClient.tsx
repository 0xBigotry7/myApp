"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EditAccommodationModal from "./EditAccommodationModal";

interface EditAccommodationClientProps {
  tripId: string;
  expense: {
    id: string;
    amount: number;
    currency: string;
    date: Date;
    accommodationName?: string | null;
    accommodationType?: string | null;
    checkInDate?: Date | null;
    checkOutDate?: Date | null;
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
  };
}

export default function EditAccommodationClient({
  tripId,
  expense,
}: EditAccommodationClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (accommodationData: any) => {
    setIsSaving(true);
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
        router.push(`/trips/${tripId}`);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update accommodation");
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Error updating accommodation:", error);
      alert("Failed to update accommodation");
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    router.push(`/trips/${tripId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href={`/trips/${tripId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <span>←</span>
          <span>Back to Trip</span>
        </Link>

        {/* Modal is always open on this page */}
        <EditAccommodationModal
          isOpen={true}
          onClose={handleClose}
          onSave={handleSave}
          expense={expense}
        />

        {isSaving && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">🔄</div>
              <p className="text-gray-700">Updating accommodation...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
