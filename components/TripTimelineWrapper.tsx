"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import AddToTimelineModal from "./AddToTimelineModal";

interface TripTimelineWrapperProps {
  tripId: string;
  children: React.ReactNode;
}

export default function TripTimelineWrapper({ tripId, children }: TripTimelineWrapperProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="relative">
      {/* Desktop: Full-width button at top */}
      <div className="hidden sm:block mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full px-6 py-4 bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-100 dark:to-white text-white dark:text-zinc-900 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-zinc-300/50 dark:hover:shadow-zinc-900/50 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] border border-zinc-700 dark:border-zinc-200"
        >
          <Sparkles className="w-5 h-5" />
          <span>Add to Timeline</span>
        </button>
      </div>

      {/* Timeline Content */}
      {children}

      {/* Mobile: Floating Action Button - bottom right, easy thumb access */}
      <button
        onClick={() => setShowAddModal(true)}
        className="sm:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full shadow-lg shadow-zinc-400/30 dark:shadow-zinc-900/30 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Add to Timeline"
      >
        <Plus className="w-6 h-6" />
      </button>

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
