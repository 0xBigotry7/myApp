"use client";

import { useState } from "react";
import AddToTimelineModal from "./AddToTimelineModal";

interface TripTimelineWrapperProps {
  tripId: string;
  children: React.ReactNode;
}

export default function TripTimelineWrapper({ tripId, children }: TripTimelineWrapperProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div>
      {/* Add to Timeline Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-3 transform active:scale-95"
        >
          <span className="text-2xl">✨</span>
          <span>Add to Timeline</span>
        </button>
      </div>

      {/* Timeline Content */}
      {children}

      {/* Add to Timeline Modal */}
      {showAddModal && (
        <AddToTimelineModal
          tripId={tripId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
