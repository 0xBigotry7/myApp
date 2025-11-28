"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AccommodationBookingModal from "./AccommodationBookingModal";
import { BedDouble } from "lucide-react";

interface AccommodationExpenseButtonProps {
  tripId: string;
  tripDestination: string;
}

export default function AccommodationExpenseButton({
  tripId,
  tripDestination,
}: AccommodationExpenseButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (accommodationData: any) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId,
          category: "Accommodation",
          ...accommodationData,
        }),
      });

      if (response.ok) {
        router.refresh();
        setIsModalOpen(false);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save accommodation");
      }
    } catch (error) {
      console.error("Error saving accommodation:", error);
      alert("Failed to save accommodation");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-5 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-all text-sm shadow-sm active:scale-[0.98]"
      >
        <BedDouble className="w-4 h-4" />
        <span>Add Accommodation</span>
      </button>

      <AccommodationBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        tripDestination={tripDestination}
      />
    </>
  );
}
