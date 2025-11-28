"use client";

import { useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar, Users, Wallet, Edit3, ArrowLeft, Share2 } from "lucide-react";
import EditTripModal from "./EditTripModal";

interface BudgetCategory {
  id: string;
  category: string;
  budgetAmount: number;
}

interface TripMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string | Date;
  endDate: string | Date;
  totalBudget: number;
  currency: string;
  description?: string | null;
  destinationImageUrl?: string | null;
  budgetCategories: BudgetCategory[];
  members: TripMember[];
}

interface TripHeaderProps {
  trip: Trip;
}

export default function TripHeader({ trip }: TripHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.name || trip.destination,
          text: `Check out my trip to ${trip.destination}!`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      {/* Hero Header */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-zinc-900">
        {trip.destinationImageUrl ? (
          <Image
            src={trip.destinationImageUrl}
            alt={trip.destination}
            fill
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />

        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between">
          <Link
            href="/trips"
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All Trips</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </div>
        </div>

        {/* Trip Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-white">
                <Users className="w-3 h-3" />
                {trip.members.length} Traveler{trip.members.length !== 1 && "s"}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 shadow-sm">
              {trip.name || trip.destination}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-zinc-300 text-sm sm:text-base font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-zinc-400" />
                {trip.destination}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-zinc-400" />
                {format(new Date(trip.startDate), "MMM d")} -{" "}
                {format(new Date(trip.endDate), "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-zinc-400" />
                Budget: ${trip.totalBudget.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditTripModal
        trip={trip}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}

