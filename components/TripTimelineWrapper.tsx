"use client";

import { useState } from "react";
import AddPhotoModal from "./AddPhotoModal";

interface TripTimelineWrapperProps {
  tripId: string;
  children: React.ReactNode;
}

export default function TripTimelineWrapper({ tripId, children }: TripTimelineWrapperProps) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  return (
    <div>
      {/* Add Photo Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowPhotoModal(true)}
          className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span className="text-2xl">📸</span>
          <span>Add Photos</span>
        </button>
      </div>

      {/* Timeline Content */}
      {children}

      {/* Photo Modal */}
      {showPhotoModal && (
        <AddPhotoModal
          tripId={tripId}
          onClose={() => setShowPhotoModal(false)}
        />
      )}
    </div>
  );
}
