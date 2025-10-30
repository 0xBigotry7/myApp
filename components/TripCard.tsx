"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";

interface TripCardProps {
  trip: {
    id: string;
    name: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    percentUsed: number;
    destinationImageUrl?: string | null;
  };
}

export default function TripCard({ trip }: TripCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    trip.destinationImageUrl || null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Generate image if not already generated
    if (!imageUrl && !isGenerating) {
      generateImage();
    }
  }, []);

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-destination-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: trip.destination }),
      });

      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.imageUrl);

        // Save image URL to database
        await fetch(`/api/trips/${trip.id}/update-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: data.imageUrl }),
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const daysUntilTrip = Math.ceil(
    (new Date(trip.startDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const daysOfTrip = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl shadow-lg transition-all duration-300 hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:hover:scale-[1.02]"
    >
      {/* Background Image with Overlay */}
      <div className="relative h-56 overflow-hidden sm:h-64 xl:h-72">
        {isGenerating ? (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 animate-pulse flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-5xl mb-3 animate-bounce">✨</div>
              <p className="font-semibold">Generating anime art...</p>
            </div>
          </div>
        ) : imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={trip.destination}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        )}

        {/* Days Until Trip Badge */}
        {daysUntilTrip > 0 && (
          <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-lg backdrop-blur-sm sm:right-4 sm:top-4 sm:text-sm">
            In {daysUntilTrip} days
          </div>
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
          <div className="space-y-3">
            <div>
              <h2 className="mb-1 text-2xl font-bold text-white transition-colors group-hover:text-yellow-300 drop-shadow-lg sm:text-3xl">
                {trip.destination}
              </h2>
              {trip.name && trip.name !== trip.destination && (
                <p className="text-sm font-medium text-white/90 drop-shadow sm:text-base">
                  {trip.name}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-white/90 drop-shadow sm:text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                <span>📅</span>
                <span className="font-medium whitespace-nowrap">
                  {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d")}
                </span>
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                <span>⏱️</span>
                <span className="font-medium whitespace-nowrap">{daysOfTrip} days</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Info Card */}
      <div className="bg-white p-4 sm:p-5">
        <div className="space-y-3 sm:space-y-4">
          {/* Budget Overview */}
          <div className="flex flex-col items-start justify-between gap-1 sm:flex-row sm:items-center">
            <span className="text-xs font-medium text-gray-500 sm:text-sm">Total Budget</span>
            <span className="text-lg font-bold text-transparent bg-gradient-sunset-pink bg-clip-text sm:text-xl">
              ${trip.totalBudget.toLocaleString()}
            </span>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Budget Used</span>
              <span
                className={`text-sm font-bold ${
                  trip.percentUsed > 100 ? "text-red-600" : "text-gray-900"
                }`}
              >
                {trip.percentUsed.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${
                  trip.percentUsed > 100
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : trip.percentUsed > 80
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                    : "bg-gradient-sunset-pink"
                }`}
                style={{
                  width: `${Math.min(trip.percentUsed, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Spent and Remaining */}
          <div className="grid grid-cols-1 gap-3 pt-3 border-t border-gray-100 sm:grid-cols-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-3">
              <p className="mb-1 text-xs font-medium text-blue-600">Spent</p>
              <p
                className={`text-lg font-bold ${
                  trip.percentUsed > 100 ? "text-red-600" : "text-blue-900"
                }`}
              >
                ${trip.totalSpent.toLocaleString()}
              </p>
            </div>
            <div
              className={`rounded-xl p-3 ${
              trip.remaining < 0
                ? "bg-gradient-to-br from-red-50 to-red-100"
                : "bg-gradient-to-br from-green-50 to-green-100"
              }`}
            >
              <p
                className={`mb-1 text-xs font-medium ${
                trip.remaining < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {trip.remaining < 0 ? "Over" : "Remaining"}
              </p>
              <p
                className={`text-lg font-bold ${
                trip.remaining < 0 ? "text-red-600" : "text-green-900"
                }`}
              >
                ${Math.abs(trip.remaining).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Effect Indicator */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl border-4 border-transparent transition-all duration-300 group-hover:border-yellow-400" />
    </Link>
  );
}
